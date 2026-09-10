import { useEffect, useState } from 'react';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  fetchLiveGame,
  applyLiveGameData,
  fetchLivePlayers,
  type LiveGame,
} from '@/lib/live/liveGames';
import {
  setActiveLiveGameSession,
} from '@/lib/live/activeLiveGame';
import { saveLiveGameToLibrary } from '@/lib/storage';

export default function LiveGameScreen() {
  const params = useLocalSearchParams();

  const gameId = String(params.gameId ?? '');
  const playerId = String(params.playerId ?? '');

  const [game, setGame] = useState<LiveGame | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGame() {
  try {
    const loadedGame = await fetchLiveGame(gameId);

    if (!loadedGame.gameData) {
      throw new Error('Live game data is missing.');
    }

    const players = await fetchLivePlayers(gameId);

    const currentPlayer = players.find(
      (player) => player.id === playerId
    );

    if (!currentPlayer) {
      throw new Error(
        'Could not find current live player.'
      );
    }

    applyLiveGameData(
      loadedGame.gameData
    );

    setActiveLiveGameSession({
      gameId,
      playerId,
      isAdmin: currentPlayer.isAdmin,
    });

    await saveLiveGameToLibrary(
  gameId,
  playerId,
  currentPlayer.isAdmin
);

    router.replace('/(tabs)');
  } catch (error) {
    console.error(
      'LOAD ACTIVE LIVE GAME ERROR',
      error
    );

    Alert.alert(
      'Could not load game',
      'Please try again.'
    );

    setLoading(false);
  }
}

    if (gameId) {
      loadGame();
    }
  }, [gameId]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <BackgroundWatermark />

        <View style={styles.loading}>
          <ActivityIndicator size="large" />

          <Text style={styles.text}>
            Loading Live Game...
          </Text>
        </View>
      </View>
    );
  }

  if (!game?.gameData) {
    return (
      <View style={styles.screen}>
        <BackgroundWatermark />

        <Text style={styles.title}>
          Live Game
        </Text>

        <Text style={styles.text}>
          No active game data found.
        </Text>
      </View>
    );
  }

  const setup = game.gameData.setup;
  const state = game.gameData.state;

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <Text style={styles.title}>
        {setup.gameName}
      </Text>

      <Text style={styles.stage}>
        Stage {state.currentStage} of {setup.stages}
      </Text>

      <Text style={styles.sectionTitle}>
        Players
      </Text>

      {setup.playerNames.map((name, index) => (
        <View
          key={`${name}-${index}`}
          style={styles.playerRow}
        >
          <Text style={styles.playerName}>
            {name}
          </Text>

          <Text style={styles.playerColor}>
            {setup.playerColors[index]}
          </Text>
        </View>
      ))}

      <Text style={styles.debugText}>
        Player ID: {playerId}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 50,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 12,
  },

  stage: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.red,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 12,
  },

  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },

  playerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  playerColor: {
    fontSize: 16,
    color: Colors.brown,
  },

  text: {
    fontSize: 16,
    color: Colors.brown,
    marginTop: 12,
  },

  debugText: {
    fontSize: 12,
    color: Colors.brown,
    marginTop: 30,
    opacity: 0.6,
  },
});