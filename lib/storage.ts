let activeGameId: string | null = null;
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createGameDraft } from './createGameDraft';
import { gameResults } from './gameResults';
import { gameState } from './gameState';

export type SavedGame = {
  id: string;
  name: string;
  createdAt: string;

  createGameDraft: any;
  gameResults: any;
  gameState: any;
};

const ACTIVE_GAME_KEY = 'flamme-rouge-active-game';
const SAVED_GAMES_KEY = 'flamme-rouge-games';

export async function saveGame() {
  const data = {
    createGameDraft,
    gameResults,
    gameState,
  };

  await AsyncStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(data));
}

export async function loadGame() {
  const saved = await AsyncStorage.getItem(ACTIVE_GAME_KEY);

  if (!saved) {
    return false;
  }

  const data = JSON.parse(saved);

  Object.assign(createGameDraft, data.createGameDraft);
  Object.assign(gameResults, data.gameResults);
  Object.assign(gameState, data.gameState);

  return true;
}
export async function getSavedGames(): Promise<SavedGame[]> {
  const saved = await AsyncStorage.getItem(SAVED_GAMES_KEY);

  if (!saved) {
    return [];
  }

  const parsed = JSON.parse(saved);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed;
}

export async function saveGameToLibrary() {
  const games = await getSavedGames();

  const newGame: SavedGame = {
    id: Date.now().toString(),
    name: createGameDraft.gameName || 'Unnamed Game',
    createdAt: new Date().toISOString(),

    createGameDraft: JSON.parse(JSON.stringify(createGameDraft)),
    gameResults: JSON.parse(JSON.stringify(gameResults)),
    gameState: JSON.parse(JSON.stringify(gameState)),
  };

  games.push(newGame);

  activeGameId = newGame.id;

  await AsyncStorage.setItem(
  SAVED_GAMES_KEY,
  JSON.stringify(games)
);
}
export async function openSavedGame(gameId: string) {
  const games = await getSavedGames();
  const game = games.find((savedGame) => savedGame.id === gameId);

  if (!game) {
    return false;
  }

  Object.assign(createGameDraft, game.createGameDraft);
  Object.assign(gameResults, game.gameResults);
  Object.assign(gameState, game.gameState);

 activeGameId = game.id;

  await saveGame();

  return true;
}
export async function updateActiveSavedGame() {
  if (!activeGameId) {
    return;
  }

  const games = await getSavedGames();

  const updatedGames = games.map((game) =>
    game.id === activeGameId
      ? {
          ...game,
          name: createGameDraft.gameName || game.name,
          createGameDraft: JSON.parse(JSON.stringify(createGameDraft)),
          gameResults: JSON.parse(JSON.stringify(gameResults)),
          gameState: JSON.parse(JSON.stringify(gameState)),
        }
      : game
  );

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(updatedGames)
  );
}
export async function deleteActiveSavedGame() {
  if (!activeGameId) {
    return [];
  }

  const games = await getSavedGames();

  const remainingGames = games.filter(
    (game) => game.id !== activeGameId
  );

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(remainingGames)
  );

  activeGameId = null;

  await AsyncStorage.removeItem(ACTIVE_GAME_KEY);

  return remainingGames;
}
