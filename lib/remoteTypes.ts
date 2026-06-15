export type GameRole = 'local' | 'admin' | 'follower';

export type RemoteGameMeta = {
  role: GameRole;
  remoteId?: string;
  followCode?: string;
  adminKey?: string;
};