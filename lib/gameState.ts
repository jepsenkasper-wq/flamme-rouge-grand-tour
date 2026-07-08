export const gameState = {
  currentStage: 1,
  currentEntryType: 'stage' as 'stage' | 'restDay',

  stageState: 'waiting-for-play' as
    | 'waiting-for-play'
    | 'playing'
    | 'ready-for-results',
};