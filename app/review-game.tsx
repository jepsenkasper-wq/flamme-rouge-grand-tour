import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';

export default function ReviewGameScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const restDayStages = createGameDraft.restDayStages;

  return (
    <View style={styles.screen}>
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
});