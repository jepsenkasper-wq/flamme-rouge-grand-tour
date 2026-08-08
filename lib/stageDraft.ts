export type RiderType = 'sprinteur' | 'rouleur';

export type RiderStageEntry = {
  time: string;
  tourPoints: string;
  mountainPoints: string;
  sprintPoints: string;
  fatigueCards: string;
  tieBreakOrder: number;
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
    tieBreakOrder: 0,
  };
}

export const stageDraft = {
  stageNumber: 1,

  players: [] as PlayerStageEntry[],

initialize(
  playerCount: number,
  fatigueTransfers?: {
    sprinteurFatigueCards: number;
    rouleurFatigueCards: number;
  }[],
  stageNumber?: number
) {
  if (
    stageNumber !== undefined &&
    this.stageNumber === stageNumber &&
    this.players.length === playerCount
  ) {
    return;
  }

  this.stageNumber = stageNumber ?? this.stageNumber;

  this.players = Array.from({ length: playerCount }, (_, index) => ({
    sprinteur: {
      ...createEmptyRiderEntry(),
      fatigueCards:
        fatigueTransfers?.[index]?.sprinteurFatigueCards?.toString() ?? '',
    },

    rouleur: {
      ...createEmptyRiderEntry(),
      fatigueCards:
        fatigueTransfers?.[index]?.rouleurFatigueCards?.toString() ?? '',
    },
  }));
},
};