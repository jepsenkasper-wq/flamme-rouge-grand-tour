import type { SpecialRiderId } from './specialRiders';

import type { DummyRiderState } from './dummyDeckEngine';

export type CompanionMode = 'normal' | 'dummy';

export type DummyTeamType =
  | 'human'
  | 'normal-ai'
  | 'muscle'
  | 'peloton';

export type HumanDrawMode =
  | 'app-draw'
  | 'card-draw';

export type DummyTeamSetup = {
  id: string;
  name: string;
  color: string;

  teamType: DummyTeamType;

  // Kun relevant for human
  drawMode?: HumanDrawMode;

  // Relevant for human app-draw og normal-ai
  sprinteurSpecialRiderId?: SpecialRiderId;
  rouleurSpecialRiderId?: SpecialRiderId;
};

export type DummyGameSetup = {
  companionMode: CompanionMode;
  teams: DummyTeamSetup[];
};
export type SoloRiderKey = 'sprinteur' | 'rouleur';

export type SoloTeamStageState = {
  teamId: string;

  teamType: DummyTeamType;
  usesAppDraw: boolean;

  sprinteur?: DummyRiderState;
  rouleur?: DummyRiderState;
};

export type SoloStageState = {
  stageNumber: number;
  teams: SoloTeamStageState[];
  fatigueTransfers: SoloFatigueTransfer[];
};

export type SoloFatigueTransfer = {
  teamId: string;
  sprinteurFatigueCards: number;
  rouleurFatigueCards: number;
};