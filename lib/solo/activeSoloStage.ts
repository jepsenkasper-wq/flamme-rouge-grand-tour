import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';

import { createSoloStageState } from './soloStageEngine';
import type { SoloStageState } from './soloGameTypes';
import {
  prepareRiderForNextStage,
  setFatigueCardsForStageResult,
  getFatigueCardsForStageResult,
} from './dummyDeckEngine';
import { prepareMuscleTeamForNextStage } from './muscleDeckEngine';
import { preparePelotonTeamForNextStage } from './peletonDeckEngine';

let activeSoloStageState: SoloStageState | null = null;

export function getRawActiveSoloStageState() {
  return activeSoloStageState;
}

export function restoreActiveSoloStageState(
  state: SoloStageState | null
) {
  activeSoloStageState = state;
}

export function getActiveSoloStageState(): SoloStageState {
  if (!activeSoloStageState) {
    activeSoloStageState = createSoloStageState(
      {
        companionMode: createGameDraft.companionMode,
        teams: createGameDraft.dummyTeams,
      },
      gameState.currentStage
    );
  }

  return activeSoloStageState;
}

export function resetActiveSoloStageState(): void {
  activeSoloStageState = null;
}
export function prepareActiveSoloStageForNextStage(): void {
  if (!activeSoloStageState) return;

  activeSoloStageState.teams.forEach((team) => {
    if (team.sprinteur) {
      prepareRiderForNextStage(team.sprinteur);
    }

    if (team.rouleur) {
      prepareRiderForNextStage(team.rouleur);
    }
    if (team.muscleTeam) {
  prepareMuscleTeamForNextStage(team.muscleTeam);
}
    if (team.pelotonTeam) {
  preparePelotonTeamForNextStage(team.pelotonTeam);
}
  });

  activeSoloStageState.stageNumber += 1;

  activeSoloStageState.fatigueTransfers =
    activeSoloStageState.teams.map((team) => ({
      teamId: team.teamId,
      sprinteurFatigueCards: 0,
      rouleurFatigueCards: 0,
    }));
}

export function applyStageDraftFatigueToSoloStage(
  players: {
    sprinteur: { fatigueCards: string };
    rouleur: { fatigueCards: string };
  }[]
): void {
  if (!activeSoloStageState) return;

  activeSoloStageState.teams.forEach((team, index) => {
    const player = players[index];

    if (!player) return;

    if (team.sprinteur) {
      setFatigueCardsForStageResult(
        team.sprinteur,
        Number(player.sprinteur.fatigueCards) || 0
      );
    }

    if (team.rouleur) {
      setFatigueCardsForStageResult(
        team.rouleur,
        Number(player.rouleur.fatigueCards) || 0
      );
    }
  });
}
export function syncSoloFatigueTransfersFromDecks(): void {
  if (!activeSoloStageState) return;

  activeSoloStageState.fatigueTransfers =
    activeSoloStageState.teams.map((team) => ({
      teamId: team.teamId,
      sprinteurFatigueCards: team.sprinteur
        ? getFatigueCardsForStageResult(team.sprinteur)
        : 0,
      rouleurFatigueCards: team.rouleur
        ? getFatigueCardsForStageResult(team.rouleur)
        : 0,
    }));
}