import { type DummyCard, type RiderType } from './dummyDeckEngine';

export type MuscleTeamState = {
  sprinteur: MuscleRiderState;
  rouleur: MuscleRiderState;
};

export type MuscleRiderState = {
  deck: DummyCard[];
  discard: DummyCard[];
};

const MUSCLE_SPRINTEUR_CARDS = [
  2, 2, 2,
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  9, 9, 9,
  5,
];

const MUSCLE_ROULEUR_CARDS = [
  3, 3, 3,
  4, 4, 4,
  5, 5, 5,
  6, 6, 6,
  7, 7, 7,
];

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function createDeck(values: number[], prefix: string): DummyCard[] {
  return shuffle(
    values.map((value, index) => ({
      id: `${prefix}-card-${index + 1}`,
      value,
      type: 'movement',
    }))
  );
}

export function createMuscleTeam(): MuscleTeamState {
  return {
    sprinteur: {
      deck: createDeck(MUSCLE_SPRINTEUR_CARDS, 'muscle-sprinteur'),
      discard: [],
    },
    rouleur: {
      deck: createDeck(MUSCLE_ROULEUR_CARDS, 'muscle-rouleur'),
      discard: [],
    },
  };
}

export function drawMuscleCard(
  team: MuscleTeamState,
  riderType: RiderType
): DummyCard {
  const rider = team[riderType];

  const card = rider.deck.shift();

  if (!card) {
    return {
      id: `muscle-fatigue-${Date.now()}-${Math.random()}`,
      value: 2,
      type: 'fatigue',
    };
  }

  rider.discard.push(card);

  return card;
}