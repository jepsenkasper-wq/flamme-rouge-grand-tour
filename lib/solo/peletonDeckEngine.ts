import { type DummyCard } from './dummyDeckEngine';

export type PelotonTeamState = {
  deck: DummyCard[];
  discard: DummyCard[];
};

const PELOTON_CARDS = [
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  6, 6, 6,
  7, 7, 7,
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createPelotonDeck(): DummyCard[] {
  const normalCards: DummyCard[] = PELOTON_CARDS.map((value, index) => ({
    id: `peloton-card-${index + 1}`,
    value,
    type: 'movement',
  }));

  const specialCard: DummyCard = {
    id: 'peloton-card-2-9',
    value: 2,
    displayValue: '2/9',
    type: 'movement',
  };

  return shuffle([...normalCards, specialCard]);
}

export function drawPelotonCard(team: PelotonTeamState): DummyCard {
  const card = team.deck.shift();

  if (!card) {
    return {
      id: `peloton-fatigue-${Date.now()}-${Math.random()}`,
      value: 2,
      type: 'fatigue',
    };
  }

  team.discard.push(card);

  return card;
}