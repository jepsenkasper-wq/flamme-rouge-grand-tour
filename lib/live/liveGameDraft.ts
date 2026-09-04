export type LiveGameDraft = {
  gameName: string;
  adminName: string;
  players: string;
  stages: string;
  restDays: string;
  restDayStages: string[];
};

export const liveGameDraft: LiveGameDraft = {
  gameName: '',
  adminName: '',
  players: '4',
  stages: '21',
  restDays: '2',
  restDayStages: [],
};

export function resetLiveGameDraft() {
  liveGameDraft.gameName = '';
  liveGameDraft.adminName = '';
  liveGameDraft.players = '4';
  liveGameDraft.stages = '21';
  liveGameDraft.restDays = '2';
  liveGameDraft.restDayStages = [];
}