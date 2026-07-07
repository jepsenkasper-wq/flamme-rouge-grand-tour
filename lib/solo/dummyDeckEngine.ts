export type DummyScenario = 'normal' | 'climb' | 'descent' | 'sprint';

export type DummyCard = {
  id: string;
  value: number;
  type: 'movement' | 'fatigue';
};

export type DummyRiderState = {
  deck: DummyCard[];
  setAside: DummyCard[];
  discard: DummyCard[];
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

export function createDummyRider(riderType: RiderType): DummyRiderState {
  const cardValues =
    riderType === 'sprinteur' ? SPRINTEUR_CARDS : ROULEUR_CARDS;

  return {
    deck: createDummyDeck(cardValues),
    setAside: [],
    discard: [],
  };
}

export function addFatigueCardToSetAside(rider: DummyRiderState): void {
  rider.setAside.unshift(createFatigueCard());
}

function getRandomCard(cards: DummyCard[]): DummyCard {
  return cards[Math.floor(Math.random() * cards.length)];
}

function chooseCard(cards: DummyCard[], scenario: DummyScenario): DummyCard {
  if (scenario === 'normal') {
    return getRandomCard(cards);
  }

  if (scenario === 'climb') {
    const bestDistance = Math.min(
      ...cards.map((card) => Math.abs(card.value - 5))
    );

    const closestCards = cards.filter(
      (card) => Math.abs(card.value - 5) === bestDistance
    );

    const lowestValue = Math.min(...closestCards.map((card) => card.value));

    return getRandomCard(
      closestCards.filter((card) => card.value === lowestValue)
    );
  }

  if (scenario === 'descent') {
    const bestDistance = Math.min(
      ...cards.map((card) => Math.abs(card.value - 2))
    );

    const closestCards = cards.filter(
      (card) => Math.abs(card.value - 2) === bestDistance
    );

    const lowestValue = Math.min(...closestCards.map((card) => card.value));

    return getRandomCard(
      closestCards.filter((card) => card.value === lowestValue)
    );
  }

  const highestValue = Math.max(...cards.map((card) => card.value));

  return getRandomCard(cards.filter((card) => card.value === highestValue));
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
}

export function getFatigueCardsForStageResult(rider: DummyRiderState): number {
  return [...rider.deck, ...rider.setAside].filter(
    (card) => card.type === 'fatigue'
  ).length;
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
  scenario: DummyScenario = 'normal'
): DummyRoundResult {
  const drawResult = drawHand(rider);
  const selectedCard = chooseCard(drawResult.cards, scenario);

  finishRound(rider, drawResult, selectedCard);

  return {
    drawnCards: drawResult.cards,
    selectedCard,
  };
}
