import type { GameRole } from './remoteTypes';
import type { SoloStageState } from './solo/soloGameTypes';

export type SavedGame = {
  id: string;
  name: string;
  createdAt: string;

  createGameDraft: any;
  gameResults: any;
  gameState: any;

  role?: GameRole;
  remoteId?: string;
  followCode?: string;
  adminKey?: string;
  soloStageState?: SoloStageState | null;
  
};