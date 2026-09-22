import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LiveChatBubble from '@/components/LiveChatBubble';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  confirmLiveGameReview,
  fetchLiveGame,
  fetchLivePlayers,
  subscribeToLiveGame,
  subscribeToLivePlayers,
  unsubscribeFromLiveGame,
  unsubscribeFromLivePlayers,
  updateLiveGamePhase,
  resetLiveSpecialRiderSetup,
  initializeLivePlayerRiders,
  initializeLiveGameData,
  fetchLiveTeams,
  type LiveGame,
  type LivePlayer,
  type LiveTeam,
  initializeLiveTeamRiders,
} from '@/lib/live/liveGames';
import { specialRiders } from '@/lib/solo/specialRiders';
import { useNavigation } from '@react-navigation/native';

function formatSpecialRiderName(
  specialRiderId?: string
): string {
  if (!specialRiderId) {
    return 'Normal';
  }

  const rider =
    specialRiders[
      specialRiderId as keyof typeof specialRiders
    ];

  return rider?.name ?? specialRiderId;
}

export default function LiveReviewGameScreen() {
  const params = useLocalSearchParams();

  const gameId = String(params.gameId ?? '');
  const playerId = String(params.playerId ?? '');

  const navigation = useNavigation();

  const allowNavigationRef = useRef(false);

  const [game, setGame] = useState<LiveGame | null>(null);
  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [teams, setTeams] = useState<LiveTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const insets = useSafeAreaInsets();

  const currentPlayer = players.find(
    (player) => player.id === playerId
  );

  const isAdmin = currentPlayer?.isAdmin ?? false;

  const allPlayersConfirmed =
    players.length > 0 &&
    players.every(
      (player) => player.reviewConfirmed
    );

    useEffect(() => {
  const unsubscribe = navigation.addListener(
    'beforeRemove',
    (event) => {

    
        if (allowNavigationRef.current) {
  return;
}
      if (
  !game ||
  !isAdmin ||
  game.phase !== 'review'
) {
  return;
}

const currentGame = game;

event.preventDefault();

async function handleAdminBack() {
  try {
    if (currentGame.specialRiderMode === 'manual') {
            await updateLiveGamePhase(
              gameId,
              'special-riders'
            );

            allowNavigationRef.current = true;

            router.replace({
              pathname: '/live-special-riders-manual',
              params: {
                gameId,
                playerId,
              },
            });

            return;
          }
 

          await resetLiveSpecialRiderSetup(
            gameId
          );

          allowNavigationRef.current = true;

          router.replace({
            pathname: '/live-special-riders',
            params: {
              gameId,
              playerId,
            },
          });
        } catch (error) {
          console.error(
            'REVIEW BACK ERROR',
            error
          );

          Alert.alert(
            'Could not go back',
            'Please try again.'
          );
        }
      }

      void handleAdminBack();
    }
  );

  return unsubscribe;
}, [
  navigation,
  game,
  isAdmin,
  gameId,
  playerId,
]);

  useEffect(() => {
    let isMounted = true;

    let gameChannel:
      ReturnType<typeof subscribeToLiveGame> | null = null;

    let playersChannel:
      ReturnType<typeof subscribeToLivePlayers> | null = null;

    async function loadReview() {
      try {
        const [
  loadedGame,
  loadedPlayers,
  loadedTeams,
] = await Promise.all([
  fetchLiveGame(gameId),
  fetchLivePlayers(gameId),
  fetchLiveTeams(gameId),
]);

        if (!isMounted) {
          return;
        }

        setGame(loadedGame);
        setPlayers(loadedPlayers);
        setTeams(loadedTeams);
        setLoading(false);
      } catch (error) {
        console.error(
          'LOAD LIVE REVIEW ERROR',
          error
        );

        if (isMounted) {
          setLoading(false);

          Alert.alert(
            'Could not load game',
            'Please try again.'
          );
        }
      }
    }


    if (gameId) {
      loadReview();

      gameChannel = subscribeToLiveGame(
        gameId,
        async () => {
          try {
            const updatedGame =
              await fetchLiveGame(gameId);

            if (isMounted) {
              setGame(updatedGame);
            }
          } catch (error) {
            console.error(
              'LIVE REVIEW GAME REFRESH ERROR',
              error
            );
          }
        }
      );

      playersChannel = subscribeToLivePlayers(
        gameId,
        async () => {
          try {
            const updatedPlayers =
              await fetchLivePlayers(gameId);

            if (isMounted) {
              setPlayers(updatedPlayers);
            }
          } catch (error) {
            console.error(
              'LIVE REVIEW PLAYERS REFRESH ERROR',
              error
            );
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
        void unsubscribeFromLivePlayers(
          playersChannel
        );
      }
    };
  }, [gameId]);

useEffect(() => {
  if (!game || isAdmin) {
    return;
  }

  if (game.phase === 'special-riders') {
    router.replace({
      pathname: '/live-special-riders',
      params: {
        gameId,
        playerId,
      },
    });

    return;
  }

  if (game.phase === 'active') {
    router.replace({
      pathname: '/live-game',
      params: {
        gameId,
        playerId,
      },
    });
  }
}, [
  game?.phase,
  isAdmin,
  gameId,
  playerId,
]);

  if (loading || !game) {
    return (
      <View style={styles.screen}>
        <BackgroundWatermark />

        <View style={styles.loading}>
          <Text style={styles.text}>
            Loading game...
          </Text>
        </View>
      </View>
    );
  }

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
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Review Game
        </Text>

        <Text style={styles.text}>
          Game name: {game.gameName}
        </Text>

        <Text style={styles.text}>
          Stages: {game.stageCount}
        </Text>

        <Text style={styles.text}>
          Rest days: {game.restDayCount}
        </Text>

        <Text style={styles.sectionTitle}>
  Teams
</Text>

{teams.map((team, index) => {
  const ownerPlayer = team.ownerPlayerId
    ? players.find(
        (player) => player.id === team.ownerPlayerId
      )
    : undefined;

  const sprinteurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.sprinteurSpecialRiderId
      : team.sprinteurSpecialRiderId;

  const rouleurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.rouleurSpecialRiderId
      : team.rouleurSpecialRiderId;

  const teamTypeLabel =
    team.teamType === 'human'
      ? 'Human'
      : team.teamType === 'normal-ai'
      ? 'Normal AI'
      : team.teamType === 'muscle'
      ? 'Muscle'
      : 'Peloton';

  return (
    <View
      key={team.id}
      style={styles.reviewCard}
    >
      <Text style={styles.reviewTitle}>
        {index + 1}. {team.name}
      </Text>

      <Text style={styles.text}>
        Colour: {team.color ?? '-'}
      </Text>

      <Text style={styles.text}>
        Type: {teamTypeLabel}
      </Text>

      {(team.teamType === 'human' ||
        team.teamType === 'normal-ai') && (
        <>
          <Text style={styles.text}>
            Rouleur:{' '}
            {formatSpecialRiderName(
              rouleurSpecialRiderId
            )}
          </Text>

          <Text style={styles.text}>
            Sprinteur:{' '}
            {formatSpecialRiderName(
              sprinteurSpecialRiderId
            )}
          </Text>
        </>
      )}

      {ownerPlayer && (
        <Text style={styles.confirmStatus}>
          {ownerPlayer.reviewConfirmed
            ? 'Ready'
            : 'Waiting for confirmation'}
        </Text>
      )}
    </View>
  );
})}

        <Text style={styles.sectionTitle}>
          Rest Days
        </Text>

        {game.restDayStages.length > 0 ? (
          game.restDayStages.map(
            (stage, index) => (
              <Text
                key={index}
                style={styles.text}
              >
                Rest Day {index + 1}: After Stage{' '}
                {stage || '-'}
              </Text>
            )
          )
        ) : (
          <Text style={styles.text}>
            No rest days
          </Text>
        )}

        {!currentPlayer?.reviewConfirmed && (
          <Pressable
            style={styles.button}
            onPress={async () => {
              try {
                await confirmLiveGameReview(
                  gameId,
                  playerId
                );
              } catch (error) {
                console.error(
                  'CONFIRM LIVE REVIEW ERROR',
                  error
                );

                Alert.alert(
                  'Could not confirm',
                  'Please try again.'
                );
              }
            }}
          >
            <Text style={styles.buttonText}>
              CONFIRM
            </Text>
          </Pressable>
        )}

        {currentPlayer?.reviewConfirmed &&
          !allPlayersConfirmed && (
            <Text style={styles.waitingText}>
              Waiting for the other players...
            </Text>
          )}

        {isAdmin && allPlayersConfirmed && (
          <Pressable
            style={styles.button}
           onPress={async () => {
  try {
    for (const team of teams) {
  const ownerPlayer =
    team.teamType === 'human'
      ? players.find(
          (player) =>
            player.id === team.ownerPlayerId
        )
      : undefined;

  await initializeLiveTeamRiders(
    gameId,
    team,
    ownerPlayer
  );
}

    await initializeLiveGameData(gameId);

    await updateLiveGamePhase(
      gameId,
      'active'
    );

    allowNavigationRef.current = true;

    router.replace({
      pathname: '/live-game',
      params: {
        gameId,
        playerId,
      },
    });
  } catch (error) {
    console.error(
      'START LIVE GAME ERROR',
      error
    );

    Alert.alert(
      'Could not start game',
      'Please try again.'
    );
  }
}}
          >
            <Text style={styles.buttonText}>
              START GAME
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <LiveChatBubble
        gameId={gameId}
        screenKey="live-review-game"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  content: {
    padding: 24,
    paddingTop: 20,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  text: {
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginTop: 24,
    marginBottom: 12,
  },

  reviewCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  reviewTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 8,
  },

  confirmStatus: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.red,
    marginTop: 4,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },

  waitingText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brown,
    textAlign: 'center',
    marginTop: 28,
  },
});