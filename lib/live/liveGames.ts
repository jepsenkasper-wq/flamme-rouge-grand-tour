import { supabase } from '@/lib/supabase';
import { liveGameDraft } from './liveGameDraft';

export function generateLiveJoinCode() {
  const number = Math.floor(1000 + Math.random() * 9000);

  return `LIVE-${number}`;
}

export function generateLiveAdminKey() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function createLiveGame() {
  const adminKey = generateLiveAdminKey();

  for (let attempt = 0; attempt < 10; attempt++) {
    const joinCode = generateLiveJoinCode();

    const { data, error } = await supabase
      .from('live_games')
      .insert({
        join_code: joinCode,
        admin_key: adminKey,
        game_name: liveGameDraft.gameName || 'Unnamed Live Game',
        player_count: Number(liveGameDraft.players),
        stage_count: Number(liveGameDraft.stages),
        rest_day_count: Number(liveGameDraft.restDays),
        rest_day_stages: liveGameDraft.restDayStages,
        phase: 'lobby',
      })
      .select('id')
      .single();

    if (!error) {
      return {
        liveGameId: data.id as string,
        joinCode,
        adminKey,
      };
    }

    if (error.code !== '23505') {
      throw error;
    }
  }

  throw new Error('Could not generate a unique live join code.');
}

export type LivePlayer = {
  id: string;
  gameId: string;
  name: string;
  color?: string;
  isAdmin: boolean;
};

const LIVE_PLAYER_COLORS = [
  'Blue',
  'White',
  'Green',
  'Red',
  'Black',
  'Pink',
];

export async function createLivePlayer(
  gameId: string,
  name: string,
  isAdmin = false
): Promise<LivePlayer> {
  const { data: existingPlayers, error: playersError } =
    await supabase
      .from('live_players')
      .select('color')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

  if (playersError) {
    throw playersError;
  }

  const usedColors = new Set(
    (existingPlayers ?? [])
      .map((player) => player.color)
      .filter(Boolean)
  );

  const color = LIVE_PLAYER_COLORS.find(
    (candidate) => !usedColors.has(candidate)
  );

  if (!color) {
    throw new Error('No available player colors.');
  }

  const { data, error } = await supabase
    .from('live_players')
    .insert({
      game_id: gameId,
      name,
      color,
      is_admin: isAdmin,
    })
    .select('id, game_id, name, color, is_admin')
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id as string,
    gameId: data.game_id as string,
    name: data.name as string,
    color: data.color ?? undefined,
    isAdmin: Boolean(data.is_admin),
  };
}

export async function fetchLivePlayers(
  gameId: string
): Promise<LivePlayer[]> {
  const { data, error } = await supabase
    .from('live_players')
    .select('id, game_id, name, color, is_admin')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((player) => ({
    id: player.id as string,
    gameId: player.game_id as string,
    name: player.name as string,
    color: player.color ?? undefined,
    isAdmin: Boolean(player.is_admin),
  }));
}

export function subscribeToLivePlayers(
  gameId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`live-players-${gameId}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_players',
        filter: `game_id=eq.${gameId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return channel;
}

export async function unsubscribeFromLivePlayers(
  channel: ReturnType<typeof subscribeToLivePlayers>
) {
  await supabase.removeChannel(channel);
}

export type LiveGame = {
  id: string;
  joinCode: string;
  gameName: string;
  playerCount: number;
  stageCount: number;
  restDayCount: number;
  restDayStages: string[];
  phase: string;
};

export async function fetchLiveGameByJoinCode(
  code: string
): Promise<LiveGame> {
  const { data, error } = await supabase
    .from('live_games')
    .select(
      'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase'
    )
    .eq('join_code', code.trim().toUpperCase())
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id as string,
    joinCode: data.join_code as string,
    gameName: data.game_name as string,
    playerCount: Number(data.player_count),
    stageCount: Number(data.stage_count),
    restDayCount: Number(data.rest_day_count),
    restDayStages: (data.rest_day_stages ?? []) as string[],
    phase: data.phase as string,
  };
}

export async function updateLiveGamePhase(
  gameId: string,
  phase: string
) {
  const { error } = await supabase
    .from('live_games')
    .update({
      phase,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    throw error;
  }
}