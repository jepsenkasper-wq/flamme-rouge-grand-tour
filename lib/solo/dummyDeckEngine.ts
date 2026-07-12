import {
  specialRiders,
  type SpecialRiderId,
} from './specialRiders';

import { chooseSpecialRiderCard } from './specialRiderAI';

export type DummyScenario =
  | 'normal'
  | 'climb'
  | 'descent'
  | 'supply-zone'
  | 'sprint';

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

function chooseCard(
  cards: DummyCard[],
  scenario: DummyScenario,
  specialRiderId?: SpecialRiderId,
  round = 0,
  lastPlayedValue?: number
): DummyCard {
  if (scenario === 'normal') {
  const shouldSaveSpecialCards =
    round < 10 &&
    (
      specialRiderId === 'grimpeur' ||
      specialRiderId === 'descender' ||
      specialRiderId === 'mountaineer'
    );

  let playableCards = cards;

  const withoutTwos = playableCards.filter(
    (card) => card.value !== 2
  );

  if (withoutTwos.length > 0) {
    playableCards = withoutTwos;
  }

  if (shouldSaveSpecialCards) {
    const withoutSpecialCards = playableCards.filter(
      (card) => !card.isSpecial
    );

    if (withoutSpecialCards.length > 0) {
      playableCards = withoutSpecialCards;
    }
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

  if (scenario === 'climb') {
    const bestDistance = Math.min(
      ...cards.map((card) => Math.abs(card.value - 5))
    );

    const closestCards = cards.filter(
      (card) => Math.abs(card.value - 5) === bestDistance
    );

    const lowestValue = Math.min(...closestCards.map((card) => card.value));

    return getRandomPreferredCard(
      closestCards.filter((card) => card.value === lowestValue)
    );
  }

  if (scenario === 'descent' || scenario === 'supply-zone') {
    const bestDistance = Math.min(
      ...cards.map((card) => Math.abs(card.value - 2))
    );

    const closestCards = cards.filter(
      (card) => Math.abs(card.value - 2) === bestDistance
    );

    const lowestValue = Math.min(...closestCards.map((card) => card.value));

    return getRandomPreferredCard(
      closestCards.filter((card) => card.value === lowestValue)
    );
  }

  const highestValue = Math.max(...cards.map((card) => card.value));

  return getRandomPreferredCard(
    cards.filter((card) => card.value === highestValue)
  );
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

function drawHand(rider: DummyRiderState): DrawResult {
  const cards: DummyCard[] = [];

  while (cards.length < 4 && rider.deck.length > 0) {
    const card = rider.deck.shift();

    if (card) {
      cards.push(card);
    }
  }

  if (cards.length < 4 && rider.setAside.length > 0) {
    rider.deck = shuffle(rider.setAside);
    rider.setAside = [];

    while (cards.length < 4 && rider.deck.length > 0) {
      const card = rider.deck.shift();

      if (card) {
        cards.push(card);
      }
    }
  }

  while (cards.length < 4) {
    cards.push(createFatigueCard());
  }

return {
  cards,
};

}

export function playDummyRound(
  rider: DummyRiderState,
  scenario: DummyScenario = 'normal',
  round = 0
): DummyRoundResult {
  const drawResult = drawHand(rider);

const specialCard =
  scenario === 'supply-zone'
    ? undefined
    : chooseSpecialRiderCard(
        drawResult.cards,
        scenario,
        rider.specialRiderId
      );

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

const selectedCard =
  specialCard ?? chooseCard(
  drawResult.cards,
  scenario,
  rider.specialRiderId,
  round,
  rider.lastPlayedValue
);

finishRound(rider, drawResult, selectedCard);

return {
  drawnCards: drawResult.cards,
  selectedCard,
};
}

export function drawHumanAppHand(
  rider: DummyRiderState
): DummyCard[] {
  if (rider.pendingHand.length > 0) {
    return rider.pendingHand;
  }

  const drawResult = drawHand(rider);

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
