import { router, useFocusEffect } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { useCallback, useState } from 'react';
import BackgroundWatermark from '@/components/BackgroundWatermark';

export default function EditPlayersScreen() {
 const [, setRefreshVersion] = useState(0);

useFocusEffect(
  useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, [])
);
    return (
    <View style={styles.screen}>
      <BackgroundWatermark />
      <Text style={styles.title}>Players</Text>

   {createGameDraft.playerNames.map((name, index) => (
  <Pressable
    key={index}
    style={styles.playerRow}
    onPress={() =>
      router.push({
        pathname: '/edit-player',
        params: { playerIndex: String(index) },
      })
    }>
    <Text style={styles.playerName}>
      {name || `Player ${index + 1}`}
    </Text>

    <Text style={styles.playerColor}>
      {createGameDraft.playerColors[index]}
    </Text>

    <Text style={styles.arrow}>›</Text>
  </Pressable>
))}
      {createGameDraft.playerNames.length < 6 && (
  <Pressable
    style={styles.addButton}
    onPress={() => router.push('/add-player')}>
    <Text style={styles.addButtonText}>+ Add Player</Text>
  </Pressable>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  playerRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  playerColor: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.red,
  },
  arrow: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.red,
  marginLeft: 10,
},
addButton: {
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 12,
},

addButtonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},

});