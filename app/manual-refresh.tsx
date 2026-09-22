import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { getActiveSoloStageState } from '@/lib/solo/activeSoloStage';
import {
  refreshSelectedCardsFromDiscard,
  getFatigueCardsForStageResult,
  type DummyCard,
} from '@/lib/solo/dummyDeckEngine';

import { updateSoloFatigueTransfer } from '@/lib/solo/soloStageEngine';

import {
  saveGame,
  updateActiveSavedGame,
} from '@/lib/storage';

import {
  fetchLiveHumanRiderCardInfo,
  refreshLiveRoundRiderSelected,
} from '@/lib/live/liveGames';

type RiderKey = 'sprinteur' | 'rouleur';

function formatCard(card: DummyCard): string {
  const value = card.displayValue ?? card.value;
  const specialMark = card.isSpecial ? '*' : '';

  return card.type === 'fatigue'
    ? `F${value}${specialMark}`
    : `${value}${specialMark}`;
}

export default function ManualRefreshScreen() {
  const params = useLocalSearchParams<{
  mode?: 'live';
  gameId?: string;
  teamId?: string;
  riderKey?: RiderKey;
  limit?: string;
}>();

const isLive = params.mode === 'live';

  const [selectedCardIds, setSelectedCardIds] =
    useState<string[]>([]);

  const [liveDiscard, setLiveDiscard] =
  useState<DummyCard[]>([]);

const [liveLoading, setLiveLoading] =
  useState(false);

  useEffect(() => {
  if (
    !isLive ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  let active = true;

  async function loadLiveCards() {
    try {
      setLiveLoading(true);

      const cardInfo =
        await fetchLiveHumanRiderCardInfo(
          params.gameId!,
          params.teamId!,
          params.riderKey!
        );

      if (active) {
        setLiveDiscard(cardInfo.discard);
      }
    } catch (error) {
      console.error(
        'LOAD LIVE MANUAL REFRESH ERROR',
        error
      );
    } finally {
      if (active) {
        setLiveLoading(false);
      }
    }
  }

  void loadLiveCards();

  return () => {
    active = false;
  };
}, [
  isLive,
  params.gameId,
  params.teamId,
  params.riderKey,
]);

  const soloStage = getActiveSoloStageState();

  const teamState = soloStage.teams.find(
    (team) => team.teamId === params.teamId
  );

  const riderState =
    params.riderKey === 'sprinteur'
      ? teamState?.sprinteur
      : params.riderKey === 'rouleur'
      ? teamState?.rouleur
      : undefined;

  const limit = Number(params.limit);

const refreshableCards = (
  isLive
    ? liveDiscard
    : riderState?.discard ?? []
).filter(
  (card) => card.type !== 'fatigue'
);

 const selectedCards =
  refreshableCards.filter((card) =>
    selectedCardIds.includes(card.id)
  );

  const selectedValue = selectedCards.reduce(
    (sum, card) => sum + card.value,
    0
  );

  const missingRider =
  isLive
    ? !params.gameId ||
      !params.teamId ||
      !params.riderKey
    : !riderState || !params.riderKey;

if (
  missingRider ||
  (limit !== 24 && limit !== 25)
) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>
        Manual Refresh
      </Text>
      <Text>Missing refresh information.</Text>
    </View>
  );
}

  function toggleCard(card: DummyCard) {
    if (selectedCardIds.includes(card.id)) {
      setSelectedCardIds((current) =>
        current.filter((id) => id !== card.id)
      );
      return;
    }

    if (selectedValue + card.value > limit) {
      return;
    }

    setSelectedCardIds((current) => [
      ...current,
      card.id,
    ]);
  }

  async function handleConfirmRefresh() {
  if (
    !params.teamId ||
    !params.riderKey ||
    (limit !== 24 && limit !== 25)
  ) {
    return;
  }

  // LIVE
  if (isLive) {
    if (!params.gameId) {
      return;
    }

    try {
      await refreshLiveRoundRiderSelected(
        params.gameId,
        params.teamId,
        params.riderKey,
        limit,
        selectedCardIds
      );

      router.back();
    } catch (error) {
      console.error(
        'CONFIRM LIVE MANUAL REFRESH ERROR',
        error
      );
    }

    return;
  }

  // DUMMY
  if (!riderState || !teamState) {
    return;
  }

  refreshSelectedCardsFromDiscard(
    riderState,
    selectedCardIds
  );

  teamState.refreshUsed ??= {};
  teamState.refreshUsed[params.riderKey] = true;

  updateSoloFatigueTransfer(
    soloStage,
    teamState.teamId,
    params.riderKey,
    getFatigueCardsForStageResult(riderState)
  );

  await saveGame();
  await updateActiveSavedGame();

  router.back();
}
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Refresh {limit}
      </Text>

      <Text style={styles.helperText}>
        Select cards to return to your deck.
      </Text>

      <View style={styles.cards}>
        {refreshableCards.map((card) => {
          const selected =
            selectedCardIds.includes(card.id);

          return (
            <Pressable
              key={card.id}
              style={[
                styles.card,
                selected && styles.selectedCard,
              ]}
              onPress={() => toggleCard(card)}
            >
              <Text style={styles.cardText}>
                {formatCard(card)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.total}>
        Selected value: {selectedValue} / {limit}
      </Text>

      <Pressable
        style={styles.confirmButton}
        onPress={handleConfirmRefresh}
      >
        <Text style={styles.confirmButtonText}>
          CONFIRM REFRESH
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelButtonText}>
          Cancel
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
  flex: 1,
  backgroundColor: Colors.paper,
},

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },

  helperText: {
    textAlign: 'center',
    marginBottom: 20,
  },

  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },

  card: {
    width: 64,
    height: 88,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    borderWidth: 4,
  },

  cardText: {
    fontSize: 22,
    fontWeight: '700',
  },

  total: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },

  confirmButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Colors.brown,
  },

  confirmButtonText: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#fff',
  },

  cancelButton: {
    marginTop: 10,
    padding: 12,
  },

  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '700',
  },
});