import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { fetchGameByFollowCode } from '@/lib/remoteGames';
import { saveFollowedGame, openSavedGame } from '@/lib/storage';
import { router } from 'expo-router';

export default function FollowGameScreen() {
  const [followCode, setFollowCode] = useState('');

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Follow Game</Text>

      <TextInput
        value={followCode}
        onChangeText={setFollowCode}
        placeholder="FR-1234"
        autoCapitalize="characters"
        style={styles.input}
      />

      <Pressable
        style={styles.button}
        onPress={async () => {
  try {
    const game = await fetchGameByFollowCode(followCode);

const savedGame = await saveFollowedGame(game);

const didOpen = await openSavedGame(savedGame.id);

if (!didOpen) {
  Alert.alert('Error', 'Could not open followed game.');
  return;
}

Alert.alert(
  'Game Followed',
  `You are now following ${game.game_data.name}.`
);

router.replace('/(tabs)');
  } catch (error) {
    Alert.alert(
      'Not Found',
      'No game exists with that follow code.'
    );
  }
}}
      >
        <Text style={styles.buttonText}>FOLLOW GAME</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    justifyContent: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.brown,
  },

  input: {
    borderWidth: 1,
    borderColor: '#B8AA8A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    marginBottom: 16,
    fontSize: 18,
  },

  button: {
    backgroundColor: '#7A1D12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});