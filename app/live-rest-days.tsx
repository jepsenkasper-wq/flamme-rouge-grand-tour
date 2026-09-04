import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { liveGameDraft } from '@/lib/live/liveGameDraft';

export default function LiveRestDaysScreen() {
  const stageCount = Number(liveGameDraft.stages || 21);
  const restDayCount = Number(liveGameDraft.restDays || 0);

  const [restDayStages, setRestDayStages] = useState(
    Array.from({ length: restDayCount }, () => '')
  );

  function updateRestDay(index: number, value: string) {
    const nextRestDays = [...restDayStages];
    nextRestDays[index] = value;
    setRestDayStages(nextRestDays);
  }

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Rest Days</Text>

          <Text style={styles.description}>
            Choose after which stage each rest day should appear.
          </Text>

          <Text style={styles.info}>
            Total stages: {stageCount}
          </Text>

          {restDayStages.map((stage, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.label}>
                Rest Day {index + 1}
              </Text>

              <TextInput
                style={styles.input}
                value={stage}
                onChangeText={(value) =>
                  updateRestDay(index, value)
                }
                placeholder="After stage"
                keyboardType="number-pad"
              />
            </View>
          ))}

          <Pressable
            style={styles.button}
            onPress={() => {
              const numericRestDays =
                restDayStages.map(Number);

              if (
                numericRestDays.some(
                  (stage) => !stage
                )
              ) {
                Alert.alert(
                  'Invalid rest days',
                  'All rest days must have a stage number.'
                );
                return;
              }

              if (
                numericRestDays.some(
                  (stage) =>
                    stage < 1 ||
                    stage >= stageCount
                )
              ) {
                Alert.alert(
                  'Invalid rest days',
                  'Rest days must be placed after a stage before the final stage.'
                );
                return;
              }

              const uniqueRestDays =
                new Set(numericRestDays);

              if (
                uniqueRestDays.size !==
                numericRestDays.length
              ) {
                Alert.alert(
                  'Invalid rest days',
                  'You cannot place more than one rest day after the same stage.'
                );
                return;
              }

              const isSorted =
                numericRestDays.every(
                  (stage, index) => {
                    if (index === 0) return true;

                    return (
                      stage >
                      numericRestDays[index - 1]
                    );
                  }
                );

              if (!isSorted) {
                Alert.alert(
                  'Invalid rest days',
                  'Rest days must be entered in chronological order.'
                );
                return;
              }

              liveGameDraft.restDayStages =
                restDayStages;

              router.push('/live-create-lobby');
            }}
          >
            <Text style={styles.buttonText}>
              Create Live Game
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    color: Colors.brown,
    marginBottom: 16,
  },

  info: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.red,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '900',
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