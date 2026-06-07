import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';

export default function RestDaysScreen() {
  const params = useLocalSearchParams();
  

  const stageCount = Number(params.stages ?? 21);
  const restDayCount = Number(params.restDays ?? 0);

  const [restDayStages, setRestDayStages] = useState(
    Array.from({ length: restDayCount }, () => '')
  );

  function updateRestDay(index: number, value: string) {
    const nextRestDays = [...restDayStages];
    nextRestDays[index] = value;
    setRestDayStages(nextRestDays);
  }

 return (
  <ScrollView
    style={styles.screen}
    contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rest Days</Text>

      <Text style={styles.description}>
        Choose after which stage each rest day should appear.
      </Text>

      <Text style={styles.info}>Total stages: {stageCount}</Text>
      

      {restDayStages.map((stage, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>Rest Day {index + 1}</Text>
          <TextInput
            style={styles.input}
            value={stage}
            onChangeText={(value) => updateRestDay(index, value)}
            placeholder="After stage"
            keyboardType="number-pad"
          />
        </View>
      ))}
      <Pressable
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: '/review-game',
  params: {
  gameName: params.gameName,
  stages: params.stages,
  restDays: params.restDays,
  playerNames: params.playerNames,
  restDayStages: JSON.stringify(restDayStages),
},
    })
  }>
  <Text style={styles.buttonText}>Review Game</Text>
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
content: {
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
},
});