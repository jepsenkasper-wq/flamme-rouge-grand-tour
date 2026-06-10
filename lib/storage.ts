import AsyncStorage from '@react-native-async-storage/async-storage';

import { createGameDraft } from './createGameDraft';
import { gameResults } from './gameResults';
import { gameState } from './gameState';

const STORAGE_KEY = 'flamme-rouge-game';

export async function saveGame() {
  const data = {
    createGameDraft,
    gameResults,
    gameState,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function loadGame() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return false;
  }

  const data = JSON.parse(saved);

  Object.assign(createGameDraft, data.createGameDraft);
  Object.assign(gameResults, data.gameResults);
  Object.assign(gameState, data.gameState);

  return true;
}