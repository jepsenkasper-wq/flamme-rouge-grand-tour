import AsyncStorage from '@react-native-async-storage/async-storage';

const LIVE_PLAYER_IDENTITIES_KEY =
  'flamme-rouge-live-player-identities';

export type LivePlayerIdentity = {
  gameId: string;
  playerId: string;
  playerToken: string;
};

type LivePlayerIdentityMap = Record<
  string,
  LivePlayerIdentity
>;

async function getAllLivePlayerIdentities():
  Promise<LivePlayerIdentityMap> {
  const stored = await AsyncStorage.getItem(
    LIVE_PLAYER_IDENTITIES_KEY
  );

  if (!stored) {
    return {};
  }

  const parsed = JSON.parse(stored);

  if (!parsed || typeof parsed !== 'object') {
    return {};
  }

  return parsed as LivePlayerIdentityMap;
}

export async function saveLivePlayerIdentity(
  identity: LivePlayerIdentity
) {
  const identities =
    await getAllLivePlayerIdentities();

  identities[identity.gameId] = identity;

  await AsyncStorage.setItem(
    LIVE_PLAYER_IDENTITIES_KEY,
    JSON.stringify(identities)
  );
}

export async function getLivePlayerIdentity(
  gameId: string
): Promise<LivePlayerIdentity | null> {
  const identities =
    await getAllLivePlayerIdentities();

  return identities[gameId] ?? null;
}

export async function clearLivePlayerIdentity(
  gameId: string
) {
  const identities =
    await getAllLivePlayerIdentities();

  delete identities[gameId];

  await AsyncStorage.setItem(
    LIVE_PLAYER_IDENTITIES_KEY,
    JSON.stringify(identities)
  );
}