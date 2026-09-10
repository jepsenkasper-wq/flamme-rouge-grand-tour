export type ActiveLiveGameSession = {
  gameId: string;
  playerId: string;
  isAdmin: boolean;
};

let activeLiveGameSession: ActiveLiveGameSession | null = null;

export function setActiveLiveGameSession(
  session: ActiveLiveGameSession
) {
  activeLiveGameSession = session;
}

export function getActiveLiveGameSession() {
  return activeLiveGameSession;
}

export function clearActiveLiveGameSession() {
  activeLiveGameSession = null;
}