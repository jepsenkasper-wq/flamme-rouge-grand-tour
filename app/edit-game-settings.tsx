import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Alert,
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
import { getClassificationBonusRules } from '@/lib/classifications';
import BackgroundWatermark from '@/components/BackgroundWatermark';

function getStageCategory(numberOfStages: number) {
  if (numberOfStages <= 7) return 'short';
  if (numberOfStages <= 14) return 'medium';
  return 'long';
}

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

const [restDays, setRestDays] = useState(
  createGameDraft.restDayStages.map(Number)
);

const [, setRefreshVersion] = useState(0);

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />
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
    const updatedRestDays = [...restDays, restDayStage]
      .filter((stage, index, array) => array.indexOf(stage) === index)
      .sort((a, b) => a - b);

    setRestDays(updatedRestDays);
    createGameDraft.restDayStages = updatedRestDays.map(String);

    saveGame();
    updateActiveSavedGame();
  }}>
  <Text style={styles.secondaryButtonText}>
    Add Rest Day
  </Text>
</Pressable> 

<Text style={styles.label}>Current Rest Days</Text>

{restDays.length === 0 ? (
  <Text style={styles.helperText}>No rest days added</Text>
) : (
  restDays.map((stage) => (
    <Text key={stage} style={styles.restDayText}>
      After Stage {stage}
    </Text>
  ))
)}

<Pressable
          style={styles.button}
   onPress={() => {
  const oldStages = Number(createGameDraft.stages || 21);
  const oldCategory = getStageCategory(oldStages);
  const newCategory = getStageCategory(stages);

  const saveSettings = (resetScoringRules: boolean) => {
    createGameDraft.gameName = gameName;
    createGameDraft.stages = String(stages);

    if (resetScoringRules) {
      createGameDraft.scoringRules =
        getClassificationBonusRules(stages);
    }

    saveGame();
    updateActiveSavedGame();

    router.back();
  };

  if (oldCategory !== newCategory) {
    Alert.alert(
      'Tour category changed',
      'The default scoring rules for this tour length are different. Do you want to reset scoring rules to the recommended values?',
      [
        {
          text: 'Keep Current Rules',
          style: 'cancel',
          onPress: () => saveSettings(false),
        },
        {
          text: 'Reset Rules',
          style: 'destructive',
          onPress: () => saveSettings(true),
        },
      ]
    );

    return;
  }

  saveSettings(false);
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
    paddingTop: 20,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 8,
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