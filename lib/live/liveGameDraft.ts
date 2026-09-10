export type LiveAITeamType =
  | 'normal-ai'
  | 'muscle'
  | 'peloton';

export type LiveAITeamSetup = {
  id: string;
  name: string;
  color: string;
  teamType: LiveAITeamType;
};

export type LiveGameDraft = {
  gameName: string;
  adminName: string;
  players: string;
  dummyPlayers: string;
  stages: string;
  restDays: string;
  restDayStages: string[];
  aiTeams: LiveAITeamSetup[];
};

export const liveGameDraft: LiveGameDraft = {
  gameName: '',
  adminName: '',
  players: '4',
  dummyPlayers: '0',
  stages: '21',
  restDays: '2',
  restDayStages: [],
  aiTeams: [],
};

export function resetLiveGameDraft() {
  liveGameDraft.gameName = '';
  liveGameDraft.adminName = '';
  liveGameDraft.players = '4';
  liveGameDraft.dummyPlayers = '0';
  liveGameDraft.stages = '21';
  liveGameDraft.restDays = '2';
  liveGameDraft.restDayStages = [];
  liveGameDraft.aiTeams = [];
}