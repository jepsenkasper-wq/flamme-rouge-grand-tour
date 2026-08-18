import {
  specialRiders,
  type SpecialRiderId,
} from './specialRiders';

import { chooseSpecialRiderCard } from './specialRiderAI';
import type { SoloRiderStrategy, SoloStageType } from './soloGameTypes';

export type WindScenario =
  | 'normal'
  | 'headwind'
  | 'tailwind';

export type DummyScenario =
  | 'normal'
  | 'climb'
  | 'descent'
  | 'supply-zone'
  | 'sprint'
  | 'open-valley';

export type DummyCard = {
  id: string;
  value: number;
  displayValue?: string;
  isSpecial?: boolean;
  type: 'movement' | 'fatigue';
};

export type DummyRiderState = {
  deck: DummyCard[];
  setAside: DummyCard[];
  discard: DummyCard[];
  pendingHand: DummyCard[];
  specialRiderId?: SpecialRiderId;
  round: number;
  lastPlayedValue?: number;
  strategy?: SoloRiderStrategy;
  strategyNormalDraws: number;
defensiveTwoPlayed: boolean;
recoveryDrawsRemaining: number;
lastFatigueRound?: number;
defensiveStrategyEnded: boolean;
};

export type DummyRoundResult = {
  drawnCards: DummyCard[];
  selectedCard: DummyCard;
};

type DrawResult = {
  cards: DummyCard[];
};

const SPRINTEUR_CARDS = [
  2, 2, 2,
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  9, 9, 9,
];

const ROULEUR_CARDS = [
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  6, 6, 6,
  7, 7, 7,
];

const FATIGUE_CARD_VALUE = 2;



function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createDummyDeck(values: number[]): DummyCard[] {
  return shuffle(
    values.map((value, index) => ({
      id: `card-${index + 1}`,
      value,
      type: 'movement',
    }))
  );
}

function createFatigueCard(): DummyCard {
  return {
    id: `fatigue-${Date.now()}-${Math.random()}`,
    value: FATIGUE_CARD_VALUE,
    type: 'fatigue',
  };
}

export type RiderType = 'sprinteur' | 'rouleur';

export type SoloTeamType = 'normal-ai' | 'peloton' | 'muscle';

export function createDummyRider(
  riderType: RiderType,
  specialRiderId?: SpecialRiderId
): DummyRiderState {
  const specialRider = specialRiderId
    ? specialRiders[specialRiderId]
    : undefined;

    if (specialRider && specialRider.riderType !== riderType) {
  throw new Error(
    `${specialRider.name} cannot be used as ${riderType}`
  );
}

  const cardValues =
    riderType === 'sprinteur' ? SPRINTEUR_CARDS : ROULEUR_CARDS;

  const deckCards: DummyCard[] = specialRider
    ? specialRider.deck.map((card, index) => ({
        id: `${specialRider.id}-card-${index + 1}`,
        value: card.value,
        isSpecial: card.isSpecial,
        type: 'movement' as const,
      }))
    : createDummyDeck(cardValues);

 return {
  deck: shuffle(deckCards),
  setAside: [],
  discard: [],
  pendingHand: [],
  specialRiderId,
  round: 0,
  lastPlayedValue: undefined,
  strategy: 'balanced',
strategyNormalDraws: 0,
defensiveTwoPlayed: false,
recoveryDrawsRemaining: 0,
lastFatigueRound: undefined,
defensiveStrategyEnded: false,
};
}

export function addFatigueCardToSetAside(rider: DummyRiderState): void {
  rider.setAside.unshift(createFatigueCard());
}

export function removeFatigueCardFromSetAside(rider: DummyRiderState): void {
  let fatigueIndex = rider.setAside.findIndex(
    (card) => card.type === 'fatigue'
  );

  if (fatigueIndex !== -1) {
    rider.setAside.splice(fatigueIndex, 1);
    return;
  }

  fatigueIndex = rider.deck.findIndex(
    (card) => card.type === 'fatigue'
  );

  if (fatigueIndex !== -1) {
    rider.deck.splice(fatigueIndex, 1);
  }
}

function getRandomCard(cards: DummyCard[]): DummyCard {
  return cards[Math.floor(Math.random() * cards.length)];
}

function getRandomPreferredCard(cards: DummyCard[]): DummyCard {
  const fatigueCards = cards.filter((card) => card.type === 'fatigue');

  if (fatigueCards.length > 0) {
    return getRandomCard(fatigueCards);
  }

  return getRandomCard(cards);
}


function chooseAggressiveCard(
  cards: DummyCard[]
): DummyCard {
  const sortedCards = [...cards].sort(
    (a, b) => b.value - a.value
  );

  const highestCards = sortedCards.slice(0, 2);

  return getRandomCard(highestCards);
}

function chooseMountainHighCard(
  cards: DummyCard[]
): DummyCard {
  return chooseAggressiveCard(cards);
}

function chooseMountainLowCard(
  cards: DummyCard[]
): DummyCard {
  const sortedCards = [...cards].sort(
    (a, b) => a.value - b.value
  );

  const twoLowest = sortedCards.slice(0, 2);

  const nonTwoAmongLowest = twoLowest.filter(
    (card) => card.value !== 2
  );

  // Neither of the two lowest cards is a 2:
  // choose randomly between them.
  if (nonTwoAmongLowest.length === 2) {
    return getRandomCard(nonTwoAmongLowest);
  }

  // Exactly one of the two lowest cards is a 2:
  // play the other card.
  if (nonTwoAmongLowest.length === 1) {
    return nonTwoAmongLowest[0];
  }

  // Both lowest cards are 2s:
  // play the lowest card among the remaining cards.
  const remainingCards = sortedCards.slice(2);

  if (remainingCards.length > 0) {
    const lowestRemainingValue = remainingCards[0].value;

    return getRandomCard(
      remainingCards.filter(
        (card) => card.value === lowestRemainingValue
      )
    );
  }

  // Safety fallback.
  return getRandomCard(cards);
}

function chooseDefensiveCard(
  cards: DummyCard[]
): DummyCard {
  const sortedCards = [...cards].sort(
    (a, b) => a.value - b.value
  );

  const lowestCards = sortedCards.slice(0, 2);

  return getRandomCard(lowestCards);
}

function chooseCard(
  cards: DummyCard[],
  scenario: DummyScenario,
  specialRiderId?: SpecialRiderId,
  round = 0,
  lastPlayedValue?: number,
  strategy: SoloRiderStrategy = 'balanced',
  strategyNormalDraws = 0,
  recoveryDrawsRemaining = 0,
  defensiveTwoPlayed = false,
  defensiveStrategyEnded = false,
  refreshUsed = false,
  stageType: SoloStageType = 'flat'
): DummyCard {
  if (scenario === 'normal') {
  const specialProtectionLimit = refreshUsed ? 14 : 10;

  const shouldSaveSpecialCards =
    round < specialProtectionLimit &&
    (
      specialRiderId === 'grimpeur' ||
      specialRiderId === 'descender' ||
      specialRiderId === 'mountaineer'
    );

  const prioritizeAvoidingTwos =
    (stageType === 'flat' || stageType === 'cobbles') &&
    strategy !== 'defensive';

  let playableCards = cards;

  if (prioritizeAvoidingTwos) {
    const withoutTwos = playableCards.filter(
      (card) => card.value !== 2
    );

    if (withoutTwos.length > 0) {
      playableCards = withoutTwos;
    }
  }

  if (shouldSaveSpecialCards) {
    const withoutSpecialCards = playableCards.filter(
      (card) => !card.isSpecial
    );

    if (withoutSpecialCards.length > 0) {
      playableCards = withoutSpecialCards;
    }
  }

  if (
  strategy === 'defensive' &&
  recoveryDrawsRemaining > 0
) {
  return chooseAggressiveCard(playableCards);
}

  if (
  strategy === 'aggressive' &&
  strategyNormalDraws < 5
) {
  return chooseAggressiveCard(playableCards);
}

if (
  strategy === 'defensive' &&
  !defensiveStrategyEnded &&
  strategyNormalDraws < 5
) {
  let defensiveCards = playableCards;

  if (defensiveTwoPlayed) {
    const withoutTwos = defensiveCards.filter(
      (card) => card.value !== 2
    );

    if (withoutTwos.length > 0) {
      defensiveCards = withoutTwos;
    }
  }

  return chooseDefensiveCard(defensiveCards);
}

if (strategy === 'mountain') {
  const useHigh =
    strategyNormalDraws % 2 === 0;

  return useHigh
    ? chooseMountainHighCard(playableCards)
    : chooseMountainLowCard(playableCards);
}

const withoutTwos = playableCards.filter(
  (card) => card.value !== 2
);

if (withoutTwos.length > 0) {
  playableCards = withoutTwos;
}

  if (lastPlayedValue !== undefined) {
    const withoutSameValue = playableCards.filter(
      (card) => card.value !== lastPlayedValue
    );

    if (withoutSameValue.length > 0) {
      playableCards = withoutSameValue;
    }
  }

  return getRandomCard(playableCards);
}

if (scenario === 'open-valley') {
  const specialProtectionLimit = refreshUsed ? 14 : 10;

const shouldSaveSpecialCards =
  round < specialProtectionLimit &&
  (
    specialRiderId === 'grimpeur' ||
    specialRiderId === 'descender' ||
    specialRiderId === 'mountaineer'
  );

  let playableCards = cards;

  if (shouldSaveSpecialCards) {
    const withoutSpecialCards = playableCards.filter(
      (card) => !card.isSpecial
    );

    if (withoutSpecialCards.length > 0) {
      playableCards = withoutSpecialCards;
    }
  }

  const highestValue = Math.max(
  ...playableCards.map((card) => card.value)
);

return getRandomPreferredCard(
  playableCards.filter(
    (card) => card.value === highestValue
  )
);
}

 if (scenario === 'climb') {
  let playableCards = cards;

  const withoutTwos = playableCards.filter(
    (card) => card.value !== 2
  );

  if (withoutTwos.length > 0) {
    playableCards = withoutTwos;
  }

  const bestDistance = Math.min(
    ...playableCards.map((card) => Math.abs(card.value - 5))
  );

  const closestCards = playableCards.filter(
    (card) => Math.abs(card.value - 5) === bestDistance
  );

  const lowestValue = Math.min(
    ...closestCards.map((card) => card.value)
  );

  return getRandomCard(
    closestCards.filter(
      (card) => card.value === lowestValue
    )
  );
}

if (scenario === 'supply-zone') {
  const fatigueCards = cards.filter(
    (card) => card.type === 'fatigue'
  );

  if (fatigueCards.length > 0) {
    return getRandomCard(fatigueCards);
  }

  const shouldSaveSpecialCards =
    round < 10 &&
    (
      specialRiderId === 'grimpeur' ||
      specialRiderId === 'descender' ||
      specialRiderId === 'mountaineer'
    );

  let playableCards = cards;

  if (shouldSaveSpecialCards) {
    const withoutSpecialCards = cards.filter(
      (card) => !card.isSpecial
    );

    if (withoutSpecialCards.length > 0) {
      playableCards = withoutSpecialCards;
    }
  }

  const lowCards = playableCards.filter(
    (card) => card.value < 4
  );

  if (lowCards.length > 0) {
    return getRandomCard(lowCards);
  }

  return getRandomCard(playableCards);
}

if (scenario === 'descent') {
  const bestDistance = Math.min(
    ...cards.map((card) => Math.abs(card.value - 2))
  );

  const closestCards = cards.filter(
    (card) => Math.abs(card.value - 2) === bestDistance
  );

  const lowestValue = Math.min(
    ...closestCards.map((card) => card.value)
  );

  return getRandomPreferredCard(
    closestCards.filter(
      (card) => card.value === lowestValue
    )
  );
}

  const highestValue = Math.max(...cards.map((card) => card.value));

  return getRandomPreferredCard(
    cards.filter((card) => card.value === highestValue)
  );
}

export function getDrawCount(
  wind: WindScenario
): number {
  switch (wind) {
    case 'headwind':
      return 3;

    case 'tailwind':
      return 5;

    default:
      return 4;
  }
}

function finishRound(
  rider: DummyRiderState,
  drawResult: DrawResult,
  selectedCard: DummyCard
): void {
  const unselectedCards = drawResult.cards.filter(
    (card) => card.id !== selectedCard.id
  );

  rider.discard.push(selectedCard);
  rider.setAside.push(...unselectedCards);
  rider.lastPlayedValue = selectedCard.value;
}

export function getFatigueCardsForStageResult(
  rider: DummyRiderState
): number {
  return [
    ...rider.deck,
    ...rider.setAside,
    ...(rider.pendingHand ?? []),
  ].filter((card) => card.type === 'fatigue').length;
}

function drawHand(
  rider: DummyRiderState,
  drawCount = 4
): DrawResult {
  const cards: DummyCard[] = [];

  while (cards.length < drawCount && rider.deck.length > 0) {
    const card = rider.deck.shift();

    if (card) {
      cards.push(card);
    }
  }

 if (cards.length < drawCount && rider.setAside.length > 0) {
    rider.deck = shuffle(rider.setAside);
    rider.setAside = [];

    while (cards.length < drawCount && rider.deck.length > 0) {
      const card = rider.deck.shift();

      if (card) {
        cards.push(card);
      }
    }
  }

  if (cards.length === 0) {
  cards.push(createFatigueCard());
}

return {
  cards,
};

}

export function playDummyRound(
  rider: DummyRiderState,
  scenario: DummyScenario = 'normal',
  round = 0,
  drawCount = 4,
  refreshUsed = false,
  stageType: SoloStageType = 'flat'
): DummyRoundResult {
  const drawResult = drawHand(rider, drawCount);

const specialCard =
  scenario === 'supply-zone'
    ? undefined
    : chooseSpecialRiderCard(
        drawResult.cards,
        scenario,
        rider.specialRiderId
      );

/*
console.log('SOLO DEBUG', {
  scenario,
  specialRiderId: rider.specialRiderId,
  cards: drawResult.cards.map((card) => ({
    id: card.id,
    value: card.value,
    type: card.type,
    isSpecial: card.isSpecial,
  })),
  specialCard,
});
*/

const selectedCard =
  specialCard ?? chooseCard(
    drawResult.cards,
    scenario,
    rider.specialRiderId,
    round,
    rider.lastPlayedValue,
    rider.strategy,
    rider.strategyNormalDraws,
    rider.recoveryDrawsRemaining,
    rider.defensiveTwoPlayed,
    rider.defensiveStrategyEnded,
    refreshUsed,
    stageType
  );

finishRound(rider, drawResult, selectedCard);

if (
  scenario === 'normal' &&
  rider.strategy === 'defensive' &&
  !rider.defensiveStrategyEnded &&
  rider.strategyNormalDraws < 5 &&
  selectedCard.value === 2
) {
  rider.defensiveTwoPlayed = true;
}

if (
  scenario === 'normal' ||
  (
    scenario === 'open-valley' &&
    rider.strategy === 'aggressive'
  )
) {
  rider.strategyNormalDraws += 1;
}

if (
  (
    scenario === 'normal' ||
    scenario === 'open-valley'
  ) &&
  rider.recoveryDrawsRemaining > 0
) {
  rider.recoveryDrawsRemaining -= 1;
}

return {
  drawnCards: drawResult.cards,
  selectedCard,
};
}

export function drawHumanAppHand(
  rider: DummyRiderState,
  drawCount = 4
): DummyCard[] {
  if (rider.pendingHand.length > 0) {
    return rider.pendingHand;
  }

  const drawResult = drawHand(rider, drawCount);

  rider.pendingHand = [...drawResult.cards];

  return rider.pendingHand;
}

export function finishHumanAppDraw(
  rider: DummyRiderState,
  drawnCards: DummyCard[],
  selectedCardId: string
): DummyCard | undefined {
  const cards =
    rider.pendingHand.length > 0
      ? rider.pendingHand
      : drawnCards;

  const selectedCard = cards.find(
    (card) => card.id === selectedCardId
  );

  if (!selectedCard) {
    return undefined;
  }

  finishRound(rider, { cards }, selectedCard);

  rider.pendingHand = [];

  return selectedCard;
}
export function refreshFromDiscard(
  rider: DummyRiderState,
  limit: 24 | 25
): DummyCard[] {
  const selectedCards: DummyCard[] = [];

  const sortedDiscard = [...rider.discard].sort(
    (a, b) => b.value - a.value
  );

  let totalValue = 0;

  for (const card of sortedDiscard) {
    if (totalValue + card.value <= limit) {
      selectedCards.push(card);
      totalValue += card.value;
    }
  }

  rider.discard = rider.discard.filter(
    (card) => !selectedCards.some((selected) => selected.id === card.id)
  );

  rider.deck.push(...selectedCards);

  return selectedCards;
}

export function cloneDummyRiderState(
  rider: DummyRiderState
): DummyRiderState {
  return {
    deck: [...rider.deck],
    setAside: [...rider.setAside],
    discard: [...rider.discard],
    specialRiderId: rider.specialRiderId,
    round: rider.round,
    lastPlayedValue: rider.lastPlayedValue,
    pendingHand: [...rider.pendingHand],
    strategy: rider.strategy,
    strategyNormalDraws: rider.strategyNormalDraws,
defensiveTwoPlayed: rider.defensiveTwoPlayed,
recoveryDrawsRemaining: rider.recoveryDrawsRemaining,
lastFatigueRound: rider.lastFatigueRound,
defensiveStrategyEnded: rider.defensiveStrategyEnded,
  };
}

export function restoreDummyRiderState(
  rider: DummyRiderState,
  snapshot: DummyRiderState
): void {
  rider.deck = [...snapshot.deck];
  rider.setAside = [...snapshot.setAside];
  rider.discard = [...snapshot.discard];
  rider.specialRiderId = snapshot.specialRiderId;
  rider.round = snapshot.round;
  rider.lastPlayedValue = snapshot.lastPlayedValue;
  rider.pendingHand = [...snapshot.pendingHand];
  rider.strategy = snapshot.strategy;
  rider.strategyNormalDraws = snapshot.strategyNormalDraws;
rider.defensiveTwoPlayed = snapshot.defensiveTwoPlayed;
rider.recoveryDrawsRemaining = snapshot.recoveryDrawsRemaining;
rider.lastFatigueRound = snapshot.lastFatigueRound;
rider.defensiveStrategyEnded = snapshot.defensiveStrategyEnded;
}
export function prepareRiderForNextStage(
  rider: DummyRiderState
): void {
  rider.deck = shuffle([
    ...rider.deck,
    ...rider.discard,
    ...rider.setAside,
    ...(rider.pendingHand ?? []),
  ]);

  rider.discard = [];
  rider.setAside = [];
  rider.pendingHand = [];

  rider.round = 0;

  rider.strategy = 'balanced';
rider.strategyNormalDraws = 0;
rider.defensiveTwoPlayed = false;
rider.recoveryDrawsRemaining = 0;
rider.defensiveStrategyEnded = false;
rider.lastFatigueRound = undefined;
}

export function setFatigueCardsForStageResult(
  rider: DummyRiderState,
  targetFatigueCards: number
): void {
 const currentFatigueCards = [
  ...rider.deck,
  ...rider.setAside,
  ...rider.discard,
  ...(rider.pendingHand ?? []),
].filter((card) => card.type === 'fatigue').length;

  if (targetFatigueCards > currentFatigueCards) {
    const cardsToAdd = targetFatigueCards - currentFatigueCards;

    for (let i = 0; i < cardsToAdd; i++) {
      rider.setAside.push(createFatigueCard());
    }

    return;
  }

  if (targetFatigueCards < currentFatigueCards) {
    let cardsToRemove = currentFatigueCards - targetFatigueCards;

    rider.setAside = rider.setAside.filter((card) => {
      if (cardsToRemove > 0 && card.type === 'fatigue') {
        cardsToRemove--;
        return false;
      }

      return true;
    });

    rider.deck = rider.deck.filter((card) => {
      if (cardsToRemove > 0 && card.type === 'fatigue') {
        cardsToRemove--;
        return false;
      }

      return true;
    });

    rider.discard = rider.discard.filter((card) => {
  if (cardsToRemove > 0 && card.type === 'fatigue') {
    cardsToRemove--;
    return false;
  }

  return true;
});

rider.pendingHand = (rider.pendingHand ?? []).filter((card) => {
  if (cardsToRemove > 0 && card.type === 'fatigue') {
    cardsToRemove--;
    return false;
  }

  return true;
});
  }
}
