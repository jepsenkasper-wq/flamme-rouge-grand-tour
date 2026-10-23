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
  entryType: 'stage' as 'stage' | 'restDay',

  players: [] as PlayerStageEntry[],

initialize(
  playerCount: number,
  fatigueTransfers?: {
    sprinteurFatigueCards: number;
    rouleurFatigueCards: number;
  }[],
  stageNumber?: number,
  entryType: 'stage' | 'restDay' = 'stage'
) {
  if (
    stageNumber !== undefined &&
    this.stageNumber === stageNumber &&
    this.entryType === entryType &&
    this.players.length === playerCount
  ) {
    // Bevar eksisterende indtastninger
    return;
  }

  this.stageNumber = stageNumber ?? this.stageNumber;
  this.entryType = entryType;

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