import {
  type DummyCard,
  type DummyScenario,
} from './dummyDeckEngine';
import { type SpecialRiderId } from './specialRiders';
import { type SoloStageType } from './soloGameTypes';

function findSpecialCard(cards: DummyCard[], value: number): DummyCard | undefined {
  return cards.find((card) => card.isSpecial && card.value === value);
}

function getSuperSprinteurPowerCards(
  cards: DummyCard[]
): DummyCard[] {
  return cards.filter(
    (card) =>
      card.value === 9 ||
      card.value === 10 ||
      card.value === 11
  );
}

export function getSuperSprinteurPhase(
  round: number
): 0 | 1 | 2 {
  if (round <= 5) {
    return 0;
  }

  if (round <= 10) {
    return 1;
  }

  return 2;
}

function shouldPrioritizeSuperSprinteurPowerCard(
  round: number,
  stageType: SoloStageType,
  powerCardsByPhase: [number, number, number]
): boolean {
  const phase = getSuperSprinteurPhase(round);

  if (stageType === 'mountain') {
    if (phase === 0) {
      return powerCardsByPhase[0] < 2;
    }

    return false;
  }

  if (
    stageType === 'flat' ||
    stageType === 'hilly' ||
    stageType === 'cobbles'
  ) {
    return powerCardsByPhase[phase] < 1;
  }

  return false;
}

export function chooseSpecialRiderCard(
  cards: DummyCard[],
  scenario: DummyScenario,
  specialRiderId?: SpecialRiderId,
  round = 0,
  stageType: SoloStageType = 'flat',
  superSprinteurPowerCardsByPhase: [number, number, number] = [0, 0, 0],
  strategyNormalDraws = 0
): DummyCard | undefined {
  if (!specialRiderId) {
    return undefined;
  }

if (
  specialRiderId === 'super-sprinteur' &&
  scenario === 'normal'
) {
  const powerCards = getSuperSprinteurPowerCards(cards);

  const isMountainHighDraw =
    stageType !== 'mountain' ||
    strategyNormalDraws % 2 === 0;

  if (
    powerCards.length > 0 &&
    isMountainHighDraw &&
    shouldPrioritizeSuperSprinteurPowerCard(
      round,
      stageType,
      superSprinteurPowerCardsByPhase
    )
  ) {
    const highestValue = Math.max(
      ...powerCards.map((card) => card.value)
    );

    return powerCards.find(
      (card) => card.value === highestValue
    );
  }
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