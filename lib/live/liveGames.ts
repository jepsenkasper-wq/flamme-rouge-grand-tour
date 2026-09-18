import { supabase } from '@/lib/supabase';
import { liveGameDraft } from './liveGameDraft';
import {
  specialRiders,
  type SpecialRiderId,
} from '@/lib/solo/specialRiders';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';
import { getLivePlayerIdentity } from '@/lib/livePlayerIdentity';
import { gameResults } from '@/lib/gameResults';

import {
  createDummyRider,
  DummyCard,
  DummyRiderState,
  type RiderType,
} from '@/lib/solo/dummyDeckEngine';
import {
  chooseAIBreakawayBid1Card,
  getBreakawayTarget,
  chooseBreakawayRiderByFatigue,
  chooseWeightedBreakawayTarget,
  getBreakawayTargetRange,
  chooseAIBreakawayBid2Card,
} from '@/lib/solo/breakawayEngine';
import { SoloRiderStrategy } from '../solo/soloGameTypes';

import {
  createMuscleTeam,
  MuscleTeamState,
} from '@/lib/solo/muscleDeckEngine';

import {
  createPelotonTeam,
  PelotonTeamState,
} from '@/lib/solo/peletonDeckEngine';

import type {
  PlayerStageEntry,
} from '@/lib/stageDraft';

import {
  saveGame,
  updateActiveSavedGame,
} from '@/lib/storage';

import type { GameResultEntry } from '@/lib/gameResults';

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
  playerToken?: string;

  sprinteurSpecialRiderId?: SpecialRiderId;
  rouleurSpecialRiderId?: SpecialRiderId;

  sprinteurSpecialRiderSet: boolean;
  rouleurSpecialRiderSet: boolean;

  reviewConfirmed: boolean;
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

const { data, error } = await supabase.rpc(
  'create_live_player_with_token',
  {
    p_game_id: gameId,
    p_name: name,
    p_color: color,
    p_is_admin: isAdmin,
  }
);

if (error) {
  throw error;
}

const createdPlayer = data?.[0];

if (!createdPlayer) {
  throw new Error('Live player could not be created.');
}



return {
  id: createdPlayer.player_id as string,
  gameId,
  name,
  color,
  isAdmin,

  playerToken: createdPlayer.player_token as string,

  sprinteurSpecialRiderId: undefined,
  rouleurSpecialRiderId: undefined,

  sprinteurSpecialRiderSet: false,
  rouleurSpecialRiderSet: false,
  reviewConfirmed: false,
};
}

export async function fetchLivePlayers(
  gameId: string
): Promise<LivePlayer[]> {
  const { data, error } = await supabase
    .from('live_players')
   .select(
  'id, game_id, name, color, is_admin, sprinteur_special_rider_id, rouleur_special_rider_id, sprinteur_special_rider_set, rouleur_special_rider_set, review_confirmed'
)
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

  sprinteurSpecialRiderId:
    player.sprinteur_special_rider_id ?? undefined,

  rouleurSpecialRiderId:
    player.rouleur_special_rider_id ?? undefined,
    sprinteurSpecialRiderSet:
  Boolean(player.sprinteur_special_rider_set),

rouleurSpecialRiderSet:
  Boolean(player.rouleur_special_rider_set),
    reviewConfirmed: Boolean(player.review_confirmed),
}));
}

export function subscribeToLivePlayers(
  gameId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(
  `live-players-${gameId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
)
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

  draftOrder: string[];
  draftRound: number;
  draftPickIndex: number;
  draftStarted: boolean;
  specialRiderMode: LiveSpecialRiderMode | null;

  gameData?: LiveGameData;
};

export type LiveStageState = {
  gameId: string;
  stageNumber: number;
  phase: string;
  raceType: 'normal' | 'time-trial' | 'team-time-trial';
  stageType: 'standard' | 'flat' | 'hilly' | 'mountain' | 'cobbles';
  round: number;
 breakaway: LiveBreakawayState;
  drawStatus: Record<string, unknown>;
  revealedCards: Record<string, unknown>;
  roundReadyPlayerIds: string[];
  stageEndRequested: boolean;
  allowIncompleteRound: boolean;
  stageEndReadyPlayerIds: string[];
  stageEntryReadyPlayerIds: string[];
  stageSaveReadyPlayerIds: string[];
};

export async function initializeLiveStageState(
  gameId: string,
  stageNumber: number
) {
  const initialState = {
    game_id: gameId,
    stage_number: stageNumber,
    phase: 'setup',
    race_type: 'normal',
    stage_type: 'standard',
    round: 1,

    breakaway: {
      mode: 'none',
      completed: false,
      phase: 'rider-selection',
      bids: [],
      winnerIds: [],
    },

    draw_status: {},
    revealed_cards: {},
    round_ready_player_ids: [],
    stage_end_requested: false,

    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('live_stage_state')
    .upsert(initialState, {
      onConflict: 'game_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchLiveStageState(
  gameId: string
): Promise<LiveStageState | null> {
  const { data, error } = await supabase
    .from('live_stage_state')
    .select(
  'game_id, stage_number, phase, race_type, stage_type, round, breakaway, draw_status, revealed_cards, round_ready_player_ids, stage_end_requested, stage_end_ready_player_ids, stage_entry_ready_player_ids, stage_save_ready_player_ids, allow_incomplete_round'
)
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    gameId: data.game_id as string,
    stageNumber: Number(data.stage_number),
    phase: data.phase as string,

    raceType: data.race_type as LiveStageState['raceType'],
    stageType: data.stage_type as LiveStageState['stageType'],

    round: Number(data.round ?? 1),

    breakaway: data.breakaway as LiveStageState['breakaway'],

    drawStatus:
      (data.draw_status ?? {}) as Record<string, unknown>,

    revealedCards:
      (data.revealed_cards ?? {}) as Record<string, unknown>,

    roundReadyPlayerIds:
      (data.round_ready_player_ids ?? []) as string[],

    stageEndRequested:
      Boolean(data.stage_end_requested),

    stageEndReadyPlayerIds:
  (data.stage_end_ready_player_ids ?? []) as string[],

 stageEntryReadyPlayerIds:
  (data.stage_entry_ready_player_ids ?? []) as string[],

  stageSaveReadyPlayerIds:
  (data.stage_save_ready_player_ids ?? []) as string[],

    allowIncompleteRound: Boolean(
  data.allow_incomplete_round
),
  };
}

export async function markLiveRoundReady(
  gameId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'mark_live_round_ready',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function startLiveNextRound(
  gameId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'start_live_next_round',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function allowLiveIncompleteRound(
  gameId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'allow_live_incomplete_round',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function revealLiveIncompleteRound(
  gameId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'reveal_live_incomplete_round',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function requestLiveStageEnd(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'request_live_stage_end',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function confirmLiveStageEnd(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'confirm_live_stage_end',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveStageSetup(
  gameId: string,
  updates: {
    raceType?: LiveStageState['raceType'];
    stageType?: LiveStageState['stageType'];
    breakawayMode?: LiveStageState['breakaway']['mode'];
  }
) {
  const databaseUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.raceType !== undefined) {
    databaseUpdates.race_type =
      updates.raceType;
  }

  if (updates.stageType !== undefined) {
    databaseUpdates.stage_type =
      updates.stageType;
  }

  if (updates.breakawayMode !== undefined) {
    const currentState =
      await fetchLiveStageState(gameId);

    if (!currentState) {
      throw new Error(
        'Live stage state not found.'
      );
    }

    databaseUpdates.breakaway = {
      ...currentState.breakaway,
      mode: updates.breakawayMode,
    };
  }

  const { error } = await supabase
    .from('live_stage_state')
    .update(databaseUpdates)
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }
}

export type LivePresencePlayer = {
  playerId: string;
};

let activeLivePresenceChannel:
  ReturnType<typeof supabase.channel> | null = null;

export function subscribeToLivePresence(
  gameId: string,
  playerId: string,
  onChange: (onlinePlayerIds: string[]) => void
) {
  if (activeLivePresenceChannel) {
    void supabase.removeChannel(
      activeLivePresenceChannel
    );

    activeLivePresenceChannel = null;
  }

  const channel = supabase.channel(
    `live-presence-${gameId}`,
    {
      config: {
        presence: {
          key: playerId,
        },
      },
    }
  );

  activeLivePresenceChannel = channel;
  function updatePresence() {
    const presenceState = channel.presenceState();

    const onlinePlayerIds = Object.keys(
      presenceState
    );

    onChange(onlinePlayerIds);
  }

  channel.on(
    'presence',
    {
      event: 'sync',
    },
    () => {
      updatePresence();
    }
  );

  channel.subscribe(async (status) => {
    if (status !== 'SUBSCRIBED') {
      return;
    }

    await channel.track({
      playerId,
      onlineAt: new Date().toISOString(),
    });
  });

  return channel;
}

export async function unsubscribeFromLivePresence(
  channel: ReturnType<
    typeof subscribeToLivePresence
  >
) {
  await channel.untrack();
  await supabase.removeChannel(channel);

  if (activeLivePresenceChannel === channel) {
    activeLivePresenceChannel = null;
  }
}

export function subscribeToLiveStageState(
  gameId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(
  `live-stage-state-${gameId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_stage_state',
        filter: `game_id=eq.${gameId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return channel;
}

export async function unsubscribeFromLiveStageState(
  channel: ReturnType<typeof subscribeToLiveStageState>
) {
  await supabase.removeChannel(channel);
}

export async function fetchLiveGame(
  gameId: string
): Promise<LiveGame> {
  const { data, error } = await supabase
    .from('live_games')
    .select(
  'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase, draft_order, draft_round, draft_pick_index, draft_started, special_rider_mode, game_data'
)
    .eq('id', gameId)
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

    draftOrder: (data.draft_order ?? []) as string[],
    draftRound: Number(data.draft_round ?? 1),
    draftPickIndex: Number(data.draft_pick_index ?? 0),
    draftStarted: Boolean(data.draft_started),

    specialRiderMode:
      (data.special_rider_mode as LiveSpecialRiderMode | null) ??
      null,
      gameData:
  (data.game_data as LiveGameData | null) ?? undefined,
  };
}

export async function initializeLiveGameData(
  gameId: string
): Promise<LiveGameData> {
  const game = await fetchLiveGame(gameId);

  const [players, teams] = await Promise.all([
    fetchLivePlayers(gameId),
    fetchLiveTeams(gameId),
  ]);

  const getTeamSprinteurSpecialRiderId = (
    team: LiveTeam
  ) => {
    if (team.teamType === 'human') {
      const ownerPlayer = players.find(
        (player) =>
          player.id === team.ownerPlayerId
      );

      return (
        ownerPlayer?.sprinteurSpecialRiderId ?? ''
      );
    }

    return team.sprinteurSpecialRiderId ?? '';
  };

  const getTeamRouleurSpecialRiderId = (
    team: LiveTeam
  ) => {
    if (team.teamType === 'human') {
      const ownerPlayer = players.find(
        (player) =>
          player.id === team.ownerPlayerId
      );

      return (
        ownerPlayer?.rouleurSpecialRiderId ?? ''
      );
    }

    return team.rouleurSpecialRiderId ?? '';
  };

  const liveGameData: LiveGameData = {
    setup: {
      gameName: game.gameName,
      players: String(teams.length),
      stages: String(game.stageCount),
      restDays: String(game.restDayCount),

      playerNames: teams.map(
        (team) => team.name
      ),

      playerColors: teams.map(
        (team) => team.color ?? ''
      ),

      teamIds: teams.map(
  (team) => team.id
),

teamTypes: teams.map(
  (team) => team.teamType
),

      playerRouleurSpecialRiders: teams.map(
        getTeamRouleurSpecialRiderId
      ),

      playerSprinteurSpecialRiders: teams.map(
        getTeamSprinteurSpecialRiderId
      ),

      restDayStages: game.restDayStages,

    scoringRules: {
  yellow: [5, 4, 3, 2, 1],
  sprint: [4, 3, 2, 1],
  mountain: [4, 3, 2, 1],
  team: [3, 2, 1],
},

bonusAwardMode: 'each-stage',
    },

    state: {
      currentStage: 1,
      currentEntryType: 'stage',
      tourEnded: false,
      stageState: 'waiting-for-play',
    },

    results: {
  entries: [],
  restDayReview: null,
},
  };

  const { error } = await supabase
    .from('live_games')
    .update({
      game_data: liveGameData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    throw error;
  }

  return liveGameData;
}

export function applyLiveGameData(
  gameData: LiveGameData
) {
  const { setup, state, results } = gameData;

  // Existing create-game setup
  createGameDraft.gameName = setup.gameName;
  createGameDraft.players = setup.players;
  createGameDraft.stages = setup.stages;
  createGameDraft.restDays = setup.restDays;

  const hasDummyTeams = setup.teamTypes.some(
  (teamType) => teamType !== 'human'
);

createGameDraft.companionMode =
  hasDummyTeams ? 'dummy' : 'normal';

createGameDraft.dummyTeams = setup.teamTypes
  .map((teamType, index) => ({
    id: setup.teamIds[index],
    name: setup.playerNames[index],
    color: setup.playerColors[index],
    teamType,
    sprinteurSpecialRiderId:
  (setup.playerSprinteurSpecialRiders[index] ||
    undefined) as SpecialRiderId | undefined,

rouleurSpecialRiderId:
  (setup.playerRouleurSpecialRiders[index] ||
    undefined) as SpecialRiderId | undefined,
  }))
  .filter(
    (team) => team.teamType !== 'human'
  );

  createGameDraft.playerNames = [
    ...setup.playerNames,
  ];

  createGameDraft.playerColors = [
    ...setup.playerColors,
  ];

  createGameDraft.playerRouleurSpecialRiders = [
    ...setup.playerRouleurSpecialRiders,
  ];

  createGameDraft.playerSprinteurSpecialRiders = [
    ...setup.playerSprinteurSpecialRiders,
  ];

  createGameDraft.restDayStages = [
    ...setup.restDayStages,
  ];

  createGameDraft.scoringRules = {
    yellow: [...setup.scoringRules.yellow],
    sprint: [...setup.scoringRules.sprint],
    mountain: [...setup.scoringRules.mountain],
    team: [...setup.scoringRules.team],
    
  };

createGameDraft.bonusAwardMode =
  setup.bonusAwardMode ?? 'each-stage';

  // Existing active game state
  gameState.currentStage = state.currentStage;
  gameState.currentEntryType =
    state.currentEntryType;
  gameState.tourEnded = state.tourEnded;
  gameState.stageState = state.stageState;

  // Existing results
  gameResults.entries = [
    ...results.entries,
  ];
}

export async function fetchLiveGameByJoinCode(
  code: string
): Promise<LiveGame> {
  const { data, error } = await supabase
    .from('live_games')
    .select(
  'id, join_code, game_name, player_count, stage_count, rest_day_count, rest_day_stages, phase, draft_order, draft_round, draft_pick_index, draft_started, special_rider_mode'
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
    draftOrder: (data.draft_order ?? []) as string[],
draftRound: Number(data.draft_round ?? 1),
draftPickIndex: Number(data.draft_pick_index ?? 0),
draftStarted: Boolean(data.draft_started),
specialRiderMode:
  (data.special_rider_mode as LiveSpecialRiderMode | null) ?? null,
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

export function subscribeToLiveGame(
  gameId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(
  `live-game-${gameId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
)   
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_games',
        filter: `id=eq.${gameId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe();

  return channel;
}

export async function unsubscribeFromLiveGame(
  channel: ReturnType<typeof subscribeToLiveGame>
) {
  await supabase.removeChannel(channel);
}

export type LiveSpecialRiderMode =
  | 'draft'
  | 'manual'
  | 'none'
  | null;

export type LiveGameData = {
  setup: {
    gameName: string;
    players: string;
    stages: string;
    restDays: string;

    playerNames: string[];
    playerColors: string[];

    playerRouleurSpecialRiders: string[];
    playerSprinteurSpecialRiders: string[];

    restDayStages: string[];

    teamIds: string[];
teamTypes: (
  | 'human'
  | 'normal-ai'
  | 'muscle'
  | 'peloton'
)[];

    scoringRules: {
      yellow: number[];
      sprint: number[];
      mountain: number[];
      team: number[];
    };
    bonusAwardMode: 'each-stage' | 'final-stage';
  };

  state: {
    currentStage: number;
    currentEntryType: 'stage' | 'restDay';
    tourEnded: boolean;

    stageState:
      | 'waiting-for-play'
      | 'playing'
      | 'ready-for-results';
  };

 results: {
  entries: GameResultEntry[];

restDayReview: {
  stageNumber: number;
  players: PlayerStageEntry[];
  readyPlayerIds: string[];
} | null;
};
};

export async function setLiveSpecialRiderMode(
  gameId: string,
  mode: LiveSpecialRiderMode
) {
  const { error } = await supabase
    .from('live_games')
    .update({
      special_rider_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    throw error;
  }
}

export async function createLiveDraftOrder(
  gameId: string
): Promise<string[]> {
  const players = await fetchLivePlayers(gameId);

  const shuffledPlayerIds = players.map(
  (player) => player.id
);

for (
  let i = shuffledPlayerIds.length - 1;
  i > 0;
  i--
) {
  const j = Math.floor(
    Math.random() * (i + 1)
  );

  [
    shuffledPlayerIds[i],
    shuffledPlayerIds[j],
  ] = [
    shuffledPlayerIds[j],
    shuffledPlayerIds[i],
  ];
}

  const { error } = await supabase
    .from('live_games')
    .update({
      draft_order: shuffledPlayerIds,
      draft_round: 1,
      draft_pick_index: 0,
      draft_started: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (error) {
    throw error;
  }

  return shuffledPlayerIds;
}
export async function makeLiveSpecialRiderPick(
  gameId: string,
  playerId: string,
  riderId: SpecialRiderId,
  riderType: 'sprinteur' | 'rouleur',
  currentPickIndex: number,
  draftOrder: string[],
  draftRound: number
) {

  const players = await fetchLivePlayers(gameId);

const teams = await fetchLiveTeams(gameId);

const maxUses =
  teams.length <= 3 ? 1 : 2;

const useCount = players.reduce((count, player) => {
  if (
    player.sprinteurSpecialRiderId === riderId ||
    player.rouleurSpecialRiderId === riderId
  ) {
    return count + 1;
  }

  return count;
}, 0);

if (useCount >= maxUses) {
  throw new Error(
    'This Special Rider is no longer available.'
  );
}

const playerUpdate =
  riderType === 'sprinteur'
    ? {
        sprinteur_special_rider_id: riderId,
        sprinteur_special_rider_set: true,
      }
    : {
        rouleur_special_rider_id: riderId,
        rouleur_special_rider_set: true,
      };

  const { error: playerError } = await supabase
    .from('live_players')
    .update(playerUpdate)
    .eq('id', playerId)
    .eq('game_id', gameId);

  if (playerError) {
    throw playerError;
  }

const isLastPickInRound1 =
  draftRound === 1 &&
  currentPickIndex === draftOrder.length - 1;

const nextDraftRound =
  isLastPickInRound1 ? 2 : draftRound;

let nextPickIndex: number;

if (isLastPickInRound1) {
  // Last player in Round 1 chooses again immediately.
  nextPickIndex = draftOrder.length - 1;
} else if (draftRound === 2) {
  // Snake draft moves backwards in Round 2.
  nextPickIndex = currentPickIndex - 1;
} else {
  // Round 1 moves forwards.
  nextPickIndex = currentPickIndex + 1;
}

const isLastPickInRound2 =
  draftRound === 2 &&
  currentPickIndex === 0;

if (isLastPickInRound2) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  await assignRandomSpecialRidersToLiveAI(
    gameId,
    identity.playerId,
    identity.playerToken
  );
}

const gameUpdate = isLastPickInRound2
  ? {
      phase: 'review',
      draft_round: 2,
      draft_pick_index: 0,
      updated_at: new Date().toISOString(),
    }
  : {
      draft_round: nextDraftRound,
      draft_pick_index: nextPickIndex,
      updated_at: new Date().toISOString(),
    };

const { error: gameError } = await supabase
  .from('live_games')
  .update(gameUpdate)
  .eq('id', gameId);

  if (gameError) {
    throw gameError;
  }
}

export async function setLivePlayerSpecialRider(
  gameId: string,
  playerId: string,
  riderType: 'sprinteur' | 'rouleur',
  riderId: SpecialRiderId | null
) {
  const playerUpdate =
    riderType === 'sprinteur'
      ? {
          sprinteur_special_rider_id: riderId,
        }
      : {
          rouleur_special_rider_id: riderId,
        };

  const { error } = await supabase
    .from('live_players')
    .update(playerUpdate)
    .eq('id', playerId)
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }
}

export async function confirmLiveGameReview(
  gameId: string,
  playerId: string
) {
  const { error } = await supabase
    .from('live_players')
    .update({
      review_confirmed: true,
    })
    .eq('id', playerId)
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }
}
export async function resetLiveSpecialRiderSetup(
  gameId: string
) {
  const { error: gameError } = await supabase
    .from('live_games')
    .update({
      phase: 'special-riders',
      special_rider_mode: null,
      draft_order: [],
      draft_round: 1,
      draft_pick_index: 0,
      draft_started: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', gameId);

  if (gameError) {
    throw gameError;
  }

  const { error: playersError } = await supabase
    .from('live_players')
    .update({
      sprinteur_special_rider_id: null,
      rouleur_special_rider_id: null,
      sprinteur_special_rider_set: false,
      rouleur_special_rider_set: false,
      review_confirmed: false,
    })
    .eq('game_id', gameId);

  if (playersError) {
    throw playersError;
  }
}

export type LiveBreakawayPhase =
  | 'rider-selection'
  | 'bid-1'
  | 'bid-1-results'
  | 'bid-2'
  | 'bid-2-results';

export type LiveBreakawayBid = {
  teamId: string;
  riderKey: 'sprinteur' | 'rouleur';

  bid1Submitted: boolean;
  bid2Submitted: boolean;

  bid1Value?: number;
  bid2Value?: number;
  totalBid?: number;
};

export type LiveBreakawayState = {
  mode: 'none' | 'one';
  completed: boolean;
  phase: LiveBreakawayPhase;
  bids: LiveBreakawayBid[];
  winnerIds: string[];
};

export async function selectLiveBreakawayRider(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur'
) {
  const { error } = await supabase.rpc(
    'select_live_breakaway_rider',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_rider_key: riderKey,
    }
  );

  if (error) {
    throw error;
  }
}

export async function startLiveBreakawayBid1(
  gameId: string
) {
  const currentState =
    await fetchLiveStageState(gameId);

  if (!currentState) {
    throw new Error(
      'Live stage state not found.'
    );
  }

  const { error } = await supabase
    .from('live_stage_state')
    .update({
      breakaway: {
        ...currentState.breakaway,
        phase: 'bid-1',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('game_id', gameId);

  if (error) {
    throw error;
  }
}

   export async function initializeLiveRiderState(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  specialRiderId?: SpecialRiderId
) {
  const riderState = createDummyRider(
    riderKey,
    specialRiderId
  );

  const { error } = await supabase.rpc(
    'initialize_live_rider_state',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_deck: riderState.deck,
      p_special_rider_id:
        specialRiderId ?? null,
    }
  );

  if (error) {
    throw error;
  }
}

export async function initializeLiveRiderStateFromDeck(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  deck: DummyCard[]
) {
  const { error } = await supabase.rpc(
    'initialize_live_rider_state',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_deck: deck,
      p_special_rider_id: null,
    }
  );

  if (error) {
    throw error;
  }
}

export async function initializeLiveTeamRiders(
  gameId: string,
  team: LiveTeam,
  ownerPlayer?: LivePlayer
) {
  if (team.teamType === 'peloton') {
  const pelotonTeam = createPelotonTeam();

  await initializeLivePelotonState(
    gameId,
    team.id,
    pelotonTeam.deck
  );

  return;
}

  if (team.teamType === 'muscle') {
    const muscleTeam = createMuscleTeam();

    await initializeLiveRiderStateFromDeck(
      gameId,
      team.id,
      'sprinteur',
      muscleTeam.sprinteur.deck
    );

    await initializeLiveRiderStateFromDeck(
      gameId,
      team.id,
      'rouleur',
      muscleTeam.rouleur.deck
    );

    return;
  }

  const sprinteurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.sprinteurSpecialRiderId
      : team.sprinteurSpecialRiderId;

  const rouleurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.rouleurSpecialRiderId
      : team.rouleurSpecialRiderId;

  await initializeLiveRiderState(
    gameId,
    team.id,
    'sprinteur',
    sprinteurSpecialRiderId
  );

  await initializeLiveRiderState(
    gameId,
    team.id,
    'rouleur',
    rouleurSpecialRiderId
  );
}

export async function initializeLivePlayerRiders(
  gameId: string,
  playerId: string,
  sprinteurSpecialRiderId?: SpecialRiderId,
  rouleurSpecialRiderId?: SpecialRiderId
) {
  await initializeLiveRiderState(
    gameId,
    playerId,
    'sprinteur',
    sprinteurSpecialRiderId
  );

  await initializeLiveRiderState(
    gameId,
    playerId,
    'rouleur',
    rouleurSpecialRiderId
  );
}



export async function drawLiveBreakawayHand(
  gameId: string
): Promise<DummyCard[]> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { data, error } = await supabase.rpc(
    'draw_live_breakaway_hand',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as DummyCard[];
}

export async function drawLiveRoundHand(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  drawCount: number
): Promise<DummyCard[]> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { data, error } = await supabase.rpc(
    'draw_live_round_hand',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_draw_count: drawCount,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as DummyCard[];
}

export async function submitLiveRoundCard(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  cardId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_round_card',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_card_id: cardId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function addLiveRoundFatigue(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur'
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'add_live_round_fatigue',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
    }
  );

  if (error) {
    throw error;
  }
}

export async function removeLiveRoundFatigue(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur'
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'remove_live_round_fatigue',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
    }
  );

  if (error) {
    throw error;
  }
}

export async function refreshLiveRoundRider(
  gameId: string,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  limit: 24 | 25
): Promise<DummyCard[]> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { data, error } = await supabase.rpc(
    'refresh_live_round_rider',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_limit: limit,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as DummyCard[];
}

export async function submitLiveBreakawayBid1(
  gameId: string,
  cardId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_breakaway_bid1',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token:
        identity.playerToken,
      p_card_id: cardId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function submitLiveBreakawayBid2(
  gameId: string,
  cardId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_breakaway_bid2',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token:
        identity.playerToken,
      p_card_id: cardId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function resolveLiveBreakaway(
  gameId: string,
  winnerTeamIds: string[]
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'resolve_live_breakaway',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_winner_team_ids: winnerTeamIds,
    }
  );

  if (error) {
    throw error;
  }
}

export async function getLiveBreakawayPendingHand(
  gameId: string
): Promise<DummyCard[]> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { data, error } = await supabase.rpc(
    'get_live_breakaway_pending_hand',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as DummyCard[];
}

export async function createLiveDummyTeam(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  team: {
    name: string;
    color: string;
    teamType:
      | 'normal-ai'
      | 'muscle'
      | 'peloton';
  }
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'create_live_dummy_team',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token: adminPlayerToken,
      p_name: team.name,
      p_color: team.color,
      p_team_type: team.teamType,
    }
  );

  if (error) {
    throw error;
  }

  return data as string;
}

export type LiveTeam = {
  id: string;
  gameId: string;
  name: string;
  color?: string;
  teamType:
    | 'human'
    | 'normal-ai'
    | 'muscle'
    | 'peloton';
  ownerPlayerId?: string;
  sprinteurSpecialRiderId?: SpecialRiderId;
  rouleurSpecialRiderId?: SpecialRiderId;
  sprinteurSpecialRiderSet: boolean;
  rouleurSpecialRiderSet: boolean;
};

export async function fetchLiveTeams(
  gameId: string
): Promise<LiveTeam[]> {
  const { data, error } = await supabase.rpc(
    'fetch_live_teams',
    {
      p_game_id: gameId,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []).map(
  (team: {
    id: string;
    game_id: string;
    name: string;
    color: string | null;
    team_type: string;
    owner_player_id: string | null;
    sprinteur_special_rider_id: string | null;
    rouleur_special_rider_id: string | null;
    sprinteur_special_rider_set: boolean;
rouleur_special_rider_set: boolean;
  }) => ({
    id: team.id,
    gameId: team.game_id,
    name: team.name,
    color: team.color ?? undefined,
    teamType:
      team.team_type as LiveTeam['teamType'],
    ownerPlayerId:
      team.owner_player_id ?? undefined,
    sprinteurSpecialRiderId:
      team.sprinteur_special_rider_id
        ? (team.sprinteur_special_rider_id as SpecialRiderId)
        : undefined,
    rouleurSpecialRiderId:
      team.rouleur_special_rider_id
        ? (team.rouleur_special_rider_id as SpecialRiderId)
        : undefined,
        sprinteurSpecialRiderSet:
  team.sprinteur_special_rider_set,

rouleurSpecialRiderSet:
  team.rouleur_special_rider_set,
  })
);
}

export async function setLiveAISpecialRider(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string,
  riderId: SpecialRiderId | null,
  riderType: 'sprinteur' | 'rouleur'
) {
  const { error } = await supabase.rpc(
    'set_live_ai_special_rider',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token: adminPlayerToken,
      p_team_id: teamId,
      p_rider_id: riderId,
      p_rider_type: riderType,
    }
  );

  if (error) {
    throw error;
  }
}

export async function assignRandomSpecialRidersToLiveAI(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string
) {
  const [players, teams] = await Promise.all([
    fetchLivePlayers(gameId),
    fetchLiveTeams(gameId),
  ]);

  const normalAITeams = teams.filter(
    (team) => team.teamType === 'normal-ai'
  );

  if (normalAITeams.length === 0) {
    return;
  }

  const maxUses = teams.length <= 3 ? 1 : 2;

  const useCounts = new Map<string, number>();

  for (const player of players) {
    if (player.sprinteurSpecialRiderId) {
      useCounts.set(
        player.sprinteurSpecialRiderId,
        (useCounts.get(player.sprinteurSpecialRiderId) ?? 0) + 1
      );
    }

    if (player.rouleurSpecialRiderId) {
      useCounts.set(
        player.rouleurSpecialRiderId,
        (useCounts.get(player.rouleurSpecialRiderId) ?? 0) + 1
      );
    }
  }

  const allSpecialRiders =
    Object.values(specialRiders);

  function getAvailableRiders(
    riderType: 'sprinteur' | 'rouleur'
  ) {
    return allSpecialRiders.filter(
      (rider) =>
        rider.riderType === riderType &&
        (useCounts.get(rider.id) ?? 0) < maxUses
    );
  }

  function pickRandomRider(
    riderType: 'sprinteur' | 'rouleur'
  ) {
    const available =
      getAvailableRiders(riderType);

    if (available.length === 0) {
      throw new Error(
        `No available ${riderType} Special Riders.`
      );
    }

    return available[
      Math.floor(Math.random() * available.length)
    ];
  }

  for (const team of normalAITeams) {
    const sprinteur =
      pickRandomRider('sprinteur');

    await setLiveAISpecialRider(
      gameId,
      adminPlayerId,
      adminPlayerToken,
      team.id,
      sprinteur.id,
      'sprinteur'
    );

    useCounts.set(
      sprinteur.id,
      (useCounts.get(sprinteur.id) ?? 0) + 1
    );

    const rouleur =
      pickRandomRider('rouleur');

    await setLiveAISpecialRider(
      gameId,
      adminPlayerId,
      adminPlayerToken,
      team.id,
      rouleur.id,
      'rouleur'
    );

    useCounts.set(
      rouleur.id,
      (useCounts.get(rouleur.id) ?? 0) + 1
    );
  }
}

export async function fetchLiveAIRiderStates(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string
): Promise<{
  sprinteur: DummyRiderState;
  rouleur: DummyRiderState;
}> {
  const { data, error } = await supabase.rpc(
    'fetch_live_ai_rider_states',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token: adminPlayerToken,
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }

const rows = (data ?? []) as {
  rider_key: RiderType;
  deck: DummyCard[];
  set_aside: DummyCard[];
  discard: DummyCard[];
  pending_hand: DummyCard[];
  special_rider_id: SpecialRiderId | null;
  round: number;
  last_played_value: number | null;

  strategy: SoloRiderStrategy | null;
  strategy_normal_draws: number;
  defensive_two_played: boolean;
  recovery_draws_remaining: number;
  last_fatigue_round: number | null;
  defensive_strategy_ended: boolean;
  super_sprinteur_power_cards_by_phase:
    | [number, number, number]
    | null;
}[];

  const sprinteurRow = rows.find(
    (row) => row.rider_key === 'sprinteur'
  );

  const rouleurRow = rows.find(
    (row) => row.rider_key === 'rouleur'
  );

  if (!sprinteurRow || !rouleurRow) {
    throw new Error(
      'AI rider states are incomplete.'
    );
  }

  return {
    sprinteur: {
  deck: sprinteurRow.deck,
  setAside: sprinteurRow.set_aside,
  discard: sprinteurRow.discard,
  pendingHand: sprinteurRow.pending_hand,
  specialRiderId:
    sprinteurRow.special_rider_id ?? undefined,
  round: sprinteurRow.round,
  lastPlayedValue:
    sprinteurRow.last_played_value ?? undefined,

  strategy:
    sprinteurRow.strategy ?? undefined,
  strategyNormalDraws:
    sprinteurRow.strategy_normal_draws,
  defensiveTwoPlayed:
    sprinteurRow.defensive_two_played,
  recoveryDrawsRemaining:
    sprinteurRow.recovery_draws_remaining,
  lastFatigueRound:
    sprinteurRow.last_fatigue_round ?? undefined,
  defensiveStrategyEnded:
    sprinteurRow.defensive_strategy_ended,
  superSprinteurPowerCardsByPhase:
    sprinteurRow.super_sprinteur_power_cards_by_phase ??
    undefined,
},

    rouleur: {
  deck: rouleurRow.deck,
  setAside: rouleurRow.set_aside,
  discard: rouleurRow.discard,
  pendingHand: rouleurRow.pending_hand,
  specialRiderId:
    rouleurRow.special_rider_id ?? undefined,
  round: rouleurRow.round,
  lastPlayedValue:
    rouleurRow.last_played_value ?? undefined,

  strategy:
    rouleurRow.strategy ?? undefined,
  strategyNormalDraws:
    rouleurRow.strategy_normal_draws,
  defensiveTwoPlayed:
    rouleurRow.defensive_two_played,
  recoveryDrawsRemaining:
    rouleurRow.recovery_draws_remaining,
  lastFatigueRound:
    rouleurRow.last_fatigue_round ?? undefined,
  defensiveStrategyEnded:
    rouleurRow.defensive_strategy_ended,
  superSprinteurPowerCardsByPhase:
    rouleurRow.super_sprinteur_power_cards_by_phase ??
    undefined,
},
  };
}

export async function autoSelectLiveAIBreakawayRiders(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string
) {
  const [teams, stageState] = await Promise.all([
    fetchLiveTeams(gameId),
    fetchLiveStageState(gameId),
  ]);

  if (!stageState) {
    throw new Error(
      'Live stage state not found.'
    );
  }

  const normalAITeams = teams.filter(
    (team) => team.teamType === 'normal-ai'
  );

  for (const team of normalAITeams) {
    const alreadySelected =
      stageState.breakaway.bids.some(
        (bid) => bid.teamId === team.id
      );

    if (alreadySelected) {
      continue;
    }

    const riderStates =
      await fetchLiveAIRiderStates(
        gameId,
        adminPlayerId,
        adminPlayerToken,
        team.id
      );

    const riderKey =
      chooseBreakawayRiderByFatigue(
        riderStates.sprinteur,
        riderStates.rouleur
      );

    await selectLiveBreakawayRider(
      gameId,
      team.id,
      riderKey
    );
  }
}

export async function drawLiveAIBreakawayHand(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string
): Promise<DummyCard[]> {
  const { data, error } = await supabase.rpc(
    'draw_live_ai_breakaway_hand',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token:
        adminPlayerToken,
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as DummyCard[];
}

export async function submitLiveAIBreakawayBid1(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string,
  cardId: string
) {
  const { error } = await supabase.rpc(
    'submit_live_ai_breakaway_bid1',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token:
        adminPlayerToken,
      p_team_id: teamId,
      p_card_id: cardId,
    }
  );

  if (error) {
    throw error;
  }
}

export async function autoSubmitLiveAIBreakawayBid1(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string
) {
  const [teams, stageState] =
    await Promise.all([
      fetchLiveTeams(gameId),
      fetchLiveStageState(gameId),
    ]);

  if (!stageState) {
    throw new Error(
      'Live stage state not found.'
    );
  }

  if (
    stageState.breakaway.phase !== 'bid-1'
  ) {
    return;
  }

  const normalAITeams = teams.filter(
    (team) => team.teamType === 'normal-ai'
  );

  for (const team of normalAITeams) {
    const bid =
      stageState.breakaway.bids.find(
        (item) => item.teamId === team.id
      );

    if (
      !bid ||
      bid.bid1Submitted
    ) {
      continue;
    }

    const cards =
      await drawLiveAIBreakawayHand(
        gameId,
        adminPlayerId,
        adminPlayerToken,
        team.id
      );

    const playerIndex = teams.findIndex(
  (item) => item.id === team.id
);

if (playerIndex === -1) {
  throw new Error(
    'AI team index not found.'
  );
}

const riderStates =
  await fetchLiveAIRiderStates(
    gameId,
    adminPlayerId,
    adminPlayerToken,
    team.id
  );

const selectedRider =
  bid.riderKey === 'sprinteur'
    ? riderStates.sprinteur
    : riderStates.rouleur;

const fatigueCards =
  selectedRider.deck.filter(
    (card) => card.type === 'fatigue'
  ).length;

const targetRange =
  getBreakawayTargetRange(
    playerIndex,
    stageState.stageType
  );

const target =
  chooseWeightedBreakawayTarget(
    targetRange,
    fatigueCards,
    stageState.stageType
  );

const selectedCard =
  chooseAIBreakawayBid1Card(
    cards,
    target
  );

    await submitLiveAIBreakawayBid1(
      gameId,
      adminPlayerId,
      adminPlayerToken,
      team.id,
      selectedCard.id
    );
  }
}

export async function submitLiveAIBreakawayBid2(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string,
  cardId: string
) {
  const { error } = await supabase.rpc(
    'submit_live_ai_breakaway_bid2',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token:
        adminPlayerToken,
      p_team_id: teamId,
      p_card_id: cardId,
    }
  );

  if (error) {
    throw error;
  }
}
export async function autoSubmitLiveAIBreakawayBid2(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string
) {
  const [teams, stageState] =
    await Promise.all([
      fetchLiveTeams(gameId),
      fetchLiveStageState(gameId),
    ]);

  if (!stageState) {
    throw new Error(
      'Live stage state not found.'
    );
  }

  if (
    stageState.breakaway.phase !== 'bid-2'
  ) {
    return;
  }

  const normalAITeams = teams.filter(
    (team) => team.teamType === 'normal-ai'
  );

  for (const team of normalAITeams) {
    const bid =
      stageState.breakaway.bids.find(
        (item) => item.teamId === team.id
      );

    if (
      !bid ||
      bid.bid2Submitted
    ) {
      continue;
    }

    const cards =
      await drawLiveAIBreakawayHand(
        gameId,
        adminPlayerId,
        adminPlayerToken,
        team.id
      );

    const playerIndex = teams.findIndex(
      (item) => item.id === team.id
    );

    if (playerIndex === -1) {
      throw new Error(
        'AI team index not found.'
      );
    }

    const riderStates =
      await fetchLiveAIRiderStates(
        gameId,
        adminPlayerId,
        adminPlayerToken,
        team.id
      );

    const selectedRider =
      bid.riderKey === 'sprinteur'
        ? riderStates.sprinteur
        : riderStates.rouleur;

    const fatigueCards =
      selectedRider.deck.filter(
        (card) => card.type === 'fatigue'
      ).length;

    const targetRange =
      getBreakawayTargetRange(
        playerIndex,
        stageState.stageType
      );

    const target =
      chooseWeightedBreakawayTarget(
        targetRange,
        fatigueCards,
        stageState.stageType
      );

    const bid1Value =
      bid.bid1Value ?? 0;

    const selectedCard =
      chooseAIBreakawayBid2Card(
        cards,
        target,
        bid1Value
      );

    await submitLiveAIBreakawayBid2(
      gameId,
      adminPlayerId,
      adminPlayerToken,
      team.id,
      selectedCard.id
    );
  }
}

export async function startLiveRoundDraw(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'start_live_round_draw',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function submitLiveAIRoundCard(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  riderState: DummyRiderState,
  selectedCard: DummyCard
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_ai_round_card',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_rider_state: riderState,
      p_selected_card: selectedCard,
    }
  );

  if (error) {
    throw error;
  }
}

export async function undoLiveAIRoundCard(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  riderState: DummyRiderState
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'undo_live_ai_round_card',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_rider_state: riderState,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveAIRiderState(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  riderState: DummyRiderState,
  markRefreshed = false
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_ai_rider_state',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_rider_state: riderState,
      p_mark_refreshed: markRefreshed,
    }
  );

  if (error) {
    throw error;
  }
}

export async function fetchLiveMuscleRiderStates(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string
): Promise<MuscleTeamState> {
  const { data, error } = await supabase.rpc(
    'fetch_live_muscle_rider_states',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token: adminPlayerToken,
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as {
    rider_key: RiderType;
    deck: DummyCard[];
    discard: DummyCard[];
    round: number;
  }[];

  const sprinteur = rows.find(
    (row) => row.rider_key === 'sprinteur'
  );

  const rouleur = rows.find(
    (row) => row.rider_key === 'rouleur'
  );

  if (!sprinteur || !rouleur) {
    throw new Error(
      'Muscle rider state not found.'
    );
  }

  return {
    sprinteur: {
      deck: sprinteur.deck ?? [],
      discard: sprinteur.discard ?? [],
      round: sprinteur.round ?? 0,
    },
    rouleur: {
      deck: rouleur.deck ?? [],
      discard: rouleur.discard ?? [],
      round: rouleur.round ?? 0,
    },
  };
}

export async function submitLiveMuscleRoundCard(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  riderState: MuscleTeamState[RiderType],
  selectedCard: DummyCard
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_muscle_round_card',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_rider_state: riderState,
      p_selected_card: selectedCard,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveMuscleRiderState(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  riderState: MuscleTeamState[RiderType],
  markRefreshed = false
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_muscle_rider_state',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_rider_state: riderState,
      p_mark_refreshed: markRefreshed,
    }
  );

  if (error) {
    throw error;
  }
}

export async function initializeLivePelotonState(
  gameId: string,
  teamId: string,
  deck: DummyCard[]
): Promise<void> {
  const { error } = await supabase.rpc(
    'initialize_live_peloton_state',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_deck: deck,
    }
  );

  if (error) {
    throw error;
  }
}

export async function fetchLivePelotonState(
  gameId: string,
  adminPlayerId: string,
  adminPlayerToken: string,
  teamId: string
): Promise<PelotonTeamState> {
  const { data, error } = await supabase.rpc(
    'fetch_live_peloton_state',
    {
      p_game_id: gameId,
      p_admin_player_id: adminPlayerId,
      p_admin_player_token: adminPlayerToken,
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }

  const row = data?.[0];

  if (!row) {
    throw new Error(
      'Peloton state not found.'
    );
  }

  return {
    deck: row.deck ?? [],
    discard: row.discard ?? [],
    round: row.round ?? 0,
  };
}

export async function submitLivePelotonRoundCard(
  gameId: string,
  teamId: string,
  pelotonState: PelotonTeamState,
  selectedCard: DummyCard
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'submit_live_peloton_round_card',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_peloton_state: pelotonState,
      p_selected_card: selectedCard,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLivePelotonState(
  gameId: string,
  teamId: string,
  pelotonState: PelotonTeamState,
  markRefreshed = false
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found.'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_peloton_state',
    {
      p_game_id: gameId,
      p_admin_player_id: identity.playerId,
      p_admin_player_token:
        identity.playerToken,
      p_team_id: teamId,
      p_peloton_state: pelotonState,
      p_mark_refreshed: markRefreshed,
    }
  );

  if (error) {
    throw error;
  }
}

export type LiveStageResult = {
  id: string;
  gameId: string;
  stageNumber: number;
  teamId: string;
  riderKey: 'sprinteur' | 'rouleur';
  time: string;
  tourPoints: string;
  mountainPoints: string;
  sprintPoints: string;
  fatigueCards: string;
  submitted: boolean;
};

export async function fetchLiveStageResults(
  gameId: string,
  stageNumber: number
): Promise<LiveStageResult[]> {
  const { data, error } = await supabase.rpc(
    'fetch_live_stage_results',
    {
      p_game_id: gameId,
      p_stage_number: stageNumber,
    }
  );

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: {
  id: string;
  game_id: string;
  stage_number: number;
  team_id: string;
  rider_key: string;
  result_time: string | null;
  tour_points: string | null;
  mountain_points: string | null;
  sprint_points: string | null;
  fatigue_cards: string | null;
  submitted: boolean;
}) => ({
    id: row.id as string,
    gameId: row.game_id as string,
    stageNumber: Number(row.stage_number),
    teamId: row.team_id as string,
    riderKey:
      row.rider_key as LiveStageResult['riderKey'],
    time: String(row.result_time ?? ''),
    tourPoints: String(row.tour_points ?? ''),
    mountainPoints: String(
      row.mountain_points ?? ''
    ),
    sprintPoints: String(
      row.sprint_points ?? ''
    ),
    fatigueCards: String(
      row.fatigue_cards ?? ''
    ),
    submitted: Boolean(row.submitted),
  }));
}

export async function updateLiveStageResultField(
  gameId: string,
  stageNumber: number,
  teamId: string,
  riderKey: 'sprinteur' | 'rouleur',
  field:
    | 'time'
    | 'tour_points'
    | 'mountain_points'
    | 'sprint_points'
    | 'fatigue_cards',
  value: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_stage_result_field',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_stage_number: stageNumber,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_field: field,
      p_value: value,
    }
  );

  if (error) {
    throw error;
  }
}
export async function fetchLiveStageEntryRiderStates(
  gameId: string
): Promise<
  {
    teamId: string;
    riderKey: RiderType;
    riderState: DummyRiderState;
  }[]
> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { data, error } = await supabase.rpc(
    'fetch_live_stage_entry_rider_states',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as {
    team_id: string;
    rider_key: RiderType;
    deck: DummyCard[];
    set_aside: DummyCard[];
    pending_hand: DummyCard[];
  }[];

  return rows.map((row) => ({
    teamId: row.team_id,
    riderKey: row.rider_key,
   riderState: {
  deck: row.deck ?? [],
  setAside: row.set_aside ?? [],
  discard: [],
  pendingHand: row.pending_hand ?? [],
  round: 0,

  strategyNormalDraws: 0,
  defensiveTwoPlayed: false,
  recoveryDrawsRemaining: 0,
  defensiveStrategyEnded: false,
},
  }));
}

export async function initializeLiveStageResultFatigue(
  gameId: string,
  stageNumber: number,
  teamId: string,
  riderKey: RiderType,
  fatigueCards: number
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'initialize_live_stage_result_fatigue',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
      p_stage_number: stageNumber,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_fatigue_cards: fatigueCards,
    }
  );

  if (error) {
    throw error;
  }
}

export async function finishLiveStageEntry(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'finish_live_stage_entry',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function markLiveStageSaveReady(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'mark_live_stage_save_ready',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export function buildLiveStagePlayers(
  teams: LiveTeam[],
  results: LiveStageResult[],
  teamIds: string[]
): PlayerStageEntry[] {

  const orderedTeams = teamIds
  .map((teamId) =>
    teams.find((team) => team.id === teamId)
  )
  .filter(
    (team): team is LiveTeam => Boolean(team)
  );

  let tieBreakOrder = 0;

return orderedTeams.map((team) => {
    const sprinteur = results.find(
      (result) =>
        result.teamId === team.id &&
        result.riderKey === 'sprinteur'
    );

    const rouleur = results.find(
      (result) =>
        result.teamId === team.id &&
        result.riderKey === 'rouleur'
    );

    return {
      sprinteur: {
        time: sprinteur?.time ?? '',
        tourPoints: sprinteur?.tourPoints ?? '',
        mountainPoints:
          sprinteur?.mountainPoints ?? '',
        sprintPoints:
          sprinteur?.sprintPoints ?? '',
        fatigueCards:
          sprinteur?.fatigueCards ?? '',
        tieBreakOrder: tieBreakOrder++,
      },

      rouleur: {
        time: rouleur?.time ?? '',
        tourPoints: rouleur?.tourPoints ?? '',
        mountainPoints:
          rouleur?.mountainPoints ?? '',
        sprintPoints:
          rouleur?.sprintPoints ?? '',
        fatigueCards:
          rouleur?.fatigueCards ?? '',
        tieBreakOrder: tieBreakOrder++,
      },
    };
  });
}

export async function syncCompletedLiveStage(
  teams: LiveTeam[],
  results: LiveStageResult[],
  stageNumber: number,
  teamIds: string[]
) {
  const alreadySaved = gameResults.entries.some(
    (entry) =>
      entry.entryType === 'stage' &&
      entry.stageNumber === stageNumber
  );

  if (!alreadySaved) {
    const playersToSave =
  buildLiveStagePlayers(
    teams,
    results,
    teamIds
  );

    gameResults.addEntry({
      entryType: 'stage',
      stageNumber,
      players: playersToSave,
    });

    const restDayStages =
      createGameDraft.restDayStages.map(Number);

    if (restDayStages.includes(stageNumber)) {
      gameState.currentStage = stageNumber;
      gameState.currentEntryType = 'restDay';
    } else {
      gameState.currentStage =
        stageNumber + 1;
      gameState.currentEntryType = 'stage';
    }
  }

  await saveGame();
  await updateActiveSavedGame();
}

export async function completeLiveStage(
  gameId: string,
  stageNumber: number,
  players: PlayerStageEntry[]
) {
  const { error } = await supabase.rpc(
    'complete_live_stage',
    {
      p_game_id: gameId,
      p_stage_number: stageNumber,
      p_players: players,
    }
  );

  if (error) {
    throw error;
  }
}

export async function completeLiveRestDay(
  gameId: string,
  stageNumber: number,
  players: PlayerStageEntry[]
) {
  const { error } = await supabase.rpc(
    'complete_live_rest_day',
    {
      p_game_id: gameId,
      p_stage_number: stageNumber,
      p_players: players,
    }
  );

  if (error) {
    throw error;
  }
}

export async function publishLiveRestDayReview(
  gameId: string,
  stageNumber: number,
  players: PlayerStageEntry[]
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'publish_live_rest_day_review',
    {
      p_game_id: gameId,
      p_stage_number: stageNumber,
      p_players: players,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function approveLiveRestDayReview(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'approve_live_rest_day_review',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveGameResultEntry(
  gameId: string,
  entryIndex: number,
  entry: GameResultEntry
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_game_result_entry',
    {
      p_game_id: gameId,
      p_entry_index: entryIndex,
      p_entry: entry,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveGameSettings(
  gameId: string,
  settings: {
    gameName: string;
    stages: string;
    restDayStages: string[];
    scoringRules: LiveGameData['setup']['scoringRules'];
    bonusAwardMode: LiveGameData['setup']['bonusAwardMode'];
  }
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'update_live_game_settings',
    {
      p_game_id: gameId,
      p_game_name: settings.gameName,
      p_stages: settings.stages,
      p_rest_day_stages:
        settings.restDayStages,
      p_scoring_rules:
        settings.scoringRules,
      p_bonus_award_mode:
  settings.bonusAwardMode ?? 'each-stage',
      p_player_id: identity.playerId,
      p_player_token:
        identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function updateLiveTeamSettings(
  gameId: string,
  teamIndex: number,
  settings: {
    name: string;
    color: string;
    teamType: 'human' | 'normal-ai' | 'muscle' | 'peloton';
    sprinteurSpecialRiderId: string;
    rouleurSpecialRiderId: string;
  }
) {
  const identity = await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error('Live player identity not found');
  }

  const { error } = await supabase.rpc(
    'update_live_team_settings',
    {
      p_game_id: gameId,
      p_team_index: teamIndex,
      p_name: settings.name,
      p_color: settings.color,
      p_team_type: settings.teamType,
      p_sprinteur_special_rider_id:
        settings.sprinteurSpecialRiderId,
      p_rouleur_special_rider_id:
        settings.rouleurSpecialRiderId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function replaceLiveRiderDeck(
  gameId: string,
  teamId: string,
  riderKey: RiderType,
  specialRiderId?: SpecialRiderId
) {
  const identity = await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error('Live player identity not found');
  }

  const riderState = createDummyRider(
    riderKey,
    specialRiderId
  );

  const { error } = await supabase.rpc(
    'replace_live_rider_deck',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_rider_key: riderKey,
      p_deck: riderState.deck,
      p_special_rider_id:
        specialRiderId ?? null,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function resetLiveTeamRiderState(
  gameId: string,
  teamId: string
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'reset_live_team_rider_state',
    {
      p_game_id: gameId,
      p_team_id: teamId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function removeLiveTeamFromTour(
  gameId: string,
  teamIndex: number
): Promise<void> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'remove_live_team_from_tour',
    {
      p_game_id: gameId,
      p_team_index: teamIndex,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

export async function addLiveDummyTeam(
  gameId: string,
  settings: {
    name: string;
    color: string;
    teamType: 'normal-ai' | 'muscle' | 'peloton';
    sprinteurSpecialRiderId: string;
    rouleurSpecialRiderId: string;
  }
): Promise<string> {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error('Live player identity not found');
  }

  const { data, error } = await supabase.rpc(
    'add_live_dummy_team',
    {
      p_game_id: gameId,
      p_name: settings.name,
      p_color: settings.color,
      p_team_type: settings.teamType,
      p_sprinteur_special_rider_id:
        settings.sprinteurSpecialRiderId,
      p_rouleur_special_rider_id:
        settings.rouleurSpecialRiderId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) throw error;

  if (!data) {
    throw new Error('New Live Team ID not returned');
  }

  return data as string;
}

export async function endLiveTour(
  gameId: string
) {
  const identity =
    await getLivePlayerIdentity(gameId);

  if (!identity) {
    throw new Error(
      'Live player identity not found'
    );
  }

  const { error } = await supabase.rpc(
    'end_live_tour',
    {
      p_game_id: gameId,
      p_player_id: identity.playerId,
      p_player_token: identity.playerToken,
    }
  );

  if (error) {
    throw error;
  }
}

