let activeGameId: string | null = null;
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createGameDraft } from './createGameDraft';
import { gameResults } from './gameResults';
import { gameState } from './gameState';
import {
  createRemoteGame,
  fetchGameByFollowCode,
  updateRemoteGame,
} from './remoteGames';

import type { SavedGame } from './savedGameTypes';
import {
  getRawActiveSoloStageState,
  restoreActiveSoloStageState,
} from './solo/activeSoloStage';

const ACTIVE_GAME_KEY = 'flamme-rouge-active-game';
const SAVED_GAMES_KEY = 'flamme-rouge-games';

export async function saveGame() {
  const data = {
    createGameDraft,
    gameResults,
    gameState,
    soloStageState: getRawActiveSoloStageState(),
  };

  await AsyncStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(data));
}

export async function loadGame() {
  const activeId = await AsyncStorage.getItem(ACTIVE_GAME_KEY);

  if (!activeId) {
    return false;
  }

  return openSavedGame(activeId);
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
    soloStageState: JSON.parse(JSON.stringify(getRawActiveSoloStageState())),
    role: 'admin',
  };
  const remoteMeta = await createRemoteGame(newGame);

newGame.remoteId = remoteMeta.remoteId;
newGame.followCode = remoteMeta.followCode;
newGame.adminKey = remoteMeta.adminKey;

  games.push(newGame);

  activeGameId = newGame.id;

  await AsyncStorage.setItem(
  SAVED_GAMES_KEY,
  JSON.stringify(games)
);
await AsyncStorage.setItem(
  ACTIVE_GAME_KEY,
  newGame.id
);
}
export async function openSavedGame(gameId: string) {
  const games = await getSavedGames();
  const game = games.find((savedGame) => savedGame.id === gameId);

  if (!game) {
    return false;
  }

  // Standardværdier til ældre/importerede spil
  createGameDraft.companionMode = 'normal';
  createGameDraft.dummyTeams = [];

  gameState.tourEnded = false;
  
  Object.assign(createGameDraft, game.createGameDraft);
  Object.assign(gameResults, game.gameResults);
  Object.assign(gameState, game.gameState);

  if (createGameDraft.companionMode === 'dummy') {
    restoreActiveSoloStageState(game.soloStageState ?? null);
  } else {
    restoreActiveSoloStageState(null);
  }

  activeGameId = game.id;

  await AsyncStorage.setItem(
    ACTIVE_GAME_KEY,
    game.id
  );

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
          soloStageState: JSON.parse(JSON.stringify(getRawActiveSoloStageState())),
        }
      : game
  );

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(updatedGames)
  );
  const updatedActiveGame = updatedGames.find(
  (game) => game.id === activeGameId
);

if (updatedActiveGame?.role === 'admin') {
  await updateRemoteGame(updatedActiveGame);
}
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

export async function deleteSavedGameById(gameId: string) {
  const games = await getSavedGames();

  const remainingGames = games.filter(
    (game) => game.id !== gameId
  );

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(remainingGames)
  );

  if (activeGameId === gameId) {
    activeGameId = null;
    await AsyncStorage.removeItem(ACTIVE_GAME_KEY);
  }

  return remainingGames;
}

export async function updateActiveSavedGameMeta(
  meta: Partial<Pick<SavedGame, 'role' | 'remoteId' | 'followCode' | 'adminKey'>>
) {
  if (!activeGameId) {
    return;
  }

  const games = await getSavedGames();

  const updatedGames = games.map((game) =>
    game.id === activeGameId
      ? {
          ...game,
          ...meta,
        }
      : game
  );

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(updatedGames)
  );
}
export async function getActiveSavedGame() {
  if (!activeGameId) {
    return null;
  }

  const games = await getSavedGames();

  return games.find((game) => game.id === activeGameId) ?? null;
}
export async function saveFollowedGame(remoteGame: any) {
  const games = await getSavedGames();

  const followerId = `follow-${remoteGame.id}`;

  const existingGame = games.find(
    (game) => game.id === followerId
  );

  const savedGame: SavedGame = {
    ...remoteGame.game_data,

    id: followerId,
    name: remoteGame.game_data.name,
    createdAt: existingGame?.createdAt ?? remoteGame.created_at,

    role: 'follower',
    remoteId: remoteGame.id,
    followCode: remoteGame.follow_code,
    adminKey: undefined,
  };

  const updatedGames = existingGame
    ? games.map((game) =>
        game.id === followerId ? savedGame : game
      )
    : [...games, savedGame];

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(updatedGames)
  );

  activeGameId = savedGame.id;

  await AsyncStorage.setItem(
    ACTIVE_GAME_KEY,
    savedGame.id
  );

  return savedGame;
}
export async function refreshFollowedGame(savedGame: SavedGame) {
  if (savedGame.role !== 'follower' || !savedGame.followCode) {
    return savedGame;
  }

  const remoteGame = await fetchGameByFollowCode(savedGame.followCode);

  return saveFollowedGame(remoteGame);
}
export async function unfollowActiveGame() {
  const games = await getSavedGames();

  const activeId =
    activeGameId ?? (await AsyncStorage.getItem(ACTIVE_GAME_KEY));

  if (!activeId) {
    return games;
  }

  const activeGame = games.find((game) => game.id === activeId);

  const remainingGames = games.filter((game) => {
    if (game.id === activeId) {
      return false;
    }

    if (
      activeGame?.remoteId &&
      game.role === 'follower' &&
      game.remoteId === activeGame.remoteId
    ) {
      return false;
    }

    return true;
  });

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(remainingGames)
  );

  activeGameId = null;

  await AsyncStorage.removeItem(ACTIVE_GAME_KEY);

  return remainingGames;
}
export async function importSavedGame(importedGame: SavedGame) {
  const games = await getSavedGames();

  const importedCopy: SavedGame = {
    ...importedGame,
    id: `import-${Date.now()}`,
    name: `${importedGame.name} (Imported)`,
    createdAt: new Date().toISOString(),
    role: 'admin',
    remoteId: undefined,
    followCode: undefined,
    adminKey: undefined,
  };

  const updatedGames = [...games, importedCopy];

  await AsyncStorage.setItem(
    SAVED_GAMES_KEY,
    JSON.stringify(updatedGames)
  );

  return importedCopy;
}