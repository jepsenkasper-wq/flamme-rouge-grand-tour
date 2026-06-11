import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { gameResults } from '@/lib/gameResults';

export default function EditGameSettingsScreen() {
  const [gameName, setGameName] = useState(createGameDraft.gameName);
  
  const highestCompletedStage = Math.max(
  1,
  ...gameResults.entries
    .filter((entry) => entry.entryType === 'stage')
    .map((entry) => entry.stageNumber)
);

const [stages, setStages] = useState(
  Number(createGameDraft.stages || 21)
);

const [restDayStage, setRestDayStage] = useState(1);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Game Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Game Name</Text>

        <TextInput
          style={styles.input}
          value={gameName}
          onChangeText={setGameName}
        />

        <Text style={styles.label}>Number of Stages</Text>

<View style={styles.stepperRow}>
  <Pressable
    style={[
      styles.stepperButton,
      stages <= highestCompletedStage && styles.disabledButton,
    ]}
    disabled={stages <= highestCompletedStage}
    onPress={() => setStages((value) => value - 1)}>
    <Text style={styles.stepperButtonText}>−</Text>
  </Pressable>

  <Text style={styles.stageCount}>{stages}</Text>

  <Pressable
    style={[
      styles.stepperButton,
      stages >= 21 && styles.disabledButton,
    ]}
    disabled={stages >= 21}
    onPress={() => setStages((value) => value + 1)}>
    <Text style={styles.stepperButtonText}>+</Text>
  </Pressable>
</View>

<Text style={styles.helperText}>
  Minimum: {highestCompletedStage} completed stage
  {highestCompletedStage === 1 ? '' : 's'}
</Text>

        
    <Text style={styles.label}>Add Rest Day after Stage</Text>

<View style={styles.stepperRow}>
  <Pressable
    style={[
      styles.stepperButton,
      restDayStage <= 1 && styles.disabledButton,
    ]}
    disabled={restDayStage <= 1}
    onPress={() => setRestDayStage((value) => value - 1)}>
    <Text style={styles.stepperButtonText}>−</Text>
  </Pressable>

  <Text style={styles.stageCount}>{restDayStage}</Text>

  <Pressable
    style={[
      styles.stepperButton,
      restDayStage >= stages - 1 && styles.disabledButton,
    ]}
    disabled={restDayStage >= stages - 1}
    onPress={() => setRestDayStage((value) => value + 1)}>
    <Text style={styles.stepperButtonText}>+</Text>
  </Pressable>
</View>

<Pressable
  style={styles.secondaryButton}
  onPress={() => {
    const existing = createGameDraft.restDayStages.map(Number);

    if (!existing.includes(restDayStage)) {
      createGameDraft.restDayStages.push(String(restDayStage));

      saveGame();
      updateActiveSavedGame();
    }
  }}>
  <Text style={styles.secondaryButtonText}>
    Add Rest Day
  </Text>
 </Pressable> 

<Text style={styles.label}>Current Rest Days</Text>

{createGameDraft.restDayStages.length === 0 ? (
  <Text style={styles.helperText}>No rest days added</Text>
) : (
  createGameDraft.restDayStages
    .map(Number)
    .sort((a, b) => a - b)
    .map((stage) => (
      <Text key={stage} style={styles.restDayText}>
        After Stage {stage}
      </Text>
    ))
)}

<Pressable
          style={styles.button}
          onPress={() => {
  createGameDraft.gameName = gameName;
  createGameDraft.stages = String(stages);

  saveGame();
  updateActiveSavedGame();

  router.back();
}}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
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

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.red,
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
    marginBottom: 18,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  stepperRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  marginBottom: 8,
},

stepperButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: Colors.red,
  alignItems: 'center',
  justifyContent: 'center',
},

stepperButtonText: {
  color: Colors.white,
  fontSize: 26,
  fontWeight: '900',
},

stageCount: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.brown,
  minWidth: 48,
  textAlign: 'center',
},

disabledButton: {
  opacity: 0.3,
},

helperText: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
  opacity: 0.7,
  marginBottom: 18,
  textAlign: 'center',
},
secondaryButton: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  padding: 14,
  alignItems: 'center',
  marginBottom: 18,
},

secondaryButtonText: {
  color: Colors.brown,
  fontWeight: '900',
},

restDayText: {
  fontSize: 16,
  fontWeight: '800',
  color: Colors.brown,
  marginBottom: 6,
},
});