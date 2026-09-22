import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Text,
  View,
} from 'react-native';

import {
  specialRiders,
  type SpecialRiderId,
} from '@/lib/solo/specialRiders';

import LiveChatBubble from '@/components/LiveChatBubble';

import { router, Stack } from 'expo-router';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';

import {
  fetchLiveStageState,
  subscribeToLiveStageState,
  unsubscribeFromLiveStageState,
  updateLiveStageSetup,
  selectLiveBreakawayRider,
  drawLiveBreakawayHand,
  startLiveBreakawayBid1,
  submitLiveBreakawayBid1,
  submitLiveBreakawayBid2,
  resolveLiveBreakaway,
  getLiveBreakawayPendingHand,
  fetchLivePlayers,
  autoSelectLiveAIBreakawayRiders,
  fetchLiveTeams,
  autoSubmitLiveAIBreakawayBid1,
  autoSubmitLiveAIBreakawayBid2,
  markLiveRoundReady,
  startLiveNextRound,
  startLiveRoundDraw,
  allowLiveIncompleteRound,
  revealLiveIncompleteRound,
  confirmLiveStageEnd,
LiveTeam,
requestLiveStageEnd,
  type LiveStageState,
  LivePlayer,
} from '@/lib/live/liveGames';

import type {
  DummyCard,
} from '@/lib/solo/dummyDeckEngine';

import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';
import { createGameDraft } from '@/lib/createGameDraft';
import { getLivePlayerIdentity } from '@/lib/livePlayerIdentity';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};



export default function LivePlayStageScreen() {
  const [stageState, setStageState] =
    useState<LiveStageState | null>(null);

const [players, setPlayers] =
  useState<LivePlayer[]>([]);

  const [teams, setTeams] =
  useState<LiveTeam[]>([]);


  const [loading, setLoading] =
    useState(true);

  const [isStartingNextRound, setIsStartingNextRound] =
  useState(false);

  const [bid1Hand, setBid1Hand] = useState<
  DummyCard[]
>([]);  

const [selectedBid1CardId, setSelectedBid1CardId] =
  useState<string | null>(null);

  const [bid2Hand, setBid2Hand] = useState<
  DummyCard[]
>([]);

const [selectedBid2CardId, setSelectedBid2CardId] =
  useState<string | null>(null);

const [selectedBreakawayWinnerIds, setSelectedBreakawayWinnerIds] =
  useState<string[]>([]);

  const liveSession =
    getActiveLiveGameSession();


  useEffect(() => {
    if (!liveSession) {
      setLoading(false);
      return;
    }

    let active = true;
    let loadVersion = 0;

    async function loadStageState() {
  const currentLoadVersion = ++loadVersion;

  try {
    const [
      state,
      livePlayers,
      liveTeams,
      pendingHand,
    ] = await Promise.all([
      fetchLiveStageState(
        liveSession!.gameId
      ),
      fetchLivePlayers(
        liveSession!.gameId
      ),
      fetchLiveTeams(
        liveSession!.gameId
      ),
      getLiveBreakawayPendingHand(
        liveSession!.gameId
      ),
    ]);



    if (
      active &&
      currentLoadVersion === loadVersion
    ) {
  setStageState(state);
  setPlayers(livePlayers);
  setTeams(liveTeams);

 const myLiveTeam = liveTeams.find(
  (team) =>
    team.teamType === 'human' &&
    team.ownerPlayerId === liveSession!.playerId
);

const myBid = state?.breakaway.bids.find(
  (bid) =>
    bid.teamId === myLiveTeam?.id
);

  if (
  state?.breakaway.phase === 'bid-1' &&
  !myBid?.bid1Submitted &&
  pendingHand.length > 0
) {
  setBid1Hand(pendingHand);
}

  if (
  state?.breakaway.phase === 'bid-2' &&
  !myBid?.bid2Submitted &&
  pendingHand.length > 0
) {
  setBid2Hand(pendingHand);
}

  setLoading(false);
}
      } catch (error) {
        console.error(
          'FETCH LIVE STAGE STATE ERROR',
          error
        );

        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStageState();

    const channel =
      subscribeToLiveStageState(
        liveSession.gameId,
        () => {
          void loadStageState();
        }
      );

    return () => {
      active = false;

      void unsubscribeFromLiveStageState(
        channel
      );
    };
  }, []);

useEffect(() => {
  if (
    !liveSession ||
    !liveSession.isAdmin ||
    !stageState ||
    stageState.breakaway.phase !==
      'rider-selection'
  ) {
    return;
  }

  const humanTeamIds = teams
    .filter(
      (team) => team.teamType === 'human'
    )
    .map((team) => team.id);

  const hasHumanSelection =
    stageState.breakaway.bids.some(
      (bid) =>
        humanTeamIds.includes(bid.teamId)
    );

  const hasUnselectedAI = teams.some(
    (team) =>
      team.teamType === 'normal-ai' &&
      !stageState.breakaway.bids.some(
        (bid) => bid.teamId === team.id
      )
  );

  if (
    !hasHumanSelection ||
    !hasUnselectedAI
  ) {
    return;
  }

  void (async () => {
    try {
      const identity =
        await getLivePlayerIdentity(
          liveSession.gameId
        );

      if (!identity) {
        throw new Error(
          'Live player identity not found.'
        );
      }

      await autoSelectLiveAIBreakawayRiders(
        liveSession.gameId,
        identity.playerId,
        identity.playerToken
      );
    } catch (error) {
      console.error(
        'AUTO SELECT LIVE AI BREAKAWAY RIDER ERROR',
        error
      );
    }
  })();
}, [
  stageState,
  teams,
  liveSession,
]);

useEffect(() => {
  if (
    !liveSession ||
    !liveSession.isAdmin ||
    !stageState ||
    stageState.breakaway.phase !== 'bid-1'
  ) {
    return;
  }

  const humanTeams = teams.filter(
    (team) => team.teamType === 'human'
  );

  const allHumansSubmitted =
    humanTeams.every((team) => {
      const bid =
        stageState.breakaway.bids.find(
          (item) => item.teamId === team.id
        );

      return bid?.bid1Submitted === true;
    });

  const hasUnsubmittedAI = teams.some(
    (team) =>
      team.teamType === 'normal-ai' &&
      stageState.breakaway.bids.some(
        (bid) =>
          bid.teamId === team.id &&
          !bid.bid1Submitted
      )
  );

  if (
    !allHumansSubmitted ||
    !hasUnsubmittedAI
  ) {
    return;
  }

  void (async () => {
    try {
      const identity =
        await getLivePlayerIdentity(
          liveSession.gameId
        );

      if (!identity) {
        throw new Error(
          'Live player identity not found.'
        );
      }

      await autoSubmitLiveAIBreakawayBid1(
        liveSession.gameId,
        identity.playerId,
        identity.playerToken
      );
    } catch (error) {
      console.error(
        'AUTO SUBMIT LIVE AI BREAKAWAY BID 1 ERROR',
        error
      );
    }
  })();
}, [
  stageState,
  teams,
  liveSession,
]);

useEffect(() => {
  if (
    !liveSession ||
    !liveSession.isAdmin ||
    !stageState ||
    stageState.breakaway.phase !== 'bid-2'
  ) {
    return;
  }

  const humanTeams = teams.filter(
    (team) => team.teamType === 'human'
  );

  const allHumansSubmitted =
    humanTeams.every((team) => {
      const bid =
        stageState.breakaway.bids.find(
          (item) => item.teamId === team.id
        );

      return bid?.bid2Submitted === true;
    });

  const hasUnsubmittedAI = teams.some(
    (team) =>
      team.teamType === 'normal-ai' &&
      stageState.breakaway.bids.some(
        (bid) =>
          bid.teamId === team.id &&
          !bid.bid2Submitted
      )
  );

  if (
    !allHumansSubmitted ||
    !hasUnsubmittedAI
  ) {
    return;
  }

  void (async () => {
    try {
      const identity =
        await getLivePlayerIdentity(
          liveSession.gameId
        );

      if (!identity) {
        throw new Error(
          'Live player identity not found.'
        );
      }

      await autoSubmitLiveAIBreakawayBid2(
        liveSession.gameId,
        identity.playerId,
        identity.playerToken
      );
    } catch (error) {
      console.error(
        'AUTO SUBMIT LIVE AI BREAKAWAY BID 2 ERROR',
        error
      );
    }
  })();
}, [
  stageState,
  teams,
  liveSession,
]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!liveSession || !stageState) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>
          Live Play
        </Text>

        <Text style={styles.text}>
          Stage information could not be loaded.
        </Text>
      </View>
    );
  }

  const isStageEntryReady =
  stageState?.stageEntryReadyPlayerIds.includes(
    liveSession?.playerId ?? ''
  ) ?? false;

if (
  stageState?.phase === 'stage-entry' &&
  liveSession
) {
  return (
    <View style={styles.stageEntryScreen}>
      <Text style={styles.stageEntryTitle}>
        STAGE FINISHED
      </Text>

      <Text style={styles.stageEntryText}>
        {isStageEntryReady
          ? 'Waiting for other players...'
          : 'Stage results are now being entered.'}
      </Text>

      {!isStageEntryReady && (
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push('/live-stage-entry')
          }
        >
          <Text style={styles.buttonText}>
            GO TO STAGE ENTRY
          </Text>
        </Pressable>
      )}
    </View>
  );
}

if (
  stageState?.phase === 'stage-overview' &&
  liveSession
) {
  return (
    <View style={styles.stageEntryScreen}>
      <Text style={styles.stageEntryTitle}>
        STAGE FINISHED
      </Text>

      <Text style={styles.stageEntryText}>
        Stage results are ready for review.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() =>
          router.push('/live-stage-overview')
        }
      >
        <Text style={styles.buttonText}>
          GO TO STAGE OVERVIEW
        </Text>
      </Pressable>
    </View>
  );
}

  const myTeam = teams.find(
  (team) =>
    team.teamType === 'human' &&
    team.ownerPlayerId === liveSession.playerId
);

const myBreakawayBid =
  stageState.breakaway.bids.find(
    (bid) =>
      bid.teamId === myTeam?.id
  );

const myBreakawayRider =
  myBreakawayBid?.riderKey;

const selectedRiderCount =
  stageState.breakaway.bids.length;

const breakawayTeams = teams.filter(
  (team) =>
    team.teamType === 'human' ||
    team.teamType === 'normal-ai'
);

const requiredRiderCount =
  breakawayTeams.length;

const allRidersSelected =
  selectedRiderCount >= requiredRiderCount;

type LiveDrawListItem = {
  id: string;
  teamId: string;
  teamName: string;
  color?: string;
  teamType:
    | 'human'
    | 'normal-ai'
    | 'muscle'
    | 'peloton';
  riderKey?: 'sprinteur' | 'rouleur';
  riderLabel: string;
  specialRiderId?: SpecialRiderId;
  canOpen: boolean;
};

const liveDrawList: LiveDrawListItem[] =
  teams.flatMap((team): LiveDrawListItem[] => {
  
    const ownerPlayer =
  team.teamType === 'human'
    ? players.find(
        (player) =>
          player.id === team.ownerPlayerId
      )
    : undefined;
    const canOpen =
      team.teamType === 'human'
        ? team.ownerPlayerId ===
          liveSession?.playerId
        : liveSession?.isAdmin === true;

    if (team.teamType === 'peloton') {
      return [
        {
          id: `${team.id}-peloton`,
          teamId: team.id,
          teamName: team.name,
          color: team.color,
          teamType: team.teamType,
          riderLabel: 'Peloton',
          canOpen,
        },
      ];
    }

    return [
      {
        id: `${team.id}-sprinteur`,
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        teamType: team.teamType,
        riderKey: 'sprinteur',
        riderLabel: 'Sprinteur',
        specialRiderId:
  team.teamType === 'human'
    ? ownerPlayer?.sprinteurSpecialRiderId
    : team.sprinteurSpecialRiderId,
        canOpen,
        
      },
      {
        id: `${team.id}-rouleur`,
        teamId: team.id,
        teamName: team.name,
        color: team.color,
        teamType: team.teamType,
        riderKey: 'rouleur',
        riderLabel: 'Rouleur',
        specialRiderId:
  team.teamType === 'human'
    ? ownerPlayer?.rouleurSpecialRiderId
    : team.rouleurSpecialRiderId,
        canOpen,
      },
    ];
  });

  const humanPlayerCount = players.length;

const readyPlayerCount =
  stageState?.roundReadyPlayerIds.length ?? 0;

const isReadyForNextRound =
  stageState?.roundReadyPlayerIds.includes(
    liveSession?.playerId ?? ''
  ) ?? false;

const allPlayersReady =
  humanPlayerCount > 0 &&
  readyPlayerCount === humanPlayerCount;

const stageEndReadyCount =
  stageState?.stageEndReadyPlayerIds.length ?? 0;

const isStageEndReady =
  stageState?.stageEndReadyPlayerIds.includes(
    liveSession?.playerId ?? ''
  ) ?? false;

const allPlayersStageEndReady =
  humanPlayerCount > 0 &&
  stageEndReadyCount === humanPlayerCount;

function getTeamTypeLabel(
  teamType: string
) {
  if (teamType === 'normal-ai') {
    return 'AI';
  }

  if (teamType === 'muscle') {
    return 'Muscle';
  }

  if (teamType === 'peloton') {
    return 'Peloton';
  }

  return '';
}

  return (
  <View style={styles.screen}>
    <Stack.Screen
  options={{
    headerBackVisible: false,
    headerLeft: () => (
  <Pressable
    onPress={() => {
      router.replace('/(tabs)');
    }}
    style={{
      width: 56,
      height: 44,
      justifyContent: 'center',
      paddingLeft: 8,
    }}
    hitSlop={10}
  >
    <Text
      style={{
        fontSize: 32,
        lineHeight: 32,
      }}
    >
      ‹
    </Text>
  </Pressable>
),
  }}
/>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Stage {stageState.stageNumber}
      </Text>

      {stageState.phase !== 'round-draw' &&
  stageState.phase !== 'round-reveal' &&
  stageState.breakaway.phase ===
    'rider-selection' && (
  <View style={styles.card}>

  <Text style={styles.sectionTitle}>
    Race Type
  </Text>

  <View style={styles.optionRow}>
    {[
      { key: 'normal', label: 'Normal' },
      { key: 'time-trial', label: 'Time Trial' },
      {
        key: 'team-time-trial',
        label: 'Team Time Trial',
      },
    ].map((option) => {
      const isSelected =
        stageState.raceType === option.key;

      return (
        <Pressable
          key={option.key}
          disabled={!liveSession.isAdmin}
          style={[
            styles.optionButton,
            isSelected &&
              styles.optionButtonActive,
            !liveSession.isAdmin &&
              styles.optionButtonDisabled,
          ]}
          onPress={async () => {
  await updateLiveStageSetup(
    liveSession.gameId,
    {
      raceType:
        option.key as LiveStageState['raceType'],

      ...(option.key !== 'normal'
        ? { breakawayMode: 'none' }
        : {}),
    }
  );
}}
        >
          <Text
            style={[
              styles.optionText,
              isSelected &&
                styles.optionTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>

  <Text style={styles.sectionTitle}>
    Stage Profile (relevant for AI riders)
  </Text>

  <View style={styles.optionRow}>
    {[
      { key: 'standard', label: 'Standard' },
      { key: 'flat', label: 'Flat' },
      { key: 'hilly', label: 'Hills' },
      { key: 'mountain', label: 'Mountain' },
      { key: 'cobbles', label: 'Cobbles' },
    ].map((option) => {
      const isSelected =
        stageState.stageType === option.key;

      return (
        <Pressable
          key={option.key}
          disabled={!liveSession.isAdmin}
          style={[
            styles.optionButton,
            isSelected &&
              styles.optionButtonActive,
            !liveSession.isAdmin &&
              styles.optionButtonDisabled,
          ]}
          onPress={async () => {
            await updateLiveStageSetup(
              liveSession.gameId,
              {
                stageType:
                  option.key as LiveStageState['stageType'],
              }
            );
          }}
        >
          <Text
            style={[
              styles.optionText,
              isSelected &&
                styles.optionTextActive,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      );
    })}
  </View>
{stageState.raceType === 'normal' && (
  <>
<Text style={styles.sectionTitle}>
  Breakaway
</Text>

<View style={styles.optionRow}>
  {[
    { key: 'none', label: 'No Breakaway' },
    { key: 'one', label: 'Breakaway' },
  ].map((option) => {
    const isSelected =
      stageState.breakaway.mode === option.key;

    return (
      <Pressable
        key={option.key}
        disabled={!liveSession.isAdmin}
        style={[
          styles.optionButton,
          isSelected &&
            styles.optionButtonActive,
          !liveSession.isAdmin &&
            styles.optionButtonDisabled,
        ]}
        onPress={async () => {
          await updateLiveStageSetup(
            liveSession.gameId,
            {
              breakawayMode:
                option.key as LiveStageState['breakaway']['mode'],
            }
          );
        }}
      >
        <Text
          style={[
            styles.optionText,
            isSelected &&
              styles.optionTextActive,
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    );
  })}
</View>

{stageState.breakaway.mode === 'one' && (
  <View style={styles.breakawaySelection}>
    <Text style={styles.sectionTitle}>
      Your Breakaway Rider
    </Text>

    <Text style={styles.helperText}>
      Choose which rider will attempt to join the breakaway.
    </Text>

    <View style={styles.optionRow}>
      {[
        {
          key: 'sprinteur',
          label: 'Sprinteur',
        },
        {
          key: 'rouleur',
          label: 'Rouleur',
        },
      ].map((option) => {
        const isSelected =
          myBreakawayRider === option.key;

        return (
          <Pressable
            key={option.key}
            style={[
              styles.optionButton,
              isSelected &&
                styles.optionButtonActive,
            ]}
            onPress={async () => {
          if (!myTeam) {
  return;
}

await selectLiveBreakawayRider(
  liveSession.gameId,
  myTeam.id,
  option.key as
    | 'sprinteur'
    | 'rouleur'
);
            }}
          >
            <Text
              style={[
                styles.optionText,
                isSelected &&
                  styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
)}
 </>
)}

{stageState.raceType === 'normal' &&
  stageState.breakaway.mode === 'one' && (
    <Text style={styles.readyText}>
      {selectedRiderCount}/{requiredRiderCount} riders selected
    </Text>
)}

{liveSession.isAdmin &&
  stageState.raceType === 'normal' &&
  stageState.breakaway.mode === 'one' && (
  <Pressable
    disabled={!allRidersSelected}
    style={[
      styles.continueButton,
      !allRidersSelected &&
        styles.continueButtonDisabled,
    ]}
    onPress={() =>
      startLiveBreakawayBid1(
        liveSession.gameId
      )
    }
  >
    <Text style={styles.continueButtonText}>
      Continue to Bid 1
    </Text>
  </Pressable>
)}
{liveSession.isAdmin &&
  (
    stageState.raceType !== 'normal' ||
    stageState.breakaway.mode === 'none'
  ) && (
    <Pressable
      style={styles.continueButton}
      onPress={async () => {
        try {
          await startLiveRoundDraw(
            liveSession.gameId
          );
        } catch (error) {
          console.error(
            'START LIVE ROUND DRAW ERROR',
            error
          );
        }
      }}
    >
      <Text style={styles.continueButtonText}>
        Start Stage
      </Text>
    </Pressable>
  )}
</View>
)}

{stageState.breakaway.phase === 'bid-1' && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Breakaway – Bid 1
    </Text>

    {myBreakawayBid?.bid1Submitted ? (
      <Text style={styles.helperText}>
        Waiting for other players...
      </Text>
    ) : bid1Hand.length === 0 ? (
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            const cards =
              await drawLiveBreakawayHand(
                liveSession.gameId
              );

            setBid1Hand(cards);
          } catch (error) {
            console.error(
              'DRAW LIVE BREAKAWAY HAND ERROR',
              error
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          DRAW CARDS
        </Text>
      </Pressable>
    ) : (
      <View style={styles.handRow}>
        {bid1Hand.map((card) => {
          const isSelected =
            selectedBid1CardId === card.id;

          return (
            <Pressable
              key={card.id}
              style={[
                styles.handCard,
                isSelected &&
                  styles.handCardSelected,
              ]}
              onPress={() =>
                setSelectedBid1CardId(card.id)
              }
            >
              <Text style={styles.cardValue}>
                {card.displayValue ?? card.value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    )}

    {!myBreakawayBid?.bid1Submitted &&
      selectedBid1CardId && (
        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              await submitLiveBreakawayBid1(
                liveSession.gameId,
                selectedBid1CardId
              );

              setBid1Hand([]);
              setSelectedBid1CardId(null);
            } catch (error) {
              console.error(
                'SUBMIT LIVE BREAKAWAY BID 1 ERROR',
                error
              );
            }
          }}
        >
          <Text style={styles.buttonText}>
            SUBMIT BID 1
          </Text>
        </Pressable>
      )}
  </View>
)}

{stageState.phase !== 'round-draw' &&
  stageState.phase !== 'round-reveal' &&
  (
    stageState.breakaway.phase === 'bid-1-results' ||
    stageState.breakaway.phase === 'bid-2' ||
    stageState.breakaway.phase === 'bid-2-results'
  ) && (
    <View style={styles.card}>
    <Text style={styles.sectionTitle}>
  {stageState.breakaway.phase === 'bid-2-results'
    ? 'Breakaway – Bid 2 Results'
    : 'Breakaway – Bid 1 Results'}
</Text>

    {stageState.breakaway.bids.map((bid) => {
      const team = teams.find(
  (team) => team.id === bid.teamId
);

if (!team) {
  return null;
}

      const riderLabel =
        bid.riderKey === 'sprinteur'
          ? 'Sprinteur'
          : 'Rouleur';

      return (
        <Pressable
  key={bid.teamId}
disabled={
  !liveSession.isAdmin ||
  stageState.breakaway.phase !==
    'bid-2-results' ||
  stageState.breakaway.completed
}   
 style={[
  styles.row,
  (
    selectedBreakawayWinnerIds.includes(
      bid.teamId
    ) ||
    (
      stageState.breakaway.completed &&
      stageState.breakaway.winnerIds.includes(
        bid.teamId
      )
    )
  ) &&
    styles.breakawayWinnerSelected,
]}
  onPress={() => {
    setSelectedBreakawayWinnerIds(
      (current) => {
        if (current.includes(bid.teamId)) {
          return current.filter(
            (id) => id !== bid.teamId
          );
        }

        if (current.length >= 2) {
          return current;
        }

        return [...current, bid.teamId];
      }
    );
  }}
>
          <Image
            source={
  riderImages[team.color ?? 'Blue']
}
            style={styles.avatar}
          />

          <View style={styles.rowInfo}>
            <Text style={styles.rowText}>
              {team.name} - {riderLabel}
            </Text>

            <Text style={styles.rowSubText}>
  {getTeamTypeLabel(team.teamType)
    ? `${getTeamTypeLabel(team.teamType)} · `
    : ''}
  Bid 1: {bid.bid1Value ?? '-'} • Bid 2:{' '}
  {bid.bid2Value ?? '-'}
</Text>
          </View>

          <Text
            style={styles.breakawayBidValue}
          >
            {bid.totalBid ?? bid.bid1Value ?? '-'}
          </Text>
          
        </Pressable>
        
      );
      
    })}

    {stageState.breakaway.completed && (
  <Text style={styles.helperText}>
    Breakaway confirmed
  </Text>
)}

{liveSession.isAdmin &&
  stageState.breakaway.completed &&
  stageState.phase !== 'round-draw' && (
    <Pressable
      style={styles.button}
      onPress={async () => {
        try {
          await startLiveRoundDraw(
            liveSession.gameId
          );
        } catch (error) {
          console.error(
            'START LIVE ROUND DRAW ERROR',
            error
          );
        }
      }}
    >
      <Text style={styles.buttonText}>
        START ROUND
      </Text>
    </Pressable>
  )}

    {liveSession.isAdmin &&
  stageState.breakaway.phase ===
    'bid-2-results' &&
  !stageState.breakaway.completed &&
  selectedBreakawayWinnerIds.length >= 1 && (
    <Pressable
      style={styles.button}
     onPress={async () => {
  try {
    await resolveLiveBreakaway(
      liveSession.gameId,
      selectedBreakawayWinnerIds
    );

    setSelectedBreakawayWinnerIds([]);
  } catch (error) {
    console.error(
      'RESOLVE LIVE BREAKAWAY ERROR',
      error
    );
  }
}}
    >
      <Text style={styles.buttonText}>
        CONFIRM BREAKAWAY
      </Text>
    </Pressable>
  )}
{stageState.breakaway.phase === 'bid-2' && (
  <>
    {myBreakawayBid?.bid2Submitted ? (
      <Text style={styles.helperText}>
        Waiting for other players...
      </Text>
    ) : bid2Hand.length === 0 ? (
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            const cards =
              await drawLiveBreakawayHand(
                liveSession.gameId
              );

            setBid2Hand(cards);
          } catch (error) {
            console.error(
              'DRAW LIVE BREAKAWAY BID 2 ERROR',
              error
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          DRAW BID 2 CARDS
        </Text>
      </Pressable>
    ) : (
      <>
        <View style={styles.handRow}>
          {bid2Hand.map((card) => {
            const isSelected =
              selectedBid2CardId === card.id;

            return (
              <Pressable
                key={card.id}
                style={[
                  styles.handCard,
                  isSelected &&
                    styles.handCardSelected,
                ]}
                onPress={() =>
                  setSelectedBid2CardId(
                    card.id
                  )
                }
              >
                <Text style={styles.cardValue}>
                  {card.displayValue ??
                    card.value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedBid2CardId && (
          <Pressable
            style={styles.button}
            onPress={async () => {
              try {
                await submitLiveBreakawayBid2(
                  liveSession.gameId,
                  selectedBid2CardId
                );

                setBid2Hand([]);
                setSelectedBid2CardId(null);
              } catch (error) {
                console.error(
                  'SUBMIT LIVE BREAKAWAY BID 2 ERROR',
                  error
                );
              }
            }}
          >
            <Text style={styles.buttonText}>
              SUBMIT BID 2
            </Text>
          </Pressable>
        )}
      </>
    )}
  </>
)}
  </View>
)}

{stageState.phase === 'round-draw' && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Round {stageState.round} – Draw
    </Text>

    {liveDrawList.map((item) => {
  const statusKey =
    item.riderKey
      ? `${item.teamId}:${item.riderKey}`
      : item.teamId;

  const drawStatus =
    stageState.drawStatus?.[statusKey] as
      | { submitted?: boolean }
      | undefined;

  const isSubmitted =
    drawStatus?.submitted === true;

  const canOpen =
  item.canOpen;

  return (
    <Pressable
        key={item.id}
        disabled={!canOpen}
        style={[
          styles.row,
          {
            opacity: canOpen ? 1 : 0.45,
          },
        ]}
onPress={() => {
  const canOpenDraw =
    item.teamType === 'human' ||
    item.teamType === 'normal-ai' ||
    item.teamType === 'muscle' ||
    item.teamType === 'peloton';

  if (!canOpenDraw) {
    return;
  }

  if (
    item.teamType !== 'peloton' &&
    !item.riderKey
  ) {
    return;
  }

  router.push({
    pathname: '/live-draw',
    params: {
      gameId: liveSession.gameId,
      teamId: item.teamId,
      riderKey: item.riderKey ?? '',
      teamType: item.teamType,
    },
  });
}}
      >
        <Image
          source={
            riderImages[item.color ?? 'Blue']
          }
          style={styles.avatar}
        />

        <View style={styles.rowInfo}>
          <Text style={styles.rowText}>
            {item.teamName} – {item.riderLabel}
          </Text>

          <Text style={styles.rowSubText}>
  {getTeamTypeLabel(item.teamType)
    ? `${getTeamTypeLabel(item.teamType)} · `
    : ''}
  {isSubmitted
    ? 'Card selected · Open rider'
    : item.canOpen
    ? 'Ready to draw'
    : 'Waiting for player'}
</Text>
        </View>
        </Pressable>
  );
})}

{liveSession.isAdmin &&
  !stageState.allowIncompleteRound && (
    <Pressable
      style={styles.button}
      onPress={async () => {
        try {
          await allowLiveIncompleteRound(
            liveSession.gameId
          );
        } catch (error) {
          console.error(
            'ALLOW INCOMPLETE ROUND ERROR',
            error
          );
        }
      }}
    >
      <Text style={styles.buttonText}>
        ALLOW INCOMPLETE ROUND
      </Text>
    </Pressable>
  )}
  
  {stageState.allowIncompleteRound && (
  <Text style={styles.helperText}>
    Incomplete rounds are allowed for the rest
    of this stage.
  </Text>
)}

{liveSession.isAdmin &&
  stageState.allowIncompleteRound && (
    <Pressable
      style={styles.button}
      onPress={async () => {
        try {
          await revealLiveIncompleteRound(
            liveSession.gameId
          );
        } catch (error) {
          console.error(
            'REVEAL INCOMPLETE ROUND ERROR',
            error
          );
        }
      }}
    >
      <Text style={styles.buttonText}>
        REVEAL ROUND {stageState.round}
      </Text>
    </Pressable>
  )}

  </View>
)}

{stageState.phase === 'round-reveal' && (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>
      Round {stageState.round} – Reveal
    </Text>

    {liveDrawList.map((item) => {
      const revealKey =
        item.riderKey
          ? `${item.teamId}:${item.riderKey}`
          : item.teamId;

      const revealedCard =
        stageState.revealedCards?.[
          revealKey
        ] as DummyCard | undefined;

      const specialRider =
  item.specialRiderId
    ? specialRiders[item.specialRiderId]
    : undefined;

      return (
        <Pressable
  key={item.id}
  disabled={!item.canOpen}
  style={[
    styles.row,
    {
      opacity: item.canOpen ? 1 : 0.45,
    },
  ]}
  onPress={() => {
    if (
      item.teamType !== 'peloton' &&
      !item.riderKey
    ) {
      return;
    }

    router.push({
      pathname: '/live-draw',
      params: {
        gameId: liveSession.gameId,
        teamId: item.teamId,
        riderKey: item.riderKey ?? '',
        teamType: item.teamType,
      },
    });
  }}
>
          <Image
            source={
              riderImages[
                item.color ?? 'Blue'
              ]
            }
            style={styles.avatar}
          />

          <View style={styles.rowInfo}>
            <Text style={styles.rowText}>
  {item.teamName}
  {item.riderLabel
    ? ` – ${item.riderLabel}`
    : ''}
</Text>

            <Text style={styles.rowSubText}>
  {[
    getTeamTypeLabel(item.teamType),
    specialRider?.name,
    'Played Card',
  ]
    .filter(Boolean)
    .join(' · ')}
</Text>
          </View>

          <Text style={styles.breakawayBidValue}>
  {revealedCard
    ? revealedCard.isSpecial
      ? `${revealedCard.value}*`
      : revealedCard.displayValue ?? revealedCard.value
    : '-'}
</Text>
        </Pressable>
      );
    })}
<Text style={styles.readyText}>
  {readyPlayerCount}/{humanPlayerCount} players ready
</Text>

{!isReadyForNextRound && (
  <Pressable
    style={styles.button}
    onPress={async () => {
      try {
        await markLiveRoundReady(
          liveSession.gameId
        );
      } catch (error) {
        console.error(
          'MARK LIVE ROUND READY ERROR',
          error
        );
      }
    }}
  >
    <Text style={styles.buttonText}>
      READY FOR NEXT ROUND
    </Text>
  </Pressable>
)}

{isReadyForNextRound &&
  !allPlayersReady && (
    <Text style={styles.helperText}>
      You are ready. Waiting for other players...
    </Text>
  )}

{allPlayersReady && (
  <Text style={styles.helperText}>
    All players are ready.
  </Text>
)}

{liveSession.isAdmin &&
  allPlayersReady && (
    <Pressable
      style={[
        styles.button,
        isStartingNextRound &&
          styles.buttonDisabled,
      ]}
      disabled={isStartingNextRound}
      onPress={async () => {
        if (isStartingNextRound) {
          return;
        }

        setIsStartingNextRound(true);

        try {
  await startLiveNextRound(
    liveSession.gameId
  );
} catch (error) {
  console.error(
    'START LIVE NEXT ROUND ERROR',
    error
  );
} finally {
  setIsStartingNextRound(false);
}
      }}
    >
      <Text style={styles.buttonText}>
        {isStartingNextRound
          ? 'STARTING...'
          : `START ROUND ${
              stageState.round + 1
            }`}
      </Text>
    </Pressable>
  )}

  </View>
)}


      <Text style={styles.roleText}>
        {liveSession.isAdmin
          ? 'You are the stage administrator.'
          : 'Waiting for the administrator.'}
      </Text>

{stageState.stageEndRequested && (
  <View style={styles.stageEndCard}>
    <Text style={styles.stageEndTitle}>
      END STAGE
    </Text>

    <Text style={styles.stageEndText}>
      {stageEndReadyCount}/{humanPlayerCount} players ready to end stage
    </Text>

    {!isStageEndReady && (
      <Pressable
        style={styles.button}
        onPress={async () => {
          try {
            await confirmLiveStageEnd(
              liveSession.gameId
            );
          } catch (error) {
            console.error(
              'CONFIRM LIVE STAGE END ERROR',
              error
            );
          }
        }}
      >
        <Text style={styles.buttonText}>
          CONFIRM END STAGE
        </Text>
      </Pressable>
    )}

    {isStageEndReady &&
      !allPlayersStageEndReady && (
        <Text style={styles.stageEndWaitingText}>
          Waiting for the other players...
        </Text>
      )}

    {allPlayersStageEndReady && (
      <Text style={styles.stageEndWaitingText}>
        All players are ready to end the stage.
      </Text>
    )}
  </View>
)}

{liveSession.isAdmin &&
  !stageState.stageEndRequested && (
    <Pressable
      style={styles.endStageButton}
      onPress={async () => {
        try {
          await requestLiveStageEnd(
            liveSession.gameId
          );
        } catch (error) {
          console.error(
            'REQUEST LIVE STAGE END ERROR',
            error
          );
        }
      }}
    >
      <Text style={styles.endStageButtonText}>
        END STAGE
      </Text>
    </Pressable>
  )}

      </ScrollView>
       <LiveChatBubble
      gameId={liveSession.gameId}
      screenKey="live-stage"
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
  padding: 24,
  paddingTop: 50,
  paddingBottom: 40,
},

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 20,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.brown,
    opacity: 0.65,
    marginTop: 10,
  },

  value: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
    marginTop: 2,
  },

  text: {
    fontSize: 16,
    color: Colors.brown,
    textAlign: 'center',
  },

  roleText: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brown,
    textAlign: 'center',
  },
  sectionTitle: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.brown,
  marginTop: 14,
  marginBottom: 8,
},

optionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
},

optionButton: {
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: Colors.red,
  backgroundColor: Colors.card,
},

optionButtonActive: {
  backgroundColor: Colors.red,
},

optionButtonDisabled: {
  opacity: 0.7,
},

optionText: {
  fontSize: 13,
  fontWeight: '800',
  color: Colors.brown,
},

optionTextActive: {
  color: Colors.white,
},

breakawaySelection: {
  marginTop: 16,
},

helperText: {
  fontSize: 13,
  color: Colors.brown,
  opacity: 0.7,
  marginBottom: 10,
},
readyText: {
  marginTop: 18,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
},

continueButton: {
  marginTop: 12,
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
},

continueButtonDisabled: {
  opacity: 0.4,
},

continueButtonText: {
  color: Colors.white,
  fontSize: 16,
  fontWeight: '900',
},
button: {
  marginTop: 16,
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  backgroundColor: Colors.red,
  alignItems: 'center',
},

buttonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '800',
},
handRow: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 16,
},

handCard: {
  flex: 1,
  minHeight: 80,
  borderWidth: 1,
  borderColor: '#b8aa91',
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#fff',
},

cardValue: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.brown,
},
handCardSelected: {
  borderWidth: 3,
  transform: [{ scale: 1.05 }],
},
row: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 18,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
},

avatar: {
  width: 32,
  height: 32,
  marginRight: 12,
},

rowInfo: {
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'center',
},

rowText: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
},

rowSubText: {
  fontSize: 13,
  color: Colors.brown,
  marginTop: 2,
},

breakawayBidValue: {
  fontSize: 22,
  fontWeight: '700',
},
breakawayWinnerSelected: {
  borderWidth: 3,
  transform: [{ scale: 1.02 }],
},
buttonDisabled: {
  opacity: 0.5,
},
endStageButton: {
  marginTop: 32,
  marginBottom: 16,
  paddingVertical: 14,
  borderWidth: 1,
  borderColor: Colors.red,
  borderRadius: 14,
  alignItems: 'center',
},

endStageButtonText: {
  color: Colors.red,
  fontWeight: '900',
},

stageEndCard: {
  marginTop: 32,
  padding: 16,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
},

stageEndTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 24,
  color: Colors.brown,
  textAlign: 'center',
},

stageEndText: {
  color: Colors.brown,
  textAlign: 'center',
  marginBottom: 12,
},

stageEndWaitingText: {
  color: Colors.brown,
  textAlign: 'center',
  marginTop: 8,
},

stageEntryScreen: {
  flex: 1,
  backgroundColor: Colors.paper,
  padding: 24,
  justifyContent: 'center',
  alignItems: 'center',
},

stageEntryTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 32,
  color: Colors.brown,
  letterSpacing: 1,
  textAlign: 'center',
},

stageEntryText: {
  color: Colors.brown,
  textAlign: 'center',
  marginTop: 8,
  marginBottom: 24,
},

});