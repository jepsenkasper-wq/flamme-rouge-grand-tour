export type RiderType = 'sprinteur' | 'rouleur';

export type RiderStageEntry = {
  time: string;
  tourPoints: string;
  mountainPoints: string;
  sprintPoints: string;
  fatigueCards: string;
};

export type PlayerStageEntry = {
  sprinteur: RiderStageEntry;
  rouleur: RiderStageEntry;
};

function createEmptyRiderEntry(): RiderStageEntry {
  return {
    time: '',
    tourPoints: '',
    mountainPoints: '',
    sprintPoints: '',
    fatigueCards: '',
  };
}

export const stageDraft = {
  stageNumber: 1,

  players: [] as PlayerStageEntry[],

  initialize(playerCount: number) {
    this.players = Array.from({ length: playerCount }, () => ({
      sprinteur: createEmptyRiderEntry(),
      rouleur: createEmptyRiderEntry(),
    }));
  },
};