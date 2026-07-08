import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';

import {
  specialRiders,
  type SpecialRiderId,
} from '@/lib/solo/specialRiders';

import { useState } from 'react';

import { router } from 'expo-router';

export default function SpecialRiderTestScreen() {

const riderIds = Object.keys(specialRiders) as SpecialRiderId[];

const [selectedRouleurId, setSelectedRouleurId] =
  useState<SpecialRiderId>('grimpeur');

const [selectedSprinteurId, setSelectedSprinteurId] =
  useState<SpecialRiderId>('descender');

const [showRouleurOptions, setShowRouleurOptions] = useState(false);
const [showSprinteurOptions, setShowSprinteurOptions] = useState(false);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Special Rider Test</Text>
      <Pressable
  style={styles.selectorButton}
  onPress={() => setShowRouleurOptions(!showRouleurOptions)}
>
  <Text style={styles.buttonText}>
    Rouleur: {specialRiders[selectedRouleurId].name}
  </Text>
</Pressable>

{showRouleurOptions && (
  <View style={styles.grid}>
    {riderIds
      .filter((id) => specialRiders[id].riderType === 'rouleur')
      .map((id) => {
        const rider = specialRiders[id];

        return (
          <Pressable
            key={id}
            style={[
              styles.optionButton,
              selectedRouleurId === id && styles.activeButton,
            ]}
            onPress={() => {
              setSelectedRouleurId(id);
              setShowRouleurOptions(false);
            }}
          >
            <Text style={styles.buttonText}>{rider.name}</Text>
          </Pressable>
        );
      })}
  </View>
)}

<Pressable
  style={styles.selectorButton}
  onPress={() => setShowSprinteurOptions(!showSprinteurOptions)}
>
  <Text style={styles.buttonText}>
    Sprinteur: {specialRiders[selectedSprinteurId].name}
  </Text>
</Pressable>

{showSprinteurOptions && (
  <View style={styles.grid}>
    {riderIds
      .filter((id) => specialRiders[id].riderType === 'sprinteur')
      .map((id) => {
        const rider = specialRiders[id];

        return (
          <Pressable
            key={id}
            style={[
              styles.optionButton,
              selectedSprinteurId === id && styles.activeButton,
            ]}
            onPress={() => {
              setSelectedSprinteurId(id);
              setShowSprinteurOptions(false);
            }}
          >
            <Text style={styles.buttonText}>{rider.name}</Text>
          </Pressable>
        );
      })}
  </View>
)}
<Pressable
  style={styles.startButton}
  onPress={() =>
    router.push({
      pathname: '/dev/solo-test',
      params: {
        rouleur: selectedRouleurId,
        sprinteur: selectedSprinteurId,
      },
    })
  }
>
  <Text style={styles.startButtonText}>Start Test</Text>
</Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF1DE',
  },
  content: {
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
  fontWeight: '700',
},
grid: {
  gap: 8,
},
optionButton: {
  padding: 12,
  borderRadius: 10,
  backgroundColor: '#D8C3A5',
},
buttonText: {
  color: '#fff',
  fontWeight: '700',
},
subText: {
  color: '#fff',
  opacity: 0.8,
  marginTop: 2,
},
activeButton: {
  backgroundColor: '#8F2F23',
},
selectorButton: {
  backgroundColor: '#8F2F23',
  padding: 12,
  borderRadius: 10,
},
startButton: {
  backgroundColor: '#4A3328',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 8,
},
startButtonText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: '800',
},
});