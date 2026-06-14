import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { saveGame } from '@/lib/storage';
import { saveGameToLibrary } from '@/lib/storage';

export default function ReviewGameScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const restDayStages = createGameDraft.restDayStages;

  return (
  <View style={styles.screen}>
      <Image
        source={require('@/assets/images/background-blackwhite.png')}
        style={styles.watermark}
        resizeMode="cover"
      />
    <ScrollView
      contentContainerStyle={styles.content}>
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
onPress={async () => {
  gameResults.entries = [];

  gameState.currentStage = 1;
  gameState.currentEntryType = 'stage';

  stageDraft.initialize(createGameDraft.playerNames.length);

  await saveGameToLibrary();
  await saveGame();

  router.replace('/(tabs)');
}}>
  <Text style={styles.buttonText}>Create Game</Text>
</Pressable>

    </ScrollView>
    </View>
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
  paddingTop: 20,
  paddingBottom: 40,
},
watermark: {
  position: 'absolute',
  width: 500,
  height: 700,
  right: -120,
  bottom: 0,
  opacity: 0.2,
},
});