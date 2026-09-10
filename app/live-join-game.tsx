import { useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  createLivePlayer,
  fetchLiveGameByJoinCode,
  fetchLivePlayers,
} from '@/lib/live/liveGames';

import { saveLivePlayerIdentity } from '@/lib/livePlayerIdentity';

export default function LiveJoinGameScreen() {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);

  async function joinGame() {
    Keyboard.dismiss();

    const cleanCode = joinCode.trim().toUpperCase();
    const cleanName = playerName.trim();

    if (!cleanCode) {
      Alert.alert(
        'Join Code Required',
        'Please enter a join code.'
      );
      return;
    }

    if (!cleanName) {
      Alert.alert(
        'Name Required',
        'Please enter your name.'
      );
      return;
    }

    try {
      setJoining(true);

      const game = await fetchLiveGameByJoinCode(cleanCode);

      if (game.phase !== 'lobby') {
        Alert.alert(
          'Game Already Started',
          'This game is no longer accepting new players.'
        );
        return;
      }

      const currentPlayers = await fetchLivePlayers(game.id);

      if (currentPlayers.length >= game.playerCount) {
        Alert.alert(
          'Game Full',
          'All player spots in this game are already taken.'
        );
        return;
      }

      const nameAlreadyUsed = currentPlayers.some(
        (player) =>
          player.name.trim().toLowerCase() ===
          cleanName.toLowerCase()
      );

      if (nameAlreadyUsed) {
        Alert.alert(
          'Name Already Used',
          'Please choose a different player name.'
        );
        return;
      }

      const player = await createLivePlayer(
  game.id,
  cleanName,
  false
);

if (!player.playerToken) {
  throw new Error('Live player token is missing.');
}

await saveLivePlayerIdentity({
  gameId: game.id,
  playerId: player.id,
  playerToken: player.playerToken,
});

router.replace({
  pathname: '/live-lobby',
  params: {
    gameId: game.id,
    playerId: player.id,
  },
});
    } catch (error) {
      console.error('JOIN LIVE GAME ERROR', error);

      Alert.alert(
        'Game Not Found',
        'No Live Play game exists with that join code.'
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={styles.screen}>
        <BackgroundWatermark />

        <Text style={styles.title}>Join Live Game</Text>

        <Text style={styles.label}>Join Code</Text>

        <TextInput
          style={styles.input}
          value={joinCode}
          onChangeText={setJoinCode}
          placeholder="LIVE-1234"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <Text style={styles.label}>Your Name</Text>

        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Player name"
          autoCorrect={false}
        />

        <Pressable
          style={[
            styles.button,
            joining && styles.buttonDisabled,
          ]}
          disabled={joining}
          onPress={joinGame}
        >
          {joining ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>
              JOIN GAME
            </Text>
          )}
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 50,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },

  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 18,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});