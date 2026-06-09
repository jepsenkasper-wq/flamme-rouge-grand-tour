import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { stageDraft } from '@/lib/stageDraft';
import { gameState } from '@/lib/gameState';

function formatTimeInput(value: string) {
  const digits = value.replace(/\D/g, '');

  if (digits.length <= 2) {
    return digits;
  }

  const minutes = digits.slice(0, -2);
  const seconds = digits.slice(-2);

  return `${minutes}:${seconds}`;
}

export default function PlayerEntryScreen() {
  const params = useLocalSearchParams();
  const playerIndex = Number(params.playerIndex ?? 0);

  const playerName =
    createGameDraft.playerNames[playerIndex] || `Player ${playerIndex + 1}`;
    
const playerCount = createGameDraft.playerNames.length;


const [selectedRider, setSelectedRider] = useState<'sprinteur' | 'rouleur'>(
  'sprinteur'
);

const currentEntry = stageDraft.players[playerIndex][selectedRider];

function goToPlayer(nextIndex: number) {
  router.replace({
    pathname: '/player-entry',
    params: {
      playerIndex: String(nextIndex),
    },
  });
}

const [, setDraftVersion] = useState(0);

function updateEntry(field: keyof typeof currentEntry, value: string) {
  currentEntry[field] = value;
  setDraftVersion((version) => version + 1);
}

  return (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.stageTitle}>
  Stage {gameState.currentStage}
</Text>
      <Text style={styles.playerTitle}>{playerName}</Text>

      <View style={styles.riderToggle}>
  <Pressable
    style={[
      styles.riderButton,
      selectedRider === 'sprinteur' && styles.activeButton,
    ]}
    onPress={() => setSelectedRider('sprinteur')}>
    <Text
      style={[
        styles.riderButtonText,
        selectedRider === 'sprinteur' && styles.activeButtonText,
      ]}>
      Sprinteur
    </Text>
  </Pressable>

  <Pressable
    style={[
      styles.riderButton,
      selectedRider === 'rouleur' && styles.activeButton,
    ]}
    onPress={() => setSelectedRider('rouleur')}>
    <Text
      style={[
        styles.riderButtonText,
        selectedRider === 'rouleur' && styles.activeButtonText,
      ]}>
      Rouleur
    </Text>
  </Pressable>
</View>

      <View style={styles.card}>
        <Text style={styles.label}>Time</Text>
        <TextInput
  style={styles.input}
  value={currentEntry.time}
  onChangeText={(value) =>
    updateEntry('time', formatTimeInput(value))
  }
  keyboardType="number-pad"
  placeholder="0:00"
/>

        <Text style={styles.label}>Tour Points</Text>
        <TextInput
  style={styles.input}
  value={currentEntry.tourPoints}
  onChangeText={(value) => updateEntry('tourPoints', value)}
  keyboardType="number-pad"
/>
        <Text style={styles.label}>Mountain Points</Text>
        <TextInput
  style={styles.input}
  value={currentEntry.mountainPoints}
  onChangeText={(value) => updateEntry('mountainPoints', value)}
  keyboardType="number-pad"
/>

        <Text style={styles.label}>Sprint Points</Text>
        <TextInput
  style={styles.input}
  value={currentEntry.sprintPoints}
  onChangeText={(value) => updateEntry('sprintPoints', value)}
  keyboardType="number-pad"
/>

        <Text style={styles.label}>Fatigue Cards</Text>
        <TextInput
  style={styles.input}
  value={currentEntry.fatigueCards}
  onChangeText={(value) => updateEntry('fatigueCards', value)}
  keyboardType="number-pad"
/>
      </View>
      <View style={styles.navigationRow}>
  <Pressable
    style={[
      styles.navButton,
      playerIndex === 0 && styles.disabledButton,
    ]}
    disabled={playerIndex === 0}
    onPress={() => goToPlayer(playerIndex - 1)}>
    <Text style={styles.navButtonText}>Previous Player</Text>
  </Pressable>

  <Pressable
  style={styles.navButton}
  onPress={() => {
    if (playerIndex === playerCount - 1) {
  const restDayStages = createGameDraft.restDayStages.map(Number);

  if (
    gameState.currentEntryType === 'stage' &&
    restDayStages.includes(gameState.currentStage)
  ) {
    gameState.currentEntryType = 'restDay';
  } else {
    gameState.currentStage = Number(gameState.currentStage || 1) + 1;
    gameState.currentEntryType = 'stage';
  }

  router.replace('/(tabs)');
} else {
  goToPlayer(playerIndex + 1);
}
  }}>
  <Text style={styles.navButtonText}>
    {playerIndex === playerCount - 1 ? 'Finish Stage' : 'Next Player'}
  </Text>
</Pressable>
</View>
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
  stageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 8,
  },
  playerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.brown,
    textAlign: 'center',
    marginBottom: 20,
  },
  riderToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 20,
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

  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 14,
  },
  navigationRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 20,
},

navButton: {
  flex: 1,
  backgroundColor: Colors.red,
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

disabledButton: {
  opacity: 0.35,
},

navButtonText: {
  color: Colors.white,
  fontWeight: '900',
  textAlign: 'center',
},
});