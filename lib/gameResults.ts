import { PlayerStageEntry } from './stageDraft';

export type GameResultEntry = {
  entryType: 'stage' | 'restDay';
  stageNumber: number;
  players: PlayerStageEntry[];
};

export const gameResults = {
  entries: [] as GameResultEntry[],

  addEntry(entry: GameResultEntry) {
    this.entries.push(entry);
  },
};