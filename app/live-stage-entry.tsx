import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { MaterialCommunityIcons, Ionicons, } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  Text,
  Keyboard,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import {
  fetchLivePlayers,
  fetchLiveTeams,
  fetchLiveStageState,
fetchLiveStageResults,
updateLiveStageResultField,
fetchLiveStageEntryRiderStates,
initializeLiveStageResultFatigue,
finishLiveStageEntry,
subscribeToLiveStageState,
unsubscribeFromLiveStageState,
unfinishLiveStageEntry,
type LiveStageState,
type LiveStageResult,
  type LivePlayer,
  type LiveTeam,
} from '@/lib/live/liveGames';
import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';

import {
  getFatigueCardsForStageResult,
} from '@/lib/solo/dummyDeckEngine';

import LiveChatBubble from '@/components/LiveChatBubble';

function getPlayerColor(colorName: string) {
  switch (colorName) {
    case 'Blue':
      return '#2f5fb3';
    case 'White':
      return '#f7f1df';
    case 'Green':
      return '#2f8a3e';
    case 'Red':
      return '#b7372f';
    case 'Black':
      return '#222222';
    case 'Pink':
      return '#d97aa7';
    default:
      return Colors.border;
  }
}

function formatSpecialRiderName(
  specialRiderId?: string
): string {
  if (!specialRiderId) {
    return '';
  }

  return specialRiderId
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(' ');
}

function formatTime(value: string, finalize = false) {
  const cleaned = value.replace(/[^\d:]/g, '');

  if (!cleaned) {
    return finalize ? '0:00' : '';
  }

  if (cleaned.includes(':')) {
    const [minutes = '', seconds = ''] = cleaned.split(':');

    const minuteNumber = Number(minutes || 0);

    if (!finalize) {
      return `${minuteNumber}:${seconds}`;
    }

    if (seconds === '') {
      return `${minuteNumber}:00`;
    }

    if (seconds.length === 1) {
      return `${minuteNumber}:${seconds}0`;
    }

    return `${minuteNumber}:${seconds.slice(0, 2)}`;
  }

  const digits = cleaned.replace(/\D/g, '');

  if (!finalize) {
    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
  }

  if (digits.length <= 2) {
    return `${Number(digits)}:00`;
  }

  return `${Number(digits.slice(0, -2))}:${digits
    .slice(-2)
    .padStart(2, '0')}`;
}


export default function LiveStageEntryScreen() {
  const [teams, setTeams] =
    useState<LiveTeam[]>([]);

const [players, setPlayers] =
  useState<LivePlayer[]>([]);

  const [loading, setLoading] =
    useState(true);

const [teamIndex, setTeamIndex] =
  useState(0);

const [stageState, setStageState] =
  useState<LiveStageState | null>(null);

const [selectedRider, setSelectedRider] =
  useState<'sprinteur' | 'rouleur'>(
    'rouleur'
  );

const [stageNumber, setStageNumber] =
  useState<number | null>(null);

const [results, setResults] =
  useState<LiveStageResult[]>([]);

  const liveSession =
    getActiveLiveGameSession();

  useEffect(() => {
    if (!liveSession) {
      setLoading(false);
      return;
    }

    let active = true;

    async function loadTeams() {
      try {
const [
  liveTeams,
  livePlayers,
  liveStageState,
  liveRiderStates,
] = await Promise.all([
  fetchLiveTeams(
    liveSession!.gameId
  ),
  fetchLivePlayers(
    liveSession!.gameId
  ),
  fetchLiveStageState(
    liveSession!.gameId
  ),
  fetchLiveStageEntryRiderStates(
    liveSession!.gameId
  ),
]);

if (liveStageState) {
  await Promise.all(
    liveRiderStates.map((row) =>
      initializeLiveStageResultFatigue(
        liveSession!.gameId,
        liveStageState.stageNumber,
        row.teamId,
        row.riderKey,
        getFatigueCardsForStageResult(
          row.riderState
        )
      )
    )
  );
}

const liveResults =
  liveStageState
    ? await fetchLiveStageResults(
        liveSession!.gameId,
        liveStageState.stageNumber
      )
    : [];


        if (active) {
          setTeams(liveTeams);
setPlayers(livePlayers);
setStageNumber(
  liveStageState?.stageNumber ?? null
);
setResults(liveResults);
setLoading(false);
setStageState(liveStageState);
        }
      } catch (error) {
        console.error(
          'FETCH LIVE STAGE ENTRY TEAMS ERROR',
          error
        );

        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeams();

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

          setStageState(updatedStageState);

        if (
          updatedStageState?.phase ===
          'stage-overview'
        ) {
          router.replace(
            '/live-stage-overview'
          );
        }
      } catch (error) {
        console.error(
          'LIVE STAGE ENTRY SYNC ERROR',
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
        <ActivityIndicator />
      </View>
    );
  }

  if (!liveSession) {
    return (
      <View style={styles.screen}>
        <Text style={styles.text}>
          Live game session not found.
        </Text>
      </View>
    );
  }

  const entryTeams = teams.filter(
    (team) => {
      if (
        team.teamType === 'human' &&
        team.ownerPlayerId ===
          liveSession.playerId
      ) {
        return true;
      }

      if (
        liveSession.isAdmin &&
        team.teamType !== 'human'
      ) {
        return true;
      }

      return false;
    }
  );

  const currentTeam =
  entryTeams[teamIndex];

  const currentOwnerPlayer =
  currentTeam?.teamType === 'human'
    ? players.find(
        (player) =>
          player.id ===
          currentTeam.ownerPlayerId
      )
    : undefined;


  const selectedSpecialRiderId =
  selectedRider === 'rouleur'
    ? currentTeam?.teamType === 'human'
      ? currentOwnerPlayer?.rouleurSpecialRiderId
      : currentTeam?.rouleurSpecialRiderId
    : currentTeam?.teamType === 'human'
      ? currentOwnerPlayer?.sprinteurSpecialRiderId
      : currentTeam?.sprinteurSpecialRiderId;

const currentResult = results.find(
  (result) =>
    result.teamId === currentTeam?.id &&
    result.riderKey === selectedRider
);

const currentTime =
  currentResult?.time ?? '';

const currentTourPoints =
  currentResult?.tourPoints ?? '';

const currentMountainPoints =
  currentResult?.mountainPoints ?? '';

const currentSprintPoints =
  currentResult?.sprintPoints ?? '';

const currentFatigueCards =
  currentResult?.fatigueCards ?? '';

async function updateResultField(
  field:
    | 'time'
    | 'tour_points'
    | 'mountain_points'
    | 'sprint_points'
    | 'fatigue_cards',
  value: string
) {
  if (
    !liveSession ||
    !currentTeam ||
    stageNumber === null
  ) {
    return;
  }

  const localField =
    field === 'tour_points'
      ? 'tourPoints'
      : field === 'mountain_points'
        ? 'mountainPoints'
        : field === 'sprint_points'
          ? 'sprintPoints'
          : field === 'fatigue_cards'
            ? 'fatigueCards'
            : 'time';

  setResults((currentResults) => {
    const existingIndex =
      currentResults.findIndex(
        (result) =>
          result.teamId === currentTeam.id &&
          result.riderKey === selectedRider
      );

    if (existingIndex >= 0) {
      const next = [...currentResults];

      next[existingIndex] = {
        ...next[existingIndex],
        [localField]: value,
      };

      return next;
    }

    return [
      ...currentResults,
      {
        id: '',
        gameId: liveSession.gameId,
        stageNumber,
        teamId: currentTeam.id,
        riderKey: selectedRider,
        time: '',
        tourPoints: '',
        mountainPoints: '',
        sprintPoints: '',
        fatigueCards: '',
        submitted: false,
        [localField]: value,
      },
    ];
  });

  try {
    await updateLiveStageResultField(
      liveSession.gameId,
      stageNumber,
      currentTeam.id,
      selectedRider,
      field,
      value
    );
  } catch (error) {
    console.error(
      'UPDATE LIVE STAGE RESULT ERROR',
      error
    );
  }
}

const riderSubtitle =
  currentTeam?.teamType === 'muscle'
    ? 'Muscle'
    : currentTeam?.teamType === 'peloton'
      ? 'Peloton'
      : formatSpecialRiderName(
          selectedSpecialRiderId
        );

const riderImage =
  selectedRider === 'sprinteur'
    ? require('@/assets/images/riders/rider-sprinteur.png')
    : require('@/assets/images/riders/rider-rouleur.png');

async function handleFinishStage() {
  if (!liveSession) {
    return;
  }

  try {
    const stageState =
      await fetchLiveStageState(
        liveSession.gameId
      );

    if (stageState?.phase === 'stage-entry') {
      await finishLiveStageEntry(
        liveSession.gameId
      );

      const updatedStageState =
        await fetchLiveStageState(
          liveSession.gameId
        );

        setStageState(updatedStageState);

      if (
        updatedStageState?.phase ===
        'stage-overview'
      ) {
        router.replace(
          '/live-stage-overview'
        );
      }

      return;
    }

    if (
      stageState?.phase ===
      'stage-overview'
    ) {
      router.replace(
        '/live-stage-overview'
      );
      return;
    }

    router.replace('/live-play-stage');
  } catch (error) {
    console.error(
      'FINISH LIVE STAGE ENTRY ERROR',
      error
    );
  }
}

const hasFinishedStageEntry =
  stageState?.stageEntryReadyPlayerIds.includes(
    liveSession?.playerId ?? ''
  ) ?? false;

const stageEntryReadyCount =
  stageState?.stageEntryReadyPlayerIds.length ?? 0;

return (
  <View style={styles.screen}>
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={150}
    >
      <Text style={styles.title}>
        STAGE ENTRY
      </Text>

      {currentTeam && (
  <>
    <View style={styles.entryHero}>
      <View style={styles.playerTitleRow}>
        <Text
          style={[
            styles.playerStar,
            {
              color: getPlayerColor(
  currentTeam.color ?? ''
)
            },
          ]}
        >
          ★
        </Text>

        <Text style={styles.playerTitle}>
          {currentTeam.name}
        </Text>

        <Text
          style={[
            styles.playerStar,
            {
              color: getPlayerColor(
                currentTeam.color ?? ''
              ),
            },
          ]}
        >
          ★
        </Text>
      </View>

   {riderSubtitle && (
  <Text style={styles.specialRiderLabel}>
    {riderSubtitle}
  </Text>
)}

      <Image
        source={riderImage}
        style={styles.riderImage}
        resizeMode="stretch"
      />

      <View style={styles.riderToggle}>
        <Pressable
          style={[
            styles.riderButton,
            selectedRider === 'rouleur' &&
              styles.activeButton,
          ]}
          onPress={() =>
            setSelectedRider('rouleur')
          }
        >
          <Text
            style={[
              styles.riderButtonText,
              selectedRider === 'rouleur' &&
                styles.activeButtonText,
            ]}
          >
            Rouleur
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.riderButton,
            selectedRider === 'sprinteur' &&
              styles.activeButton,
          ]}
          onPress={() =>
            setSelectedRider('sprinteur')
          }
        >
          <Text
            style={[
              styles.riderButtonText,
              selectedRider === 'sprinteur' &&
                styles.activeButtonText,
            ]}
          >
            Sprinteur
          </Text>
        </Pressable>
      </View>
    </View>

<View style={styles.resultsGrid}>
  <View style={styles.resultCard}>
     <View style={styles.resultHeader}>
    <MaterialCommunityIcons
      name="timer-outline"
      size={18}
      color={Colors.brown}
    />
    <Text style={styles.resultLabel}>
      Time
    </Text>
    </View>

    <TextInput
  style={styles.resultInput}
  value={currentTime}
  onChangeText={(value) =>
    updateResultField(
      'time',
      formatTime(value)
    )
  }
  onEndEditing={() =>
    updateResultField(
      'time',
      formatTime(currentTime, true)
    )
  }
  keyboardType="number-pad"
  placeholder="0:00"
/>
  </View>

  <View style={styles.resultCard}>
     <View style={styles.resultHeader}>
    <MaterialCommunityIcons
  name="trophy-outline"
  size={18}
  color={Colors.brown}
/>

    <Text style={styles.resultLabel}>
      Tour Points
    </Text>
    </View>



    <TextInput
      style={styles.resultInput}
      value={currentTourPoints}
      onChangeText={(value) =>
        updateResultField(
          'tour_points',
          value
        )
      }
      keyboardType="number-pad"
      placeholder="0"
    />
  </View>

  <View style={styles.resultCard}>
    <View style={styles.resultHeader}>
        <MaterialCommunityIcons
  name="image-filter-hdr"
  size={24}
  color={Colors.brown}
/>
    
    <Text style={styles.resultLabel}>
      Mountain Points
    </Text>
</View>
    <TextInput
      style={styles.resultInput}
      value={currentMountainPoints}
      onChangeText={(value) =>
        updateResultField(
          'mountain_points',
          value
        )
      }
      keyboardType="number-pad"
      placeholder="0"
    />
  </View>

  <View style={styles.resultCard}>
    <View style={styles.resultHeader}>
        <MaterialCommunityIcons
  name="flag-checkered"
  size={24}
  color={Colors.brown}
/>
    
    <Text style={styles.resultLabel}>
      Sprint Points
    </Text>
</View>
    <TextInput
      style={styles.resultInput}
      value={currentSprintPoints}
      onChangeText={(value) =>
        updateResultField(
          'sprint_points',
          value
        )
      }
      keyboardType="number-pad"
      placeholder="0"
    />
  </View>
 {(
  currentTeam.teamType === 'human' ||
  currentTeam.teamType === 'normal-ai'
) && (
  <View style={styles.fatigueCard}>
    <View style={styles.resultHeader}>
      <MaterialCommunityIcons
        name="cards-outline"
        size={24}
        color={Colors.brown}
      />

      <View style={styles.fatigueLabelRow}>
        <Text style={styles.resultLabel}>
          Fatigue Cards
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Fatigue Cards',
              'Shows the number of Fatigue Cards added to this rider during the current stage. Remember to manually adjust this number following the discard rules between stages and after Rest Days.'
            )
          }
        >
          <Ionicons
            name="help-circle-outline"
            size={18}
            color={Colors.brown}
          />
        </Pressable>
      </View>
    </View>

    <TextInput
      style={styles.resultInput}
      value={currentFatigueCards}
      onChangeText={(value) =>
        updateResultField(
          'fatigue_cards',
          value
        )
      }
      keyboardType="number-pad"
      placeholder="0"
    />
  </View>
)}
</View>

    <View style={styles.teamNavigation}>
      <Pressable
        style={[
          styles.button,
          teamIndex === 0 &&
            styles.disabledButton,
        ]}
        disabled={teamIndex === 0}
        onPress={() => {
  setTeamIndex((current) => current - 1);
  setSelectedRider('rouleur');
}}
      >
        <Text style={styles.buttonText}>
          PREVIOUS TEAM
        </Text>
      </Pressable>

      {teamIndex < entryTeams.length - 1 ? (
  <Pressable
    style={[
  styles.button,
  styles.teamNavigationButton,
]}
    onPress={() => {
  setTeamIndex((current) => current + 1);
  setSelectedRider('rouleur');
}}
  >
    <Text style={styles.buttonText}>
      NEXT TEAM
    </Text>
  </Pressable>
) : (
  <View style={{ flex: 1 }}>
    <Pressable
      style={[
        styles.button,
        hasFinishedStageEntry &&
          styles.disabledButton,
      ]}
      disabled={hasFinishedStageEntry}
      onPress={handleFinishStage}
    >
      <Text style={styles.buttonText}>
        {hasFinishedStageEntry
          ? 'STAGE FINISHED'
          : 'FINISH STAGE'}
      </Text>
    </Pressable>

    {hasFinishedStageEntry && (
      <Text style={styles.saveStatus}>
        Waiting for other players ·{' '}
        {stageEntryReadyCount}/{players.length} ready
      </Text>
    )}
  </View>
)}
    </View>
  </>
)}

        </KeyboardAwareScrollView>

    <LiveChatBubble
      gameId={liveSession.gameId}
      screenKey="live-stage-entry"
    />
  </View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 2,
  },

  scrollView: {
  flex: 1,
},

  title: {
    fontFamily: 'BebasNeue',
    fontSize: 32,
    color: Colors.brown,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },

  text: {
    color: Colors.brown,
    textAlign: 'center',
  },

  teamText: {
    color: Colors.brown,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },

  button: {
    backgroundColor: Colors.red,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: -2,
  },

  buttonText: {
    color: Colors.white,
    fontWeight: '900',
  },

  entryHero: {
  backgroundColor:
    'rgba(250, 241, 222, 0.72)',
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 18,
  padding: 14,
  alignItems: 'center',
},

playerTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
},

playerTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 30,
  color: Colors.brown,
  letterSpacing: 1,
},

playerStar: {
  fontSize: 22,
},

riderImage: {
  width: '100%',
  height: 140,
},

riderToggle: {
  flexDirection: 'row',
  backgroundColor: Colors.card,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: 4,
  width: '100%',
},

riderButton: {
  flex: 1,
  alignItems: 'center',
  paddingVertical: 10,
  borderRadius: 999,
},

activeButton: {
  backgroundColor: Colors.red,
},

riderButtonText: {
  color: Colors.brown,
  fontWeight: '900',
},

activeButtonText: {
  color: Colors.white,
},

teamNavigation: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 16,
},

teamNavigationButton: {
  flex: 1,
},

disabledButton: {
  opacity: 0.35,
},
specialRiderLabel: {
  fontSize: 12,
  color: Colors.brown,
  opacity: 0.65,
  textAlign: 'center',
  marginTop: -4,
  marginBottom: 2,
},
resultsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  rowGap: 4,
  marginTop: 6,
},

resultCard: {
  width: '48.5%',
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  padding: 6,
},

resultLabel: {
  fontSize: 12,
  fontWeight: '800',
  color: Colors.brown,
  textAlign: 'center',
  marginBottom: 4,
},

resultInput: {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  paddingVertical: 7,
  paddingHorizontal: 8,
  fontSize: 17,
  color: Colors.brown,
  textAlign: 'center',
},

content: {
  flexGrow: 1,
  padding: -10,
},

resultHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  marginBottom: 4,
},
fatigueCard: {
  width: '100%',
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  padding: 10,
},
fatigueLabelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
},

saveStatus: {
  marginTop: 6,
  textAlign: 'center',
  fontSize: 12,
  fontWeight: '700',
  color: Colors.brown,
},

});