import { supabase } from './supabase';
import type { SavedGame } from './savedGameTypes';

export function generateFollowCode() {
  const number = Math.floor(1000 + Math.random() * 9000);

  return `FR-${number}`;
}

export function generateAdminKey() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
export async function createRemoteGame(savedGame: SavedGame) {
  const adminKey = generateAdminKey();

  for (let attempt = 0; attempt < 10; attempt++) {
    const followCode = generateFollowCode();

    const { data, error } = await supabase
      .from('games')
      .insert({
        follow_code: followCode,
        admin_key: adminKey,
        game_data: savedGame,
      })
      .select('id')
      .single();

    if (!error) {
      return {
        remoteId: data.id as string,
        followCode,
        adminKey,
      };
    }

    if (error.code !== '23505') {
      throw error;
    }
  }

  throw new Error('Could not generate a unique follow code.');
}
export async function fetchGameByFollowCode(code: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('follow_code', code.trim().toUpperCase())
    .single();

  if (error) {
    throw error;
  }

  return data;
}
export async function updateRemoteGame(savedGame: SavedGame) {
  if (!savedGame.remoteId || !savedGame.adminKey) {
    return;
  }

  const { error } = await supabase
    .from('games')
    .update({
      game_data: savedGame,
      updated_at: new Date().toISOString(),
    })
    .eq('id', savedGame.remoteId)
    .eq('admin_key', savedGame.adminKey);

  if (error) {
    throw error;
  }
}
export function subscribeToRemoteGame(
  remoteId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`game-${remoteId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${remoteId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe((status) => {
});

  return channel;
}