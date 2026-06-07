import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';

export default function CreateGameScreen() {
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState('4');
  const [stages, setStages] = useState('21');
  const [restDays, setRestDays] = useState('2');

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create Game</Text>

      <Text style={styles.label}>Game Name</Text>
      <TextInput
        style={styles.input}
        value={gameName}
        onChangeText={setGameName}
        placeholder="Grand Tour 2026"
      />

      <Text style={styles.label}>Players</Text>
      <TextInput
        style={styles.input}
        value={players}
        onChangeText={setPlayers}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Stages</Text>
      <TextInput
        style={styles.input}
        value={stages}
        onChangeText={setStages}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Rest Days</Text>
      <TextInput
        style={styles.input}
        value={restDays}
        onChangeText={setRestDays}
        keyboardType="number-pad"
      />

      <Pressable
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: '/players',
      params: {
        gameName,
        players,
        stages,
        restDays,
      },
    })
  }>
  <Text style={styles.buttonText}>Next</Text>
</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 72,
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
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});