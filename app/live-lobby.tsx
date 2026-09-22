import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import LiveChatBubble from '@/components/LiveChatBubble';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  fetchLivePlayers,
  fetchLiveTeams,
  subscribeToLivePlayers,
  unsubscribeFromLivePlayers,
  subscribeToLiveGame,
  unsubscribeFromLiveGame,
  updateLiveGamePhase,
  type LivePlayer,
  type LiveGame,
  type LiveTeam,
} from '@/lib/live/liveGames';
import { supabase } from '@/lib/supabase';

function getPlayerColor(colorName?: string) {
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

export default function LiveLobbyScreen() {
  const params = useLocalSearchParams();

  const gameId = String(params.gameId ?? '');

  const playerId = String(params.playerId ?? '');

  const [game, setGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<LiveTeam[]>([]);

  useEffect(() => {
   let isMounted = true;

let playersChannel:
  ReturnType<typeof subscribeToLivePlayers> | null = null;

let gameChannel:
  ReturnType<typeof subscribeToLiveGame> | null = null;

    async function loadLobby() {
      try {
        const { data, error } = await supabase
          .from('live_games')
          .select(
  'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase, draft_order, draft_round, draft_pick_index, draft_started, special_rider_mode'
)
          .eq('id', gameId)
          .single();

        if (error) {
          throw error;
        }

        const liveGame: LiveGame = {
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
draftPickIndex: Number(data.draft_pick_index ?? 0),
draftStarted: Boolean(data.draft_started),
          specialRiderMode:
  data.special_rider_mode ?? null,
        };

        const [initialPlayers, initialTeams] =
  await Promise.all([
    fetchLivePlayers(gameId),
    fetchLiveTeams(gameId),
  ]);

       if (isMounted) {
  setGame(liveGame);
  setPlayers(initialPlayers);
  setTeams(initialTeams);
  setLoading(false);
}

        playersChannel = subscribeToLivePlayers(
          gameId,
          async () => {
            const updatedPlayers =
              await fetchLivePlayers(gameId);

            if (isMounted) {
              setPlayers(updatedPlayers);
            }
          }
        );

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
      console.error('LIVE GAME REFRESH ERROR', error);
      return;
    }

    if (!isMounted) {
      return;
    }

    const updatedGame: LiveGame = {
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
draftPickIndex: Number(data.draft_pick_index ?? 0),
draftStarted: Boolean(data.draft_started),
          specialRiderMode:
  data.special_rider_mode ?? null,
        };

    setGame(updatedGame);

    if (updatedGame.phase === 'special-riders') {
      router.replace({
        pathname: '/live-special-riders',
        params: {
          gameId,
          playerId,
        },
      });
    }
  }
);

           } catch (error) {
        console.error('LIVE LOBBY ERROR', error);

        Alert.alert(
          'Could not open lobby',
          'Please try again.'
        );
      }
    }

    if (gameId) {
      loadLobby();
    }

    return () => {
      isMounted = false;

     if (playersChannel) {
  void unsubscribeFromLivePlayers(playersChannel);
}

if (gameChannel) {
  void unsubscribeFromLiveGame(gameChannel);
}
    };
  }, [gameId]);

      const currentPlayer = players.find(
  (player) => player.id === playerId
);

const isAdmin = currentPlayer?.isAdmin ?? false;


  if (loading || !game) {
    return (
      <View style={styles.screen}>
        <BackgroundWatermark />

        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Opening lobby...
          </Text>
        </View>
      </View>
    );
  }

 return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        {game.gameName}
      </Text>

      {isAdmin && (
  <View style={styles.joinCodeCard}>
    <Text style={styles.joinCodeLabel}>
      Join Code
    </Text>

    <Text style={styles.joinCode}>
      {game.joinCode}
    </Text>

    <Text style={styles.joinCodeHelp}>
      Share this code with the other players.
    </Text>
  </View>
)}

      <Text style={styles.playerCount}>
        {players.length} / {game.playerCount} players joined
      </Text>

      {players.length >= game.playerCount ? (
  isAdmin ? (
    <Pressable
      style={styles.continueButton}
      onPress={async () => {
        try {
          await updateLiveGamePhase(
            game.id,
            'special-riders'
          );
        } catch (error) {
          console.error(
            'LIVE PHASE UPDATE ERROR',
            error
          );

          Alert.alert(
            'Could not continue',
            'Please try again.'
          );
        }
      }}
    >
      <Text style={styles.continueButtonText}>
        CONTINUE TO SPECIAL RIDERS
      </Text>
    </Pressable>
  ) : (
    <Text style={styles.waitingText}>
      Waiting for admin...
    </Text>
  )
) : (
  <Text style={styles.waitingText}>
    Waiting for players...
  </Text>
)}


      <View style={styles.card}>
        {players.map((player) => (
          <View
            key={player.id}
            style={styles.playerRow}
          >
         <View style={styles.playerNameRow}>
  <Text
    style={[
      styles.playerStar,
      { color: getPlayerColor(player.color) },
    ]}
  >
    ★
  </Text>

  <Text style={styles.playerName}>
    {player.name}
    {player.id === playerId ? ' (You)' : ''}
  </Text>
</View>

            {player.isAdmin && (
              <Text style={styles.adminLabel}>
                Admin
              </Text>
            )}
          </View>
        ))}
      </View>
      {teams.some(
  (team) => team.teamType !== 'human'
) && (
  <>
    <Text style={styles.sectionTitle}>
      Dummy Players
    </Text>

    <View style={styles.card}>
      {teams
        .filter(
          (team) =>
            team.teamType !== 'human'
        )
        .map((team) => (
          <View
            key={team.id}
            style={styles.playerRow}
          >
            <View style={styles.playerNameRow}>
              <Text
                style={[
                  styles.playerStar,
                  {
                    color: getPlayerColor(
                      team.color
                    ),
                  },
                ]}
              >
                ★
              </Text>

              <Text style={styles.playerName}>
                {team.name}
              </Text>
            </View>

            <Text style={styles.adminLabel}>
              {team.teamType === 'normal-ai'
                ? 'Normal AI'
                : team.teamType === 'muscle'
                ? 'Muscle'
                : 'Peloton'}
            </Text>
          </View>
        ))}
    </View>
  </>
)}
      </ScrollView>

      {players.length >= game.playerCount && (
        <LiveChatBubble
          gameId={game.id}
          screenKey="live-lobby"
        />
      )}
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
  paddingBottom: 50,
},

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.brown,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 12,
  },

  playerCount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.red,
    marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  playerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  adminLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.red,
  },

  joinCodeCard: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 18,
  padding: 18,
  alignItems: 'center',
  marginBottom: 20,
},

joinCodeLabel: {
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
  marginBottom: 8,
},

joinCode: {
  fontSize: 32,
  fontWeight: '900',
  color: Colors.red,
  letterSpacing: 2,
},

joinCodeHelp: {
  marginTop: 8,
  fontSize: 14,
  color: Colors.brown,
  textAlign: 'center',
},
playerNameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},

playerStar: {
  fontSize: 20,
  fontWeight: '900',
},

continueButton: {
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 20,
  marginBottom: 20,
},

continueButtonText: {
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
sectionTitle: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
  marginTop: 24,
  marginBottom: 10,
},
});