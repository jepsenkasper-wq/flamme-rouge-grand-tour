export const createGameDraft = {
  gameName: '',
  players: '',
  stages: '',
  restDays: '',

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