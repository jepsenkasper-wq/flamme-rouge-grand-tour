import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  fetchLiveStageResults,
  fetchLiveStageState,
  applyLiveGameData,
  fetchLiveTeams,
  markLiveStageSaveReady,
  fetchLivePlayers,
  fetchLiveGame,
  buildLiveStagePlayers,
  subscribeToLiveStageState,
unsubscribeFromLiveStageState,
completeLiveStage,
  type LivePlayer,
  type LiveGameData,
  type LiveStageResult,
  type LiveTeam,
  type LiveStageState,
} from '@/lib/live/liveGames';
import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

export default function LiveStageOverviewScreen() {
  const insets = useSafeAreaInsets();
  const liveSession = getActiveLiveGameSession();

  const [teams, setTeams] = useState<LiveTeam[]>([]);
  const [gameData, setGameData] =
  useState<LiveGameData | null>(null);
  const [players, setPlayers] =
  useState<LivePlayer[]>([]);

const [stageState, setStageState] =
  useState<LiveStageState | null>(null);

const [isSaving, setIsSaving] =
  useState(false);
  const [results, setResults] =
    useState<LiveStageResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!liveSession) {
        return;
      }

      try {
 const [
  liveTeams,
  livePlayers,
  liveStageState,
  liveGame,
] = await Promise.all([
  fetchLiveTeams(liveSession.gameId),
  fetchLivePlayers(liveSession.gameId),
  fetchLiveStageState(liveSession.gameId),
  fetchLiveGame(liveSession.gameId),
]);

        const liveResults = liveStageState
          ? await fetchLiveStageResults(
              liveSession.gameId,
              liveStageState.stageNumber
            )
          : [];

        if (active) {
          setTeams(liveTeams);
setPlayers(livePlayers);
setStageState(liveStageState);
setResults(liveResults);
setGameData(liveGame.gameData ?? null);
setLoading(false);
        }
      } catch (error) {
        console.error(
          'LOAD LIVE STAGE OVERVIEW ERROR',
          error
        );

        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

   useEffect(() => {
  if (!liveSession) {
    return;
  }

  const channel = subscribeToLiveStageState(
    liveSession.gameId,
    async () => {
      try {
        const updatedStageState =
          await fetchLiveStageState(
            liveSession.gameId
          );

        // Stage state still exists:
        // update the local overview state.
        if (updatedStageState) {
          setStageState(updatedStageState);
          return;
        }

        // Stage state has been deleted:
        // the stage has been completed.
        const updatedLiveGame =
          await fetchLiveGame(
            liveSession.gameId
          );

        if (!updatedLiveGame.gameData) {
          throw new Error(
            'Updated live game data not found'
          );
        }

        applyLiveGameData(
          updatedLiveGame.gameData
        );

        console.log(
          'LIVE STAGE COMPLETION RECEIVED',
          {
            nextStage:
              updatedLiveGame.gameData.state.currentStage,
            nextEntryType:
              updatedLiveGame.gameData.state.currentEntryType,
          }
        );

        router.dismissAll();
        router.replace('/(tabs)');
      } catch (error) {
        console.error(
          'LIVE STAGE COMPLETION SYNC ERROR',
          error
        );
      }
    }
  );

  return () => {
    void unsubscribeFromLiveStageState(
      channel
    );
  };
}, []);


  if (loading) {
    return (
      <View style={styles.screen}>
        <Text style={styles.loadingText}>
          Loading stage...
        </Text>
      </View>
    );
  }

 
  async function handleSaveStage() {
  if (!liveSession || isSaving) {
    return;
  }

  setIsSaving(true);

  try {
    await markLiveStageSaveReady(
      liveSession.gameId
    );

    const updatedStageState =
      await fetchLiveStageState(
        liveSession.gameId
      );

      if (!updatedStageState) {
  throw new Error(
    'Live stage state not found'
  );
}

    setStageState(updatedStageState);

    const allPlayersReady =
  updatedStageState.stageSaveReadyPlayerIds.length ===
  players.length;

console.log(
  'LIVE STAGE SAVE READY',
  {
    ready:
      updatedStageState.stageSaveReadyPlayerIds.length,
    total: players.length,
    allPlayersReady,
  }
);

if (allPlayersReady) {
  if (!gameData) {
    throw new Error(
      'Live game data not found'
    );
  }

  const playersToSave =
    buildLiveStagePlayers(
      teams,
      results,
      gameData.setup.teamIds
    );

await completeLiveStage(
  liveSession.gameId,
  updatedStageState.stageNumber,
  playersToSave
);

const updatedLiveGame =
  await fetchLiveGame(
    liveSession.gameId
  );

if (!updatedLiveGame.gameData) {
  throw new Error(
    'Updated live game data not found'
  );
}

applyLiveGameData(
  updatedLiveGame.gameData
);

console.log(
  'LIVE STAGE COMPLETED',
  {
    completedStage:
      updatedStageState.stageNumber,
    nextStage:
      updatedLiveGame.gameData.state.currentStage,
    nextEntryType:
      updatedLiveGame.gameData.state.currentEntryType,
  }
);

router.dismissAll();
router.replace('/(tabs)');
}

  } catch (error) {
    console.error(
      'MARK LIVE STAGE SAVE READY ERROR',
      error
    );
  } finally {
    setIsSaving(false);
  }
}

const saveReadyCount =
  stageState?.stageSaveReadyPlayerIds.length ?? 0;

const playerCount = players.length;

const hasSaved =
  stageState?.stageSaveReadyPlayerIds.includes(
    liveSession?.playerId ?? ''
  ) ?? false;

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: 40 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.title}>
          Review Stage
        </Text>

        {teams.map((team) => {
          const sprinteur = results.find(
            (result) =>
              result.teamId === team.id &&
              result.riderKey === 'sprinteur'
          );

          const rouleur = results.find(
            (result) =>
              result.teamId === team.id &&
              result.riderKey === 'rouleur'
          );

          const riderImage =
            riderImages[team.color ?? ''];

          const showFatigue =
            team.teamType === 'human' ||
            team.teamType === 'normal-ai';

          return (
            <View
              key={team.id}
              style={styles.card}
            >
              <View style={styles.playerHeader}>
                {riderImage && (
                  <Image
                    source={riderImage}
                    style={styles.playerAvatar}
                  />
                )}

                <Text style={styles.playerName}>
                  {team.name}
                </Text>
              </View>

              <View style={styles.reviewTable}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel} />
                  <Text style={styles.reviewValue}>
                    Sprinteur
                  </Text>
                  <Text style={styles.reviewValue}>
                    Rouleur
                  </Text>
                </View>

                <ReviewRow
                  label="Time"
                  sprinteur={sprinteur?.time}
                  rouleur={rouleur?.time}
                />

                <ReviewRow
                  label="Tour Points"
                  sprinteur={sprinteur?.tourPoints}
                  rouleur={rouleur?.tourPoints}
                />

                <ReviewRow
                  label="Mountain Points"
                  sprinteur={sprinteur?.mountainPoints}
                  rouleur={rouleur?.mountainPoints}
                />

                <ReviewRow
                  label="Sprint Points"
                  sprinteur={sprinteur?.sprintPoints}
                  rouleur={rouleur?.sprintPoints}
                />

                {showFatigue && (
                  <ReviewRow
                    label="Fatigue Cards"
                    sprinteur={sprinteur?.fatigueCards}
                    rouleur={rouleur?.fatigueCards}
                  />
                )}
              </View>
            </View>
          );
        })}

        <View style={styles.buttons}>
          <Pressable
            style={[
              styles.button,
              styles.secondaryButton,
            ]}
            onPress={() =>
  router.push('/live-stage-entry')
}
          >
            <Text style={styles.secondaryButtonText}>
              Back
            </Text>
          </Pressable>

          <View style={{ flex: 1 }}>
  <Pressable
    style={[
      styles.button,
      (hasSaved || isSaving) && {
        opacity: 0.5,
      },
    ]}
    disabled={hasSaved || isSaving}
    onPress={handleSaveStage}
  >
    <Text style={styles.buttonText}>
      {hasSaved
        ? 'STAGE SAVED'
        : 'SAVE STAGE'}
    </Text>
  </Pressable>

  {hasSaved && (
    <Text style={styles.saveStatus}>
      {saveReadyCount}/{playerCount} players ready
    </Text>
  )}
</View>
        </View>
      </ScrollView>
    </View>
  );
}

function ReviewRow({
  label,
  sprinteur,
  rouleur,
}: {
  label: string;
  sprinteur?: string;
  rouleur?: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>
        {label}
      </Text>

      <Text style={styles.reviewValue}>
        {sprinteur ?? ''}
      </Text>

      <Text style={styles.reviewValue}>
        {rouleur ?? ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
    padding: 24,
    paddingTop: 50,
  },

  loadingText: {
    marginTop: 80,
    textAlign: 'center',
    color: Colors.brown,
    fontWeight: '700',
  },

  title: {
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: Colors.brown,
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  playerAvatar: {
    width: 50,
    height: 50,
    marginRight: 8,
  },

  playerName: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.brown,
  },

  reviewTable: {
    marginTop: 6,
  },

  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },

  reviewLabel: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brown,
  },

  reviewValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: Colors.brown,
  },

  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  button: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  buttonText: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: '900',
  },

  secondaryButtonText: {
    color: Colors.brown,
    fontSize: 16,
    fontWeight: '900',
  },
  saveStatus: {
  marginTop: 8,
  textAlign: 'center',
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
},
});