import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  createChallengerDeck,
  drawChallengerCard,
  getChallengerValues,
  refreshChallengerDeck,
  type ChallengerDeckState,
  type ChallengerDrawResult,
} from '@/lib/solo/challengerDeckEngine';

import type { ChallengerColor } from '@/lib/solo/challengerCards';

const COLORS: ChallengerColor[] = [
  'red',
  'black',
  'green',
  'blue',
  'white',
  'pink',
];

type DrawHistoryEntry = {
  round: number;
  result: ChallengerDrawResult;
};

export default function ChallengerTestScreen() {
  const [deckState, setDeckState] = useState<ChallengerDeckState>(
    () => createChallengerDeck()
  );

  const [round, setRound] = useState(0);

  const [lastDraw, setLastDraw] =
    useState<ChallengerDrawResult | null>(null);

  const [history, setHistory] = useState<DrawHistoryEntry[]>([]);

  function drawCard() {
    const nextState: ChallengerDeckState = {
      deck: [...deckState.deck],
      discard: [...deckState.discard],
    };

    const result = drawChallengerCard(nextState);
    const nextRound = round + 1;

    setDeckState(nextState);
    setLastDraw(result);
    setRound(nextRound);

    setHistory((current) => [
      {
        round: nextRound,
        result,
      },
      ...current,
    ]);
  }

  function refreshDeck() {
    const nextState: ChallengerDeckState = {
      deck: [...deckState.deck],
      discard: [...deckState.discard],
    };

    refreshChallengerDeck(nextState);
    setDeckState(nextState);
  }

  function newStage() {
    setDeckState(createChallengerDeck());
    setRound(0);
    setLastDraw(null);
    setHistory([]);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Challenger Test</Text>

      <Text style={styles.roundText}>Round {round}</Text>

      <View style={styles.statsBox}>
        <Text style={styles.label}>Deck status</Text>
        <Text>Deck: {deckState.deck.length}</Text>
        <Text>Discard: {deckState.discard.length}</Text>

        <Text style={styles.pileTitle}>
          Regular cards in discard:{' '}
          {
            deckState.discard.filter(
              (card) => card.type === 'challenger'
            ).length
          }
        </Text>

        <Text>
          +1 cards in discard:{' '}
          {
            deckState.discard.filter(
              (card) => card.type === 'plusOne'
            ).length
          }
        </Text>
      </View>

      <View style={styles.cardBox}>
        <Text style={styles.label}>Last draw</Text>

        <Text style={styles.lastCard}>
          {lastDraw
            ? lastDraw.isFatigue
              ? `Fatigue ${2 + lastDraw.bonus}`
              : `Card ${lastDraw.cardId}`
            : '-'}
        </Text>

        {lastDraw?.bonus === 1 && (
          <Text style={styles.bonusText}>+1 bonus</Text>
        )}
      </View>

      {lastDraw && (
        <View style={styles.statsBox}>
          <Text style={styles.label}>Challenger values</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.colorText}>Color</Text>
            <Text style={styles.valueText}>Sprinteur</Text>
            <Text style={styles.valueText}>Rouleur</Text>
          </View>

          {COLORS.map((color) => {
            const values = getChallengerValues(lastDraw, color);

            return (
              <View key={color} style={styles.tableRow}>
                <Text style={styles.colorText}>{color}</Text>
                <Text style={styles.valueText}>
                  {values.sprinteur}
                </Text>
                <Text style={styles.valueText}>
                  {values.rouleur}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Pressable style={styles.drawButton} onPress={drawCard}>
        <Text style={styles.drawButtonText}>Draw Card</Text>
      </Pressable>

      <Pressable style={styles.resetButton} onPress={refreshDeck}>
        <Text style={styles.buttonText}>Refresh</Text>
      </Pressable>

      <Pressable style={styles.resetButton} onPress={newStage}>
        <Text style={styles.buttonText}>New Stage</Text>
      </Pressable>

      <View style={styles.statsBox}>
        <Text style={styles.label}>Draw history</Text>

        {history.length === 0 ? (
          <Text>No cards drawn yet</Text>
        ) : (
          history.map((entry) => (
            <Text key={entry.round}>
              Round {entry.round}:{' '}
              {entry.result.isFatigue
                ? `Fatigue ${2 + entry.result.bonus}`
                : `Card ${entry.result.cardId}${
                    entry.result.bonus ? ' (+1)' : ''
                  }`}
            </Text>
          ))
        )}
      </View>
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
  roundText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontWeight: '700',
  },
  statsBox: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFF8EA',
  },
  pileTitle: {
    marginTop: 10,
    fontWeight: '700',
  },
  cardBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFF8EA',
  },
  lastCard: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  bonusText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8F2F23',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  colorText: {
    flex: 1,
    textTransform: 'capitalize',
  },
  valueText: {
    flex: 1,
    textAlign: 'center',
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
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});