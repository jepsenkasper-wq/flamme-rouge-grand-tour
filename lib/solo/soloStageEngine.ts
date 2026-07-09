import {
  createDummyRider,
  playDummyRound,
  type DummyRoundResult,
  type DummyScenario,
} from './dummyDeckEngine';

import type {
  DummyGameSetup,
  DummyTeamSetup,
  SoloFatigueTransfer,
  SoloStageState,
  SoloTeamStageState,
} from './soloGameTypes';

import { createMuscleTeam } from './muscleDeckEngine';
import { createPelotonTeam } from './peletonDeckEngine';

function teamUsesAppDraw(team: DummyTeamSetup): boolean {
  if (team.teamType === 'human') {
    return team.drawMode === 'app-draw';
  }

  return true;
}

export function createSoloStageState(
  setup: DummyGameSetup,
  stageNumber: number
): SoloStageState {
  const teams: SoloTeamStageState[] = setup.teams.map((team) => {
    const usesAppDraw = teamUsesAppDraw(team);

if (team.teamType === 'muscle') {
  return {
    teamId: team.id,
    teamType: team.teamType,
    usesAppDraw: false,
    muscleTeam: createMuscleTeam(),
  };
}

if (team.teamType === 'peloton') {
  return {
    teamId: team.id,
    teamType: team.teamType,
    usesAppDraw: false,
    pelotonTeam: createPelotonTeam(),
  };
}

if (!usesAppDraw) {
  return {
    teamId: team.id,
    teamType: team.teamType,
    usesAppDraw: false,
  };
}

    return {
  teamId: team.id,
  teamType: team.teamType,
  usesAppDraw: true,

  sprinteur: createDummyRider(
    'sprinteur',
    team.sprinteurSpecialRiderId
  ),

  rouleur: createDummyRider(
    'rouleur',
    team.rouleurSpecialRiderId
  ),
};
  });

  return {
  stageNumber,
  teams,
  fatigueTransfers: teams.map((team) => ({
    teamId: team.teamId,
    sprinteurFatigueCards: 0,
    rouleurFatigueCards: 0,
  })),
};
}

export function updateSoloFatigueTransfer(
  stageState: SoloStageState,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  fatigueCards: number
): void {
  const transfer = stageState.fatigueTransfers.find(
    (item) => item.teamId === teamId
  );

  if (!transfer) return;

  if (riderKey === 'sprinteur') {
    transfer.sprinteurFatigueCards = fatigueCards;
  }

  if (riderKey === 'rouleur') {
    transfer.rouleurFatigueCards = fatigueCards;
  }
}

export function drawSoloCard(
  stageState: SoloStageState,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  scenario: DummyScenario,
  round = 0
): DummyRoundResult | undefined {
  const team = stageState.teams.find((team) => team.teamId === teamId);

  if (!team || !team.usesAppDraw) {
    return undefined;
  }

  const rider = team[riderKey];

  if (!rider) {
    return undefined;
  }

  const result = playDummyRound(rider, scenario, round);

  return result;
}
function countActiveFatigueCards(
  rider: SoloTeamStageState['sprinteur']
): number {
  if (!rider) {
    return 0;
  }

  return [...rider.deck, ...rider.setAside].filter(
    (card) => card.type === 'fatigue'
  ).length;
}

export function createFatigueTransfer(
  stageState: SoloStageState
): SoloFatigueTransfer[] {
  return stageState.teams
    .filter((team) => team.usesAppDraw)
    .map((team) => ({
      teamId: team.teamId,
      sprinteurFatigueCards: countActiveFatigueCards(team.sprinteur),
      rouleurFatigueCards: countActiveFatigueCards(team.rouleur),
    }));
}

function removeActiveFatigueCards(
  rider: SoloTeamStageState['sprinteur']
): void {
  if (!rider) {
    return;
  }

  rider.deck = rider.deck.filter((card) => card.type !== 'fatigue');
  rider.setAside = rider.setAside.filter((card) => card.type !== 'fatigue');
}

function addFatigueCardsToDeck(
  rider: SoloTeamStageState['sprinteur'],
  count: number
): void {
  if (!rider) {
    return;
  }

  for (let i = 0; i < count; i += 1) {
    rider.deck.push({
      id: `fatigue-${Date.now()}-${Math.random()}`,
      value: 2,
      type: 'fatigue',
    });
  }
}

export function applyFatigueTransfer(
  stageState: SoloStageState,
  fatigueTransfer: SoloFatigueTransfer[]
): void {
  fatigueTransfer.forEach((transfer) => {
    const team = stageState.teams.find(
      (team) => team.teamId === transfer.teamId
    );

    if (!team || !team.usesAppDraw) {
      return;
    }

    removeActiveFatigueCards(team.sprinteur);
    removeActiveFatigueCards(team.rouleur);

    addFatigueCardsToDeck(
      team.sprinteur,
      transfer.sprinteurFatigueCards
    );

    addFatigueCardsToDeck(
      team.rouleur,
      transfer.rouleurFatigueCards
    );
  });
}