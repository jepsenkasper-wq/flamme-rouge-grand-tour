import type {
  SoloRiderStrategy,
  SoloStageType,
  SoloStageState,
} from './soloGameTypes';

import {
  getRiderClassificationPositions,
  getTeamTourPosition,
} from '@/lib/classifications';

import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';

export type StrategyInput = {
  stageType: SoloStageType;
  riderType: 'sprinteur' | 'rouleur';
  fatigueCards: number;
  playerCount: number;
  gcPosition: number;
  sprintPosition: number;
  mountainPosition: number;
  currentStage: number;
  totalStages: number;
  teamTourPosition: number;
};

type StrategyWeights = {
  aggressive: number;
  defensive: number;
  balanced: number;
  mountain: number;
};

function getBaseWeights(
  stageType: SoloStageType
): StrategyWeights {
  switch (stageType) {
    case 'flat':
      return {
        aggressive: 35,
        defensive: 25,
        balanced: 40,
        mountain: 0,
      };

    case 'hilly':
      return {
        aggressive: 30,
        defensive: 25,
        balanced: 45,
        mountain: 0,
      };

    case 'mountain':
      return {
        aggressive: 5,
        defensive: 0,
        balanced: 0,
        mountain: 95,
      };

    case 'cobbles':
      return {
        aggressive: 50,
        defensive: 15,
        balanced: 35,
        mountain: 0,
      };

    case 'standard':
    default:
      return {
        aggressive: 0,
        defensive: 0,
        balanced: 100,
        mountain: 0,
      };
  }
}

function applyFatigueModifier(
  weights: StrategyWeights,
  fatigueCards: number,
  stageType: SoloStageType
): StrategyWeights {
  const next = { ...weights };

  if (stageType === 'mountain') {
    if (fatigueCards <= 1) {
      next.aggressive += 5;
      next.defensive -= 5;
    } else if (fatigueCards >= 4) {
      next.aggressive -= 5;
      next.defensive += 5;
    }

    return next;
  }

  if (fatigueCards <= 1) {
    next.aggressive += 15;
    next.defensive -= 5;
    next.balanced -= 10;
  } else if (fatigueCards >= 4) {
    next.aggressive -= 20;
    next.defensive += 10;
    next.balanced += 10;
  }

  return next;
}
function applyRiderTypeModifier(
  weights: StrategyWeights,
  riderType: 'sprinteur' | 'rouleur',
  stageType: SoloStageType
): StrategyWeights {
  const next = { ...weights };

  if (stageType === 'mountain') {
    if (riderType === 'rouleur') {
      next.aggressive += 5;
      next.mountain -= 5;
    } else {
      next.aggressive -= 5;
      next.mountain += 5;
    }

    return next;
  }

  if (riderType === 'rouleur') {
    next.aggressive += 10;
    next.balanced -= 10;
  } else {
    next.aggressive -= 10;
    next.balanced += 10;
  }

  return next;
}
function applyStartPositionModifier(
  weights: StrategyWeights,
  teamTourPosition: number,
  playerCount: number,
  stageType: SoloStageType
): StrategyWeights {
  const next = { ...weights };

  let aggressiveChange = 0;
  let defensiveChange = 0;
  let balancedChange = 0;

  if (playerCount <= 2) {
    return next;
  }

  if (playerCount === 3) {
    if (teamTourPosition === 3) {
      aggressiveChange = 10;
      defensiveChange = -10;
    }
  } else if (playerCount === 4) {
    if (teamTourPosition === 3) {
      aggressiveChange = 10;
      defensiveChange = -10;
    }

    if (teamTourPosition === 4) {
      aggressiveChange = 20;
      defensiveChange = -15;
      balancedChange = -5;
    }
  } else {
    // 5-6 players
    if (teamTourPosition === 4) {
      aggressiveChange = 5;
      defensiveChange = -10;
      balancedChange = 5;
    }

    if (teamTourPosition === 5) {
      aggressiveChange = 10;
      defensiveChange = -10;
    }

    if (teamTourPosition >= 6) {
      aggressiveChange = 20;
      defensiveChange = -15;
      balancedChange = -5;
    }
  }

  // Start position should have a smaller effect
  // on a mountain stage.
  if (stageType === 'mountain') {
    aggressiveChange = Math.min(aggressiveChange, 10);

    next.aggressive += aggressiveChange;
    next.defensive += defensiveChange;
    next.mountain += balancedChange;

    return next;
  }

  next.aggressive += aggressiveChange;
  next.defensive += defensiveChange;
  next.balanced += balancedChange;

  return next;
}
function isLateTour(
  currentStage: number,
  totalStages: number
): boolean {
  if (totalStages <= 0) return false;

  return currentStage / totalStages >= 0.75;
}
function applyClassificationModifier(
  weights: StrategyWeights,
  stageType: SoloStageType,
  gcPosition: number,
  sprintPosition: number,
  mountainPosition: number,
  currentStage: number,
  totalStages: number
): StrategyWeights {
  const next = { ...weights };

  if (!isLateTour(currentStage, totalStages)) {
    return next;
  }

  // GC top 4: protect position
  if (gcPosition <= 4) {
    next.aggressive -= 15;
    next.defensive -= 10;

    if (stageType === 'mountain') {
      next.mountain += 25;
    } else {
      next.balanced += 25;
    }
  }

  // Sprint top 4 on flat stages: chase sprint points
  if (
    stageType === 'flat' &&
    sprintPosition <= 4
  ) {
    next.aggressive += 25;
    next.defensive -= 10;
    next.balanced -= 15;
  }

  // Mountain classification top 4
  if (
    mountainPosition <= 4 &&
    stageType === 'hilly'
  ) {
    next.aggressive += 20;
    next.defensive -= 10;
    next.balanced -= 10;
  }

  if (
    mountainPosition <= 4 &&
    stageType === 'mountain'
  ) {
    next.aggressive += 15;
    next.defensive -= 5;
    next.mountain -= 10;
  }

  return next;
}

export function getStrategyWeights(
  input: StrategyInput
): StrategyWeights {
  if (input.stageType === 'standard') {
    return {
      aggressive: 0,
      defensive: 0,
      balanced: 100,
      mountain: 0,
    };
  }

  let weights = getBaseWeights(input.stageType);

  weights = applyFatigueModifier(
    weights,
    input.fatigueCards,
    input.stageType
  );

  weights = applyRiderTypeModifier(
    weights,
    input.riderType,
    input.stageType
  );

  weights = applyStartPositionModifier(
    weights,
    input.teamTourPosition,
    input.playerCount,
    input.stageType
  );

  weights = applyClassificationModifier(
    weights,
    input.stageType,
    input.gcPosition,
    input.sprintPosition,
    input.mountainPosition,
    input.currentStage,
    input.totalStages
  );

  if (
    input.stageType === 'mountain' &&
    !isLateTour(input.currentStage, input.totalStages)
  ) {
    weights.aggressive = Math.min(
      weights.aggressive,
      15
    );
  }

  if (input.stageType === 'mountain') {
    weights.aggressive = Math.max(5, weights.aggressive);
    weights.defensive = 0;
    weights.mountain = Math.max(5, weights.mountain);
    weights.balanced = 0;
  } else {
    weights.aggressive = Math.max(5, weights.aggressive);
    weights.defensive = Math.max(5, weights.defensive);
    weights.balanced = Math.max(5, weights.balanced);
    weights.mountain = 0;
  }

  return weights;
}
export function chooseRiderStrategy(
  input: StrategyInput
): SoloRiderStrategy {
  const weights = getStrategyWeights(input);

  const entries: [SoloRiderStrategy, number][] = [
    ['aggressive', weights.aggressive],
    ['defensive', weights.defensive],
    ['balanced', weights.balanced],
    ['mountain', weights.mountain],
  ];

  const totalWeight = entries.reduce(
    (sum, [, weight]) => sum + weight,
    0
  );

  let roll = Math.random() * totalWeight;

  for (const [strategy, weight] of entries) {
    roll -= weight;

    if (roll < 0) {
      return strategy;
    }
  }

  return 'balanced';
}

export function buildStrategyInput(
  playerIndex: number,
  riderType: 'sprinteur' | 'rouleur',
  stageType: SoloStageType,
  fatigueCards: number
): StrategyInput {
  const positions = getRiderClassificationPositions(
    playerIndex,
    riderType
  );

  return {
    stageType,
    riderType,
    fatigueCards,
    playerCount: createGameDraft.playerNames.length,
    teamTourPosition: getTeamTourPosition(playerIndex),
    gcPosition: positions.gc,
    sprintPosition: positions.sprint,
    mountainPosition: positions.mountain,
    currentStage: gameState.currentStage,
    totalStages: Number(createGameDraft.stages || 1),
  };
}
export function assignStrategiesForStage(
  soloStage: SoloStageState
): void {
  soloStage.teams.forEach((teamState, playerIndex) => {
    if (teamState.teamType !== 'normal-ai') {
      return;
    }

    if (teamState.sprinteur) {
      const input = buildStrategyInput(
        playerIndex,
        'sprinteur',
        soloStage.stageType,
        teamState.sprinteur.deck.filter(
          (card) => card.type === 'fatigue'
        ).length
      );

      teamState.sprinteur.strategy =
        chooseRiderStrategy(input);
    }

    if (teamState.rouleur) {
      const input = buildStrategyInput(
        playerIndex,
        'rouleur',
        soloStage.stageType,
        teamState.rouleur.deck.filter(
          (card) => card.type === 'fatigue'
        ).length
      );

      teamState.rouleur.strategy =
        chooseRiderStrategy(input);
    }
  });
}