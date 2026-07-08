import {
  type DummyCard,
  type DummyScenario,
} from './dummyDeckEngine';
import { type SpecialRiderId } from './specialRiders';

function findSpecialCard(cards: DummyCard[], value: number): DummyCard | undefined {
  return cards.find((card) => card.isSpecial && card.value === value);
}

export function chooseSpecialRiderCard(
  cards: DummyCard[],
  scenario: DummyScenario,
  specialRiderId?: SpecialRiderId
): DummyCard | undefined {
  if (!specialRiderId) {
    return undefined;
  }

if (specialRiderId === 'grimpeur') {
  if (scenario === 'climb') {
    return findSpecialCard(cards, 6);
  }

  if (scenario === 'descent') {
    return findSpecialCard(cards, 3);
  }
}

if (specialRiderId === 'descender') {
  if (scenario === 'descent') {
    return findSpecialCard(cards, 3);
  }
}

if (specialRiderId === 'mountaineer') {
  if (scenario === 'climb') {
    return findSpecialCard(cards, 7);
  }

}

  return undefined;
}