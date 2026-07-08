import type { DummyTeamSetup } from './solo/soloGameTypes';

export const createGameDraft = {
  gameName: '',
  players: '',
  stages: '',
  restDays: '',

  companionMode: 'normal' as 'normal' | 'dummy',

  dummyTeams: [] as DummyTeamSetup[],

  playerNames: [] as string[],
  playerColors: [] as string[],

  restDayStages: [] as string[],

  scoringRules: {
  yellow: [5, 4, 3, 2, 1],
  sprint: [4, 3, 2, 1],
  mountain: [4, 3, 2, 1],
  team: [3, 2, 1],
},

};

export function resetCreateGameDraft() {
  createGameDraft.gameName = '';
  createGameDraft.players = '';
  createGameDraft.stages = '';
  createGameDraft.restDays = '';

  createGameDraft.companionMode = 'normal';

  createGameDraft.dummyTeams = [];

  createGameDraft.playerNames = [];
  createGameDraft.playerColors = [];
  createGameDraft.restDayStages = [];

  createGameDraft.scoringRules = {
    yellow: [5, 4, 3, 2, 1],
    sprint: [4, 3, 2, 1],
    mountain: [4, 3, 2, 1],
    team: [3, 2, 1],
  };
}