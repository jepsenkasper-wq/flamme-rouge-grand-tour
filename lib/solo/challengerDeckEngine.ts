import { challengerCards } from './challengerCards';

import type { ChallengerColor } from './challengerCards';

export type ChallengerDeckCard =
  | { type: 'challenger'; id: number }
  | { type: 'plusOne' };

export type ChallengerDeckState = {
  deck: ChallengerDeckCard[];
  discard: ChallengerDeckCard[];
};

function shuffleCards(
  cards: ChallengerDeckCard[]
): ChallengerDeckCard[] {
  const shuffled = [...cards];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] =
      [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export function createChallengerDeck(): ChallengerDeckState {
  const cards: ChallengerDeckCard[] = [
    ...challengerCards.map((card) => ({
      type: 'challenger' as const,
      id: card.id,
    })),
    ...Array.from({ length: 5 }, () => ({
      type: 'plusOne' as const,
    })),
  ];

  return {
    deck: shuffleCards(cards),
    discard: [],
  };
}

export type ChallengerDrawResult = {
  cardId: number | null;
  bonus: number;
  plusOneCount: number;
  isFatigue: boolean;
};

export function drawChallengerCard(
  state: ChallengerDeckState
): ChallengerDrawResult {
  let bonus = 0;
  let plusOneCount = 0;

  while (state.deck.length > 0) {
    const card = state.deck.pop()!;

    state.discard.push(card);

    if (card.type === 'plusOne') {
      bonus = 1;
      plusOneCount++;
      continue;
    }

    return {
      cardId: card.id,
      bonus,
      plusOneCount,
      isFatigue: false,
    };
  }

  return {
    cardId: null,
    bonus,
    plusOneCount,
    isFatigue: true,
  };
}

export type ChallengerRiderValues = {
  sprinteur: number;
  rouleur: number;
};

export function getChallengerValues(
  result: ChallengerDrawResult,
  color: ChallengerColor
): ChallengerRiderValues {
  if (result.isFatigue || result.cardId === null) {
    return {
      sprinteur: 2 + result.bonus,
      rouleur: 2 + result.bonus,
    };
  }

  const card = challengerCards.find(
    (card) => card.id === result.cardId
  );

  if (!card) {
    throw new Error(
      `Challenger card ${result.cardId} not found`
    );
  }

  return {
    sprinteur: card.values[color].sprinteur + result.bonus,
    rouleur: card.values[color].rouleur + result.bonus,
  };
}

export function refreshChallengerDeck(
  state: ChallengerDeckState
): void {
  // Find almindelige Challenger-kort i discard
  const availableCards = state.discard.filter(
    (card) => card.type === 'challenger'
  );

  // Bland de spillede kort
  const shuffledDiscard = shuffleCards(availableCards);

  // Vælg højst 5 kort
  const cardsToReturn = shuffledDiscard.slice(0, 5);

  // Fjern de valgte kort fra discard
  const returnedIds = new Set(
    cardsToReturn.map((card) => card.type === 'challenger' ? card.id : null)
  );

  state.discard = state.discard.filter(
    (card) =>
      card.type !== 'challenger' ||
      !returnedIds.has(card.id)
  );

  // Læg kortene tilbage i bunken, og bland
  state.deck = shuffleCards([
    ...state.deck,
    ...cardsToReturn,
  ]);
}