export const gameState = {
  currentStage: 1,
  currentEntryType: 'stage' as 'stage' | 'restDay',
  tourEnded: false,

  stageState: 'waiting-for-play' as
    | 'waiting-for-play'
    | 'playing'
    | 'ready-for-results',
};