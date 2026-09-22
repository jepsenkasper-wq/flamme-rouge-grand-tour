import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LiveChatBubble from '@/components/LiveChatBubble';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  createLiveDraftOrder,
  fetchLivePlayers,
  makeLiveSpecialRiderPick,
  subscribeToLiveGame,
  unsubscribeFromLiveGame,
  type LivePlayer,
  type LiveGame,
  subscribeToLivePlayers,
  unsubscribeFromLivePlayers,
  setLiveSpecialRiderMode,
updateLiveGamePhase,
fetchLiveTeams,
type LiveTeam,
} from '@/lib/live/liveGames';

import { supabase } from '@/lib/supabase';

import {
  specialRiders,
  type SpecialRiderDefinition,
} from '@/lib/solo/specialRiders';

export default function LiveSpecialRidersScreen() {

    const params = useLocalSearchParams();

const gameId = String(params.gameId ?? '');
const playerId = String(params.playerId ?? '');

const [players, setPlayers] = useState<LivePlayer[]>([]);
const [teams, setTeams] = useState<LiveTeam[]>([]);
const [loading, setLoading] = useState(true);

const [game, setGame] = useState<LiveGame | null>(null);

useEffect(() => {
  let isMounted = true;

  let gameChannel:
    ReturnType<typeof subscribeToLiveGame> | null = null;

    let playersChannel:
  ReturnType<typeof subscribeToLivePlayers> | null = null;

  async function loadPlayers() {
    try {
      const [loadedPlayers, loadedTeams] =
  await Promise.all([
    fetchLivePlayers(gameId),
    fetchLiveTeams(gameId),
  ]);

      const { data: gameData, error: gameError } = await supabase
  .from('live_games')
  .select(
    'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase, draft_order, draft_round, draft_pick_index, draft_started, special_rider_mode'
  )
  .eq('id', gameId)
  .single();

if (gameError) {
  throw gameError;
}

const loadedGame: LiveGame = {
  id: gameData.id,
  joinCode: gameData.join_code,
  gameName: gameData.game_name,
  playerCount: Number(gameData.player_count),
  stageCount: Number(gameData.stage_count),
  restDayCount: Number(gameData.rest_day_count),
  restDayStages: gameData.rest_day_stages ?? [],
  phase: gameData.phase,
  draftOrder: gameData.draft_order ?? [],
  draftRound: Number(gameData.draft_round ?? 1),
  draftPickIndex: Number(gameData.draft_pick_index ?? 0),
  draftStarted: Boolean(gameData.draft_started),
  specialRiderMode:
  gameData.special_rider_mode ?? null,
};

      setPlayers(loadedPlayers);
setGame(loadedGame);
setTeams(loadedTeams);
    } catch (error) {
      console.error('LOAD LIVE PLAYERS ERROR', error);

      Alert.alert(
        'Could not load players',
        'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (gameId) {
    loadPlayers();
  }

  if (gameId) {
  gameChannel = subscribeToLiveGame(
    gameId,
    async () => {
      const { data, error } = await supabase
        .from('live_games')
        .select(
          'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase, draft_order, draft_round, draft_pick_index, draft_started, special_rider_mode'
        )
        .eq('id', gameId)
        .single();

      if (error) {
        console.error(
          'LIVE DRAFT REFRESH ERROR',
          error
        );
        return;
      }

      if (!isMounted) {
        return;
      }

      setGame({
        id: data.id,
        joinCode: data.join_code,
        gameName: data.game_name,
        playerCount: Number(data.player_count),
        stageCount: Number(data.stage_count),
        restDayCount: Number(data.rest_day_count),
        restDayStages: data.rest_day_stages ?? [],
        phase: data.phase,
        draftOrder: data.draft_order ?? [],
        draftRound: Number(data.draft_round ?? 1),
        draftPickIndex: Number(
          data.draft_pick_index ?? 0
        ),
        draftStarted: Boolean(data.draft_started),
        specialRiderMode:
  data.special_rider_mode ?? null,
      });

    const updatedPhase = data.phase;
const updatedSpecialRiderMode =
  data.special_rider_mode ?? null;


if (updatedPhase === 'review') {
  router.push({
  pathname: '/live-review-game',
  params: {
    gameId,
    playerId,
  },
});
  return;
}
    }
  );

  playersChannel = subscribeToLivePlayers(
  gameId,
  async () => {
    const updatedPlayers = await fetchLivePlayers(gameId);

    if (isMounted) {
      setPlayers(updatedPlayers);
    }
  }
);
}
return () => {
  isMounted = false;

  if (gameChannel) {
    void unsubscribeFromLiveGame(gameChannel);
  }
  if (playersChannel) {
  void unsubscribeFromLivePlayers(playersChannel);
}
};
}, [gameId]);

const currentPlayer = players.find(
  (player) => player.id === playerId
);

const isAdmin = currentPlayer?.isAdmin ?? false;

const currentDraftPlayerId =
  game?.draftStarted
    ? game.draftOrder[game.draftPickIndex]
    : undefined;

const currentDraftPlayer = players.find(
  (player) => player.id === currentDraftPlayerId
);

const isMyTurn =
  currentDraftPlayerId === playerId;

  const allowedRiderType =
  game?.draftRound === 2
    ? currentPlayer?.sprinteurSpecialRiderId
      ? 'rouleur'
      : currentPlayer?.rouleurSpecialRiderId
      ? 'sprinteur'
      : undefined
    : undefined;

const totalTeamCount = teams.length;

const maxSpecialRiderUses =
  totalTeamCount > 0 && totalTeamCount <= 3
    ? 1
    : 2;

function getSpecialRiderUseCount(
  riderId: string
) {
  return players.reduce((count, player) => {
    if (
      player.sprinteurSpecialRiderId === riderId ||
      player.rouleurSpecialRiderId === riderId
    ) {
      return count + 1;
    }

    return count;
  }, 0);
}

function isSpecialRiderUnavailable(
  riderId: string
) {
  return (
    getSpecialRiderUseCount(riderId) >=
    maxSpecialRiderUses
  );
}

const allSpecialRiders =
  Object.values(specialRiders) as SpecialRiderDefinition[];

const sprinteurSpecialRiders =
  allSpecialRiders.filter(
    (rider) => rider.riderType === 'sprinteur'
  );

const rouleurSpecialRiders =
  allSpecialRiders.filter(
    (rider) => rider.riderType === 'rouleur'
  );

  return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Special Riders
      </Text>

{loading ? (
  <ActivityIndicator size="large" />
) : !game?.specialRiderMode ? (
  isAdmin ? (
    <View style={styles.setupOptions}>
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            await setLiveSpecialRiderMode(
              gameId,
              'draft'
            );

            await createLiveDraftOrder(gameId);
          } catch (error) {
            console.error(
              'CREATE DRAFT ORDER ERROR',
              error
            );

            Alert.alert(
              'Could not create draft order',
              'Please try again.'
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          CREATE DRAFT ORDER
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={async () => {
  try {
    await setLiveSpecialRiderMode(
      gameId,
      'manual'
    );

    router.push({
      pathname: '/live-special-riders-manual',
      params: {
        gameId,
        playerId,
      },
    });
  } catch (error) {
    console.error(
      'MANUAL SPECIAL RIDERS ERROR',
      error
    );

    Alert.alert(
      'Could not continue',
      'Please try again.'
    );
  }
}}
      >
        <Text style={styles.buttonText}>
          PICK SPECIAL RIDERS MANUALLY
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
    onPress={async () => {
  try {
    await setLiveSpecialRiderMode(
      gameId,
      'none'
    );

    await updateLiveGamePhase(
      gameId,
      'review'
    );
  } catch (error) {
    console.error(
      'NO SPECIAL RIDERS ERROR',
      error
    );

    Alert.alert(
      'Could not continue',
      'Please try again.'
    );
  }
}}
      >
        <Text style={styles.buttonText}>
          NO SPECIAL RIDERS
        </Text>
      </Pressable>
    </View>
  ) : (
    <Text style={styles.waitingText}>
      Waiting for admin to choose Special Rider setup...
    </Text>
  )
) : null}

{game?.specialRiderMode === 'manual' && !isAdmin && (
  <Text style={styles.waitingText}>
    Admin is selecting Special Riders...
  </Text>
)}

{game?.draftStarted && (
  <View style={styles.draftCard}>
    <Text style={styles.draftTitle}>
      Draft Order
    </Text>

    {game.draftOrder.map((draftPlayerId, index) => {
      const draftPlayer = players.find(
        (player) => player.id === draftPlayerId
      );

      if (!draftPlayer) {
        return null;
      }

      return (
        <Text
          key={draftPlayerId}
          style={styles.draftPlayer}
        >
          {index + 1}. {draftPlayer.name}
        </Text>
      );
    })}

    <Text style={styles.draftStatus}>
      Round {game.draftRound}
    </Text>
    {currentDraftPlayer && (
  <View style={styles.turnBox}>
    <Text style={styles.turnText}>
      {isMyTurn
        ? 'Your turn – Choose a Special Rider'
        : `${currentDraftPlayer.name} is choosing...`}
    </Text>
  </View>
)}

{isMyTurn && (
  <View style={styles.specialRiderSection}>

    {(
      game.draftRound === 1 ||
      allowedRiderType === 'sprinteur'
    ) && (
  <>
    <Text style={styles.specialRiderTypeTitle}>
      Sprinteurs
    </Text>

    {sprinteurSpecialRiders.map((rider) => (
      <Pressable
  key={rider.id}
  disabled={isSpecialRiderUnavailable(rider.id)}
  style={[
    styles.specialRiderRow,
    isSpecialRiderUnavailable(rider.id) &&
      styles.specialRiderRowDisabled,
  ]}
  onPress={async () => {
          try {
            await makeLiveSpecialRiderPick(
              gameId,
              playerId,
              rider.id,
              rider.riderType,
              game.draftPickIndex,
              game.draftOrder,
              game.draftRound
            );
          } catch (error) {
            console.error(
              'SPECIAL RIDER PICK ERROR',
              error
            );

            Alert.alert(
              'Could not select rider',
              'Please try again.'
            );
          }
        }}
      >
        <Text style={styles.specialRiderName}>
          {rider.name}
        </Text>
      </Pressable>
    ))}
  </>
)}

{(
  game.draftRound === 1 ||
  allowedRiderType === 'rouleur'
) && (
  <>
    <Text style={styles.specialRiderTypeTitle}>
      Rouleurs
    </Text>

    {rouleurSpecialRiders.map((rider) => (
      <Pressable
  key={rider.id}
  disabled={isSpecialRiderUnavailable(rider.id)}
  style={[
    styles.specialRiderRow,
    isSpecialRiderUnavailable(rider.id) &&
      styles.specialRiderRowDisabled,
  ]}
  onPress={async () => {
          try {
            await makeLiveSpecialRiderPick(
              gameId,
              playerId,
              rider.id,
              rider.riderType,
              game.draftPickIndex,
              game.draftOrder,
              game.draftRound
            );
          } catch (error) {
            console.error(
              'SPECIAL RIDER PICK ERROR',
              error
            );

            Alert.alert(
              'Could not select rider',
              'Please try again.'
            );
          }
        }}
      >
        <Text style={styles.specialRiderName}>
          {rider.name}
        </Text>
      </Pressable>
    ))}
  </>
)}

  </View>
)}

  </View>
)}

</ScrollView>

<LiveChatBubble
  gameId={gameId}
  screenKey="live-special-riders"
/>

</View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  scrollView: {
  flex: 1,
},

  content: {
  padding: 24,
  paddingTop: 50,
  paddingBottom: 40,
},

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },

  text: {
    fontSize: 16,
    color: Colors.brown,
  },

button: {
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 20,
},

buttonText: {
  color: Colors.white,
  fontSize: 16,
  fontWeight: '900',
},

waitingText: {
  marginTop: 20,
  fontSize: 16,
  fontWeight: '800',
  color: Colors.brown,
  textAlign: 'center',
},

draftCard: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 18,
  padding: 18,
  marginTop: 20,
},

draftTitle: {
  fontSize: 22,
  fontWeight: '900',
  color: Colors.brown,
  marginBottom: 12,
},

draftPlayer: {
  fontSize: 18,
  fontWeight: '800',
  color: Colors.brown,
  marginBottom: 6,
},

draftStatus: {
  marginTop: 12,
  fontSize: 16,
  fontWeight: '900',
  color: Colors.red,
},
turnBox: {
  marginTop: 16,
  padding: 14,
  backgroundColor: Colors.paper,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Colors.border,
},

turnText: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.brown,
  textAlign: 'center',
},
specialRiderSection: {
  marginTop: 20,
},

specialRiderTypeTitle: {
  fontSize: 20,
  fontWeight: '900',
  color: Colors.red,
  marginTop: 14,
  marginBottom: 8,
},

specialRiderRow: {
  backgroundColor: Colors.paper,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
},

specialRiderName: {
  fontSize: 17,
  fontWeight: '800',
  color: Colors.brown,
},
specialRiderRowDisabled: {
  opacity: 0.4,
},
setupOptions: {
  gap: 12,
  marginTop: 20,
},
});