import {
  specialRiders,
  type SpecialRiderId,
} from './specialRiders';

import {
  chooseSpecialRiderCard,
  getSuperSprinteurPhase,
} from './specialRiderAI';
import type { SoloRaceType, SoloRiderStrategy, SoloStageType } from './soloGameTypes';

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
superSprinteurPowerCardsByPhase?: [number, number, number];
};

export type DummyRoundResult = {
  drawnCards: DummyCard[];
  selectedCard: DummyCard;
  effectiveMovement?: number;
  canProvideSlipstream?: boolean;
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



export function shuffle<T>(items: T[]): T[] {
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

export function createFatigueCard(): DummyCard {
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
superSprinteurPowerCardsByPhase: [0, 0, 0],
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

type TeamTimeTrialSpecialEffect = {
  hasImmediateSlipstream: boolean;
  blocksProvidingSlipstream: boolean;
};

function getTeamTimeTrialSpecialEffect(
  card: DummyCard,
  specialRiderId?: SpecialRiderId
): TeamTimeTrialSpecialEffect {
  if (!card.isSpecial || !specialRiderId) {
    return {
      hasImmediateSlipstream: false,
      blocksProvidingSlipstream: false,
    };
  }

  if (specialRiderId === 'flandrien') {
    return {
      hasImmediateSlipstream: true,
      blocksProvidingSlipstream: false,
    };
  }

  if (specialRiderId === 'baroudeur') {
    return {
      hasImmediateSlipstream: false,
      blocksProvidingSlipstream: true,
    };
  }

  if (specialRiderId === 'squirrel') {
    return {
      hasImmediateSlipstream: true,
      blocksProvidingSlipstream: true,
    };
  }

  return {
    hasImmediateSlipstream: false,
    blocksProvidingSlipstream: false,
  };
}

type TeamTimeTrialCardOutcome = {
  printedValue: number;
  effectiveMovement: number;
  resultingGap: number;
  immediateSlipstreamUsed: boolean;
  canProvideSlipstream: boolean;
};

function getTeamTimeTrialCardOutcome(
  card: DummyCard,
  currentGap: number,
  specialRiderId?: SpecialRiderId,
  scenario: DummyScenario = 'normal'
): TeamTimeTrialCardOutcome {
  const specialEffect = getTeamTimeTrialSpecialEffect(
    card,
    specialRiderId
  );

let effectiveMovement = card.value;

if (scenario === 'descent') {
  effectiveMovement = Math.max(effectiveMovement, 5);
}

if (scenario === 'supply-zone') {
  effectiveMovement = Math.max(effectiveMovement, 4);
}

const canExceedClimbLimit =
  card.isSpecial &&
  (
    (specialRiderId === 'grimpeur' && card.value === 6) ||
    (specialRiderId === 'mountaineer' && card.value === 7)
  );

if (
  scenario === 'climb' &&
  !canExceedClimbLimit
) {
  effectiveMovement = Math.min(effectiveMovement, 5);
}

let resultingGap = currentGap + effectiveMovement;

let immediateSlipstreamUsed = false;

if (
  specialEffect.hasImmediateSlipstream &&
  (resultingGap === -2 || resultingGap === -1)
) {
  effectiveMovement += 1;
  resultingGap += 1;
  immediateSlipstreamUsed = true;
}

return {
  printedValue: card.value,
  effectiveMovement,
  resultingGap,
  immediateSlipstreamUsed,
  canProvideSlipstream:
    !specialEffect.blocksProvidingSlipstream,
};
}

export function updateTeamTimeTrialGap(
  currentGap: number,
  riderType: RiderType,
  movement: number
): number {
  if (riderType === 'sprinteur') {
    return currentGap + movement;
  }

  return currentGap - movement;
}

type TeamTimeTrialOutcomeScore = {
  teamworkRank: number;
  gapDistance: number;
  forwardMovement: number;
};

function scoreTeamTimeTrialOutcome(
  outcome: TeamTimeTrialCardOutcome,
  scenario: DummyScenario
): TeamTimeTrialOutcomeScore {
  const gap = outcome.resultingGap;
  const absoluteGap = Math.abs(gap);
let teamworkRank: number;

if (scenario === 'climb') {
  if (absoluteGap === 1) {
    // No slipstream on climbs, so staying one space apart is best.
    teamworkRank = 5;
  } else if (gap === 0) {
    // Same double-space: both receive fatigue.
    teamworkRank = 4;
  } else if (absoluteGap === 2) {
    // Still reasonably close, but there is no slipstream benefit.
    teamworkRank = 3;
  } else {
    teamworkRank = 1;
  }
} else {
  if (gap === -2) {
    // Active rider is behind and can receive slipstream.
    teamworkRank = 5;
  } else if (
    gap === 2 &&
    outcome.canProvideSlipstream
  ) {
    // Active rider is ahead and can provide slipstream.
    teamworkRank = 5;
  } else if (absoluteGap === 1) {
    teamworkRank = 4;
  } else if (gap === 0) {
    teamworkRank = 3;
  } else if (gap === 2) {
    // Active rider is ahead but cannot provide slipstream.
    teamworkRank = 2;
  } else {
    teamworkRank = 1;
  }
}

  return {
    teamworkRank,
    gapDistance: absoluteGap,
    forwardMovement: outcome.effectiveMovement,
  };
}

function chooseTeamTimeTrialCard(
  cards: DummyCard[],
  teamTimeTrialGap: number,
  riderType: RiderType,
  specialRiderId?: SpecialRiderId,
  scenario: DummyScenario = 'normal',
  isFirstTeamTimeTrialRider = false
): DummyCard {
  if (cards.length === 0) {
    throw new Error('No cards available for Team Time Trial');
  }

  // Close to the finish, speed is more important than formation.
  if (scenario === 'sprint') {
    return [...cards].sort(
      (a, b) => b.value - a.value
    )[0];
  }

  const riderGap =
  riderType === 'sprinteur'
    ? teamTimeTrialGap
    : -teamTimeTrialGap;

let playableCards = cards;

const nonFatigueCards = cards.filter(
  (card) => card.type !== 'fatigue'
);

if (
  riderGap <= 2 &&
  nonFatigueCards.length > 0
) {
  playableCards = nonFatigueCards;
}
  
if (isFirstTeamTimeTrialRider) {
  const sortedCards = [...playableCards].sort(
    (a, b) => a.value - b.value
  );

  let selectedCard: DummyCard;
if (riderGap > 0) {
  const twoLowest = sortedCards.slice(
    0,
    Math.min(2, sortedCards.length)
  );

  selectedCard =
    twoLowest[
      Math.floor(Math.random() * twoLowest.length)
    ];
} else if (riderGap < 0) {
  const twoHighest = sortedCards.slice(
    Math.max(0, sortedCards.length - 2)
  );

  selectedCard =
    twoHighest[
      Math.floor(Math.random() * twoHighest.length)
    ];
} else {
  selectedCard =
  playableCards[
    Math.floor(Math.random() * playableCards.length)
  ];
}

  console.log('TTT FIRST RIDER', {
    riderType,
    riderGap,
    scenario,
    card: selectedCard.value,
    special: selectedCard.isSpecial ?? false,
    specialRiderId,
  });

  return selectedCard;
}

  const evaluatedCards = playableCards.map((card) => {
    const outcome = getTeamTimeTrialCardOutcome(
      card,
      riderGap,
      specialRiderId,
      scenario
    );

    const score = scoreTeamTimeTrialOutcome(
  outcome,
  scenario
);

    return {
      card,
      outcome,
      score,
    };
  });

  evaluatedCards.sort((a, b) => {
    // 1. Best team formation.
    if (a.score.teamworkRank !== b.score.teamworkRank) {
      return b.score.teamworkRank - a.score.teamworkRank;
    }

    // 2. If both formations are poor, stay as close
    // as possible to the teammate.
    if (
      a.score.teamworkRank === 1 &&
      a.score.gapDistance !== b.score.gapDistance
    ) {
      return a.score.gapDistance - b.score.gapDistance;
    }

    // 3. If the formation is equally good,
    // choose the greatest forward movement.
    if (
      a.score.forwardMovement !== b.score.forwardMovement
    ) {
      return (
        b.score.forwardMovement -
        a.score.forwardMovement
      );
    }

    // 4. On descent and supply zone, save stronger cards
// when the effective movement is identical.
if (
  scenario === 'descent' ||
  scenario === 'supply-zone'
) {
  return a.card.value - b.card.value;
}

// 5. Final tie-break elsewhere: highest printed card.
return b.card.value - a.card.value;
  });


const selectedEvaluation = evaluatedCards[0];

console.log('TTT SELECTED OUTCOME', {
  riderType,
  riderGap,
  scenario,
  specialRiderId,
  card: selectedEvaluation.card.value,
  special: selectedEvaluation.card.isSpecial ?? false,
  effectiveMovement:
    selectedEvaluation.outcome.effectiveMovement,
  resultingGap:
    selectedEvaluation.outcome.resultingGap,
  immediateSlipstream:
    selectedEvaluation.outcome.immediateSlipstreamUsed,
  canProvideSlipstream:
    selectedEvaluation.outcome.canProvideSlipstream,
});

  return evaluatedCards[0].card;
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
  stageType: SoloStageType = 'flat',
  raceType: SoloRaceType = 'normal'
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

 const defensiveActive =
  strategy === 'defensive' &&
  !defensiveStrategyEnded &&
  strategyNormalDraws < 3;

const prioritizeAvoidingTwos =
  (stageType === 'flat' || stageType === 'cobbles') &&
  !defensiveActive;

  let playableCards = cards;

  if (raceType === 'time-trial') {
  const withoutLowCards = playableCards.filter(
    (card) => card.value !== 2 && card.value !== 3
  );

  if (withoutLowCards.length > 0) {
    playableCards = withoutLowCards;
  }
}

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
  strategyNormalDraws < 3
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
  stageType: SoloStageType = 'flat',
  raceType: SoloRaceType = 'normal',
  teamTimeTrialGap = 0,
  riderType: RiderType = 'sprinteur',
  isFirstTeamTimeTrialRider = false
): DummyRoundResult {
  const drawResult = drawHand(rider, drawCount);

const specialCard =
  scenario === 'supply-zone'
    ? undefined
    : chooseSpecialRiderCard(
  drawResult.cards,
  scenario,
  rider.specialRiderId,
  round,
  stageType,
  rider.superSprinteurPowerCardsByPhase ?? [0, 0, 0],
  rider.strategyNormalDraws
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
  raceType === 'team-time-trial'
    ? chooseTeamTimeTrialCard(
    drawResult.cards,
    teamTimeTrialGap,
    riderType,
    rider.specialRiderId,
    scenario,
    isFirstTeamTimeTrialRider
  )
    : specialCard ?? chooseCard(
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
        stageType,
        raceType
      );

let effectiveMovement: number | undefined;
let canProvideSlipstream: boolean | undefined;

if (raceType === 'team-time-trial') {
  const riderGap =
    riderType === 'sprinteur'
      ? teamTimeTrialGap
      : -teamTimeTrialGap;

  const outcome = getTeamTimeTrialCardOutcome(
    selectedCard,
    riderGap,
    rider.specialRiderId,
    scenario
  );

  effectiveMovement = outcome.effectiveMovement;
  canProvideSlipstream = outcome.canProvideSlipstream;
}

finishRound(rider, drawResult, selectedCard);

if (
  rider.specialRiderId === 'super-sprinteur' &&
  scenario === 'normal' &&
  (
    selectedCard.value === 9 ||
    selectedCard.value === 10 ||
    selectedCard.value === 11
  )
) {
  const phase = getSuperSprinteurPhase(round);

  rider.superSprinteurPowerCardsByPhase ??= [0, 0, 0];

rider.superSprinteurPowerCardsByPhase[phase] += 1;
}

if (
  scenario === 'normal' &&
  rider.strategy === 'defensive' &&
  !rider.defensiveStrategyEnded &&
  rider.strategyNormalDraws < 3 &&
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
  effectiveMovement,
  canProvideSlipstream,
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

function getMountainRefreshCardScore(card: DummyCard): number {
  if (card.value === 2) {
    return 0;
  }

  if (card.value === 5) {
    return 3;
  }

  if (card.value === 4 || card.value === 6) {
    return 2;
  }

  return 1;
}

function findBestMountainRefreshCards(
  cards: DummyCard[],
  limit: 24 | 25,
  specialRiderId?: SpecialRiderId
): DummyCard[] {

  const prioritizedSpecialCards =
  specialRiderId === 'grimpeur' ||
  specialRiderId === 'mountaineer'
    ? cards.filter(
        (card) =>
          card.isSpecial &&
          (card.value === 6 || card.value === 7)
      )
    : [];

const prioritizedValue = prioritizedSpecialCards.reduce(
  (sum, card) => sum + card.value,
  0
);

const remainingLimit = limit - prioritizedValue;

  const usableCards = cards.filter(
  (card) =>
    card.value !== 2 &&
    !prioritizedSpecialCards.some(
      (specialCard) => specialCard.id === card.id
    )
);

  let bestCards: DummyCard[] = [];
  let bestScore = -1;
  let bestTotalValue = -1;

  const combinationCount = 1 << usableCards.length;

  for (let mask = 0; mask < combinationCount; mask++) {
    const selectedCards: DummyCard[] = [];
    let totalValue = 0;
    let totalScore = 0;

    for (let i = 0; i < usableCards.length; i++) {
      if (mask & (1 << i)) {
        const card = usableCards[i];

        selectedCards.push(card);
        totalValue += card.value;
        totalScore += getMountainRefreshCardScore(card);
      }
    }

    if (totalValue > remainingLimit) {
      continue;
    }

    const isBetter =
      totalScore > bestScore ||
      (
        totalScore === bestScore &&
        totalValue > bestTotalValue
      ) ||
      (
        totalScore === bestScore &&
        totalValue === bestTotalValue &&
        selectedCards.length > bestCards.length
      );

    if (isBetter) {
      bestCards = selectedCards;
      bestScore = totalScore;
      bestTotalValue = totalValue;
    }
  }

  return [
  ...prioritizedSpecialCards,
  ...bestCards,
];
}

export function refreshFromDiscard(
  rider: DummyRiderState,
  limit: 24 | 25,
  stageType: SoloStageType
): DummyCard[] {
  let selectedCards: DummyCard[] = [];

if (stageType === 'mountain') {

  selectedCards = findBestMountainRefreshCards(
  rider.discard,
  limit,
  rider.specialRiderId
);

} else {
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
superSprinteurPowerCardsByPhase: [
  ...(rider.superSprinteurPowerCardsByPhase ?? [0, 0, 0]),
] as [number, number, number],
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
rider.superSprinteurPowerCardsByPhase = [
  ...(snapshot.superSprinteurPowerCardsByPhase ?? [0, 0, 0]),
] as [number, number, number];
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
rider.superSprinteurPowerCardsByPhase = [0, 0, 0];
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
