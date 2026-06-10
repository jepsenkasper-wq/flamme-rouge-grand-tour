import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { saveGame } from '@/lib/storage';

export default function ReviewGameScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const restDayStages = createGameDraft.restDayStages;

  return (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Game</Text>

      <Text style={styles.text}>Game name: {createGameDraft.gameName}</Text>
      <Text style={styles.text}>Stages: {createGameDraft.stages}</Text>
      <Text style={styles.text}>Rest days: {createGameDraft.restDays}</Text>

      <Text style={styles.sectionTitle}>Players</Text>

      {playerNames.map((name: string, index: number) => (
        <Text key={index} style={styles.text}>
          {index + 1}. {name || `Player ${index + 1}`} ({playerColors[index]})
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Rest Days</Text>

      {restDayStages.map((stage: string, index: number) => (
        <Text key={index} style={styles.text}>
          Rest Day {index + 1}: After Stage {stage || '-'}
        </Text>
      ))}

    <Pressable
  style={styles.button}
  onPress={() => {
  gameResults.entries = [];

  gameState.currentStage = 1;
  gameState.currentEntryType = 'stage';

  stageDraft.initialize(createGameDraft.playerNames.length);

  saveGame();

  router.replace('/(tabs)');
}}>
  <Text style={styles.buttonText}>Create Game</Text>
</Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
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
content: {
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
},
});