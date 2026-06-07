import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';

const PLAYER_COLORS = ['Blue', 'White', 'Green', 'Red', 'Black', 'Pink'];

export default function PlayersScreen() {
  const params = useLocalSearchParams();

  const playerCount = Number(params.players ?? 4);

  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: playerCount }, () => '')
  );

  function updatePlayerName(index: number, value: string) {
    const nextNames = [...playerNames];
    nextNames[index] = value;
    setPlayerNames(nextNames);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Players</Text>

      {playerNames.map((name, index) => (
        <View key={index} style={styles.playerCard}>
          <Text style={styles.playerTitle}>Player {index + 1}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(value) => updatePlayerName(index, value)}
            placeholder={`Player ${index + 1}`}
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorBadge}>
            <Text style={styles.colorText}>{PLAYER_COLORS[index]}</Text>
          </View>
        </View> 
      ))}

     <Pressable
        style={styles.button}
        onPress={() => router.push('/rest-days')}>
        <Text style={styles.buttonText}>Next</Text>
      </Pressable>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  playerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 16,
  },
  colorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  colorText: {
    color: Colors.brown,
    fontWeight: '800',
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