import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  addFatigueCardToSetAside,
  createDummyRider,
  getFatigueCardsForStageResult,
  playDummyRound,
  removeFatigueCardFromSetAside,
  type DummyCard,
  type DummyRiderState,
  type DummyScenario,
  type RiderType,
} from '@/lib/solo/dummyDeckEngine';

import { useLocalSearchParams } from 'expo-router';
import { type SpecialRiderId } from '@/lib/solo/specialRiders';

function formatCards(cards: DummyCard[]): string {
  if (cards.length === 0) {
    return '-';
  }

  return cards
    .map((card) => {
      const value = card.displayValue ?? card.value;
      const specialMark = card.isSpecial ? '*' : '';

      return card.type === 'fatigue'
        ? `F${value}${specialMark}`
        : `${value}${specialMark}`;
    })
    .join(' ');
}

export default function SoloTestScreen() {
  const params = useLocalSearchParams<{
  rouleur?: SpecialRiderId;
  sprinteur?: SpecialRiderId;
}>();

const sprinteurSpecialRiderId = params.sprinteur;
const rouleurSpecialRiderId = params.rouleur;

const [riderType, setRiderType] = useState<RiderType>('sprinteur');
const [scenario, setScenario] = useState<DummyScenario>('normal');

const [riders, setRiders] = useState<Record<RiderType, DummyRiderState>>(() => ({
  sprinteur: createDummyRider('sprinteur', sprinteurSpecialRiderId),
  rouleur: createDummyRider('rouleur', rouleurSpecialRiderId),
}));

const rider = riders[riderType];

  const [lastCard, setLastCard] = useState<DummyCard | null>(null);

  const [lastDraw, setLastDraw] = useState<DummyCard[]>([]);

  const [round, setRound] = useState(0);

  function resetRider(nextRiderType: RiderType = riderType) {
  setRiders((current) => ({
    ...current,
    [nextRiderType]: createDummyRider(nextRiderType),
  }));

  setRiderType(nextRiderType);
  setLastCard(null);
  setLastDraw([]);
  setRound(0);
}

 function drawCard() {
  console.log('RIDER BEFORE DRAW', {
    riderType,
    riderSpecialRiderId: rider.specialRiderId,
    deckTop: rider.deck[0],
    deckIds: rider.deck.slice(0, 3).map((card) => card.id),
  });

  const nextRider: DummyRiderState = {
    ...rider,
    deck: [...rider.deck],
    setAside: [...rider.setAside],
    discard: [...rider.discard],
  };

  const roundResult = playDummyRound(nextRider, scenario);

  setLastDraw(roundResult.drawnCards);
  setRound((current) => current + 1);
  setLastCard(roundResult.selectedCard);

  setRiders((current) => ({
    ...current,
    [riderType]: nextRider,
  }));
}

function addFatigue() {
  const nextRider: DummyRiderState = {
    ...rider,
    deck: [...rider.deck],
    setAside: [...rider.setAside],
    discard: [...rider.discard],
  };

  addFatigueCardToSetAside(nextRider);

  setRiders((current) => ({
    ...current,
    [riderType]: nextRider,
  }));
}

function removeFatigue() {
  const nextRider: DummyRiderState = {
    ...rider,
    deck: [...rider.deck],
    setAside: [...rider.setAside],
    discard: [...rider.discard],
  };

  removeFatigueCardFromSetAside(nextRider);

  setRiders((current) => ({
    ...current,
    [riderType]: nextRider,
  }));
}

  return (
    <ScrollView
  style={styles.screen}
  contentContainerStyle={styles.content}
>
      <Text style={styles.title}>Solo Test</Text>
      <Text style={styles.roundText}>
  Round {round}
</Text>

      <Text style={styles.label}>Rider</Text>

      <View style={styles.row}>
        <Pressable
  style={[
    styles.optionButton,
    riderType === 'sprinteur' && styles.activeButton,
  ]}
  onPress={() => setRiderType('sprinteur')}
>
  <Text style={styles.buttonText}>Sprinteur</Text>
</Pressable>

<Pressable
  style={[
    styles.optionButton,
    riderType === 'rouleur' && styles.activeButton,
  ]}
  onPress={() => setRiderType('rouleur')}
>
  <Text style={styles.buttonText}>Rouleur</Text>
</Pressable>
      </View>

      <Text style={styles.label}>Rider Square Placement</Text>

     <View style={styles.row}>
  {[
  { label: 'Normal', value: 'normal' },
  { label: 'Ascent / Close to ascent', value: 'climb' },
  { label: 'Descent', value: 'descent' },
  { label: 'Supply Zone', value: 'supply-zone' },
  { label: 'Final 20 Fields', value: 'sprint' },
].map((item) => (
    <Pressable
      key={item.value}
      style={[
        styles.optionButton,
        scenario === item.value && styles.activeButton,
      ]}
      onPress={() => setScenario(item.value as DummyScenario)}
    >
      <Text style={styles.buttonText}>{item.label}</Text>
    </Pressable>
  ))}
</View>

      <View style={styles.cardBox}>
  <Text style={styles.label}>Last draw</Text>

  <View style={styles.drawnCardsRow}>
    {lastDraw.length > 0 ? (
      lastDraw.map((card) => (
        <View
          key={card.id}
          style={[
            styles.drawnCard,
            lastCard?.id === card.id && styles.selectedDrawnCard,
          ]}
        >
          <Text style={styles.drawnCardText}>
  {card.type === 'fatigue'
    ? `F${card.displayValue ?? card.value}${card.isSpecial ? '*' : ''}`
    : `${card.displayValue ?? card.value}${card.isSpecial ? '*' : ''}`}
</Text>
        </View>
      ))
    ) : (
      <Text>-</Text>
    )}
  </View>
</View>

      <View style={styles.cardBox}>
        <Text style={styles.label}>Last card</Text>
        <Text style={styles.lastCard}>
          {lastCard
  ? `${lastCard.displayValue ?? lastCard.value}${lastCard.isSpecial ? '*' : ''} (${lastCard.type})`
  : '-'}
        </Text>
      </View>

    <View style={styles.statsBox}>
  <Text>Deck: {rider.deck.length}</Text>
  <Text>{formatCards(rider.deck)}</Text>

  <Text style={styles.pileTitle}>Set aside: {rider.setAside.length}</Text>
  <Text>{formatCards(rider.setAside)}</Text>

  <Text style={styles.pileTitle}>Discard: {rider.discard.length}</Text>
  <Text>{formatCards(rider.discard)}</Text>

  <Text style={styles.pileTitle}>
    Fatigue for result: {getFatigueCardsForStageResult(rider)}
  </Text>
</View>

      <Pressable style={styles.drawButton} onPress={drawCard}>
        <Text style={styles.drawButtonText}>Draw Card</Text>
      </Pressable>

      <Pressable style={styles.resetButton} onPress={addFatigue}>
  <Text style={styles.buttonText}>Add Fatigue Card</Text>
</Pressable>

<Pressable style={styles.resetButton} onPress={removeFatigue}>
  <Text style={styles.buttonText}>Remove Fatigue From Set Aside</Text>
</Pressable>

      <Pressable style={styles.resetButton} onPress={() => resetRider()}>
        <Text style={styles.buttonText}>Reset Deck</Text>
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
    marginBottom: 12,
  },
  label: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#D8C3A5',
  },
  activeButton: {
    backgroundColor: '#8F2F23',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFF8EA',
  },
  lastCard: {
    fontSize: 40,
    fontWeight: '800',
    marginTop: 8,
  },
  statsBox: {
    gap: 6,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF8EA',
  },
  drawButton: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#8F2F23',
    alignItems: 'center',
  },
  drawButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  resetButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4A3328',
    alignItems: 'center',
  },
  
drawnCardsRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 12,
},
drawnCard: {
  width: 52,
  height: 72,
  borderRadius: 10,
  backgroundColor: '#D8C3A5',
  alignItems: 'center',
  justifyContent: 'center',
},
selectedDrawnCard: {
  backgroundColor: '#8F2F23',
},
drawnCardText: {
  color: '#fff',
  fontSize: 22,
  fontWeight: '800',
},
pileTitle: {
  marginTop: 10,
  fontWeight: '700',
},
roundText: {
  textAlign: 'center',
  fontSize: 18,
  fontWeight: '700',
},
});