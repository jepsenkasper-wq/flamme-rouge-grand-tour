import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { getActiveSoloStageState, syncSoloFatigueTransfersFromDecks } from '@/lib/solo/activeSoloStage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { assignStrategiesForStage } from '@/lib/solo/strategyEngine';
import {
  chooseAIBreakawayBid1Card,
  chooseAIBreakawayBid2Card,
  chooseBreakawayRiderByFatigue,
  drawBreakawayHand,
  getBreakawayTarget,
  registerBreakawayBid,
  resolveBreakaway,
  selectBreakawayBidCard,
  selectBreakawayRider,
  startBreakaway,
  getBreakawayTargetRange,
chooseWeightedBreakawayTarget,
} from '@/lib/solo/breakawayEngine';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

type DrawListItem = {
  id: string;
  teamId: string;
  label: string;
  color: string;
  riderLabel?: 'S' | 'R';
  riderKey?: 'sprinteur' | 'rouleur';
  drawMode: 'human-app' | 'normal-ai' | 'muscle' | 'peloton';
};

function getDrawList(): DrawListItem[] {
  return createGameDraft.dummyTeams.flatMap<DrawListItem>((team) => {
    if (team.teamType === 'human' && team.drawMode !== 'app-draw') {
      return [];
    }

    if (team.teamType === 'peloton') {
      return [
        {
  id: `${team.id}-peloton`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  drawMode: 'peloton',
}
      ];
    }

    return [
      {
  id: `${team.id}-sprinteur`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  riderLabel: 'S',
  riderKey: 'sprinteur',
  drawMode:
    team.teamType === 'human'
      ? 'human-app'
      : team.teamType === 'normal-ai'
      ? 'normal-ai'
      : 'muscle',
},
      {
  id: `${team.id}-rouleur`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  riderLabel: 'R',
  riderKey: 'rouleur',
  drawMode:
    team.teamType === 'human'
      ? 'human-app'
      : team.teamType === 'normal-ai'
      ? 'normal-ai'
      : 'muscle',
},
    ];
  });
}

function getDrawModeLabel(
  mode: DrawListItem['drawMode']
): string {
  switch (mode) {
    case 'human-app':
      return 'Human (Draw Assist)';
    case 'normal-ai':
      return 'Normal AI';
    case 'muscle':
      return 'Muscle Team';
    case 'peloton':
      return 'Peloton Team';
  }
}

function getCurrentRound(): number {
  return getActiveSoloStageState().round;
}

function canEndRound(): boolean {
  const soloStage = getActiveSoloStageState();

  return soloStage.teams.every((team) => {
    if (team.teamType === 'human' && !team.usesAppDraw) {
      return true;
    }

    const played = team.playedCards ?? {};

    if (team.teamType === 'peloton') {
      return Boolean(played.peloton);
    }

    return Boolean(played.sprinteur && played.rouleur);
  });
}

export default function PlayStageScreen() {
  const [, setRefreshKey] = useState(0);

const [allowIncompleteRound, setAllowIncompleteRound] =
  useState(false);

useFocusEffect(
  useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, [])
);

  const drawList = getDrawList();

  const soloStage = getActiveSoloStageState();
const stageType = soloStage.stageType;
const raceType = soloStage.raceType ?? 'normal';

const humanAppDrawTeams = createGameDraft.dummyTeams.filter(
  (team) =>
    team.teamType === 'human' &&
    team.drawMode === 'app-draw'
);

const humanCardDrawTeams = createGameDraft.dummyTeams.filter(
  (team) =>
    team.teamType === 'human' &&
    team.drawMode === 'card-draw'
);

const allHumanBreakawayRidersSelected =
  humanAppDrawTeams.every((team) =>
    soloStage.breakaway.bids.some(
      (bid) => bid.teamId === team.id
    )
  );

const allHumanBid1Completed =
  humanAppDrawTeams.every((team) => {
    const bid = soloStage.breakaway.bids.find(
      (bid) => bid.teamId === team.id
    );

    return bid?.bid1CardId !== undefined;
  });

const allHumanBid2Completed =
  humanAppDrawTeams.every((team) => {
    const bid = soloStage.breakaway.bids.find(
      (bid) => bid.teamId === team.id
    );

    return bid?.bid2CardId !== undefined;
  });

const stageHasStarted =
  soloStage.round > 1 ||
  soloStage.teams.some((team) =>
    Object.values(team.playedCards ?? {}).some(Boolean)
  );

  const insets = useSafeAreaInsets();

const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

function setRaceType(
  raceType: 'normal' | 'time-trial' | 'team-time-trial'
) {
  if (stageHasStarted) {
    return;
  }

  soloStage.raceType = raceType;
  setRefreshKey((current) => current + 1);
}

async function endRound() {
  const soloStage = getActiveSoloStageState();

  soloStage.round++;

  if (soloStage.raceType === 'team-time-trial') {
  for (const team of soloStage.teams) {
    const gap = team.teamTimeTrialGap ?? 0;

    if (soloStage.stageType === 'mountain') {
      continue;
    }

    if (gap === 2) {
      const canProvide =
        team.teamTimeTrialCanProvideSlipstream?.sprinteur ?? true;

      if (canProvide) {
        team.teamTimeTrialGap = 1;
      }
    }

    if (gap === -2) {
      const canProvide =
        team.teamTimeTrialCanProvideSlipstream?.rouleur ?? true;

      if (canProvide) {
        team.teamTimeTrialGap = -1;
      }
    }
  }
}

  for (const team of soloStage.teams) {
  team.playedCards = {};

  if (soloStage.raceType === 'team-time-trial') {
    team.teamTimeTrialCanProvideSlipstream = {};
  }
}

await saveGame();
await updateActiveSavedGame();

setAllowIncompleteRound(false);

setRefreshKey((c) => c + 1);
}

async function drawAIBreakawayBid1() {
  for (const bid of soloStage.breakaway.bids) {
    const teamState = soloStage.teams.find(
      (team) => team.teamId === bid.teamId
    );

    if (!teamState || teamState.teamType !== 'normal-ai') {
      continue;
    }

    if (bid.bid1CardId !== undefined) {
      continue;
    }

    const riderState =
      bid.riderKey === 'sprinteur'
        ? teamState.sprinteur
        : teamState.rouleur;

    if (!riderState) {
      continue;
    }

    const cards = drawBreakawayHand(riderState);

if (cards.length === 0) {
  continue;
}

const playerIndex =
  createGameDraft.dummyTeams.findIndex(
    (team) => team.id === bid.teamId
  );

if (playerIndex === -1) {
  continue;
}

const targetRange = getBreakawayTargetRange(
  playerIndex,
  soloStage.stageType
);

const fatigueCards =
  riderState.setAside.filter(
    (card) => card.type === 'fatigue'
  ).length +
  riderState.discard.filter(
    (card) => card.type === 'fatigue'
  ).length +
  riderState.deck.filter(
    (card) => card.type === 'fatigue'
  ).length;

const target = chooseWeightedBreakawayTarget(
  targetRange,
  fatigueCards,
  soloStage.stageType
);

bid.target = target;

console.log('BREAKAWAY TARGET', {
  playerIndex,
  targetRange,
  fatigueCards,
  stageType: soloStage.stageType,
  target,
});

const selectedCard =
  chooseAIBreakawayBid1Card(
    cards,
    target
  );

selectBreakawayBidCard(
  riderState,
  cards,
  selectedCard
);

registerBreakawayBid(
  bid,
  selectedCard
);
  }

  soloStage.breakaway.phase = 'bid-1-results';

  await saveGame();
  await updateActiveSavedGame();

  setRefreshKey((current) => current + 1);
}

async function drawAIBreakawayBid2() {
  for (const bid of soloStage.breakaway.bids) {
    const teamState = soloStage.teams.find(
      (team) => team.teamId === bid.teamId
    );

    if (!teamState || teamState.teamType !== 'normal-ai') {
      continue;
    }

    if (bid.bid2CardId !== undefined) {
      continue;
    }

    const riderState =
      bid.riderKey === 'sprinteur'
        ? teamState.sprinteur
        : teamState.rouleur;

    if (!riderState) {
      continue;
    }

    const cards = drawBreakawayHand(riderState);

    if (cards.length === 0) {
      continue;
    }

 const playerIndex =
  createGameDraft.dummyTeams.findIndex(
    (team) => team.id === bid.teamId
  );

if (playerIndex === -1) {
  continue;
}

const target =
  bid.target ??
  getBreakawayTarget(
    playerIndex,
    soloStage.stageType
  );

const selectedCard =
  chooseAIBreakawayBid2Card(
    cards,
    target,
    bid.bid1Value ?? 0
  );

    selectBreakawayBidCard(
      riderState,
      cards,
      selectedCard
    );

    registerBreakawayBid(
      bid,
      selectedCard
    );
  }

  soloStage.breakaway.phase = 'bid-2-results';

  await saveGame();
  await updateActiveSavedGame();

  setRefreshKey((current) => current + 1);
}

function toggleBreakawayWinner(teamId: string) {
  const winnerIds = soloStage.breakaway.winnerIds;

  if (winnerIds.includes(teamId)) {
    soloStage.breakaway.winnerIds =
      winnerIds.filter((id) => id !== teamId);
  } else {
    soloStage.breakaway.winnerIds = [
      ...winnerIds,
      teamId,
    ];
  }

  setRefreshKey((current) => current + 1);
}

return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Play Stage {gameState.currentStage}
      </Text>

      {!stageHasStarted && (
        <View style={styles.stageTypeSection}>

<Text style={styles.stageTypeLabel}>
  Stage Type
</Text>

<View style={styles.stageTypeRow}>
  {[
    { key: 'normal', label: 'Normal' },
    { key: 'time-trial', label: 'Time Trial' },
    { key: 'team-time-trial', label: 'Team Time Trial' },
  ].map((item) => (
    <Pressable
      key={item.key}
      style={[
        styles.stageTypeButton,
        raceType === item.key &&
          styles.stageTypeButtonActive,
      ]}
      onPress={async () => {
  soloStage.raceType =
    item.key as typeof raceType;

  assignStrategiesForStage(soloStage);

  await saveGame();
  await updateActiveSavedGame();

  setRefreshKey((current) => current + 1);
}}
    >
      <Text
        style={[
          styles.stageTypeButtonText,
          raceType === item.key &&
            styles.stageTypeButtonTextActive,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  ))}
</View>

<View style={{ height: 24 }} />

          <View style={styles.stageTypeTitleRow}>
  <Text style={styles.stageTypeLabel}>
    Stage Profile
  </Text>

  <Pressable
    onPress={() =>
      Alert.alert(
        'Stage Profile',
        'Choose the profile that best matches the current stage. The selected profile helps the AI adapt its strategy for this stage.\n\n' +
        'Flat\nMostly flat, with few or no significant climbs.\n\n' +
        'Hills\nSeveral shorter climbs and frequent changes in terrain.\n\n' +
        'Mountain\nMultiple and/or long climbs.\n\n' +
        'Cobbles\nCobblestone sections are an important part of the stage.\n\n' +
        'Selecting a profile is optional. If no profile is selected, the AI uses its standard strategy.'
      )
    }>
    <Text style={styles.stageTypeHelp}>?</Text>
  </Pressable>
</View>

          <View style={styles.stageTypeRow}>
            {[
              { key: 'flat', label: 'Flat' },
              { key: 'hilly', label: 'Hills' },
              { key: 'mountain', label: 'Mountain' },
              { key: 'cobbles', label: 'Cobbles' },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.stageTypeButton,
                  stageType === item.key &&
                    styles.stageTypeButtonActive,
                ]}
                onPress={() => {
                  const isSelected = stageType === item.key;

                  Alert.alert(
                    isSelected
                      ? 'Clear Stage Profile?'
                      : 'Select Stage Profile?',
                    isSelected
                      ? `Remove "${item.label}" and use the standard AI strategy for this stage?`
                      : `Use "${item.label}" as the stage profile? This will affect the AI riders' strategy for this stage.`,
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Confirm',
                      onPress: async () => {
  soloStage.stageType = isSelected
    ? 'standard'
    : (item.key as typeof stageType);

  assignStrategiesForStage(soloStage);

  await saveGame();
  await updateActiveSavedGame();

  setRefreshKey((current) => current + 1);
},
                      },
                    ]
                  );
                }}
              >
                <Text
                  style={[
                    styles.stageTypeButtonText,
                    stageType === item.key &&
                      styles.stageTypeButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

{/*
{stageType !== 'standard' && (
  <View style={styles.strategyDebug}>
    <Text style={styles.strategyDebugTitle}>
      AI Strategy Debug
    </Text>

    {soloStage.teams.map((team, playerIndex) => {
      if (team.teamType !== 'normal-ai') {
        return null;
      }

      const teamName =
        createGameDraft.playerNames[playerIndex] ||
        `Player ${playerIndex + 1}`;

      return (
        <Text
          key={team.teamId}
          style={styles.strategyDebugText}
        >
          {teamName}: S = {team.sprinteur?.strategy ?? '-'} | R ={' '}
          {team.rouleur?.strategy ?? '-'}
        </Text>
      );
    })}
  </View>
)}
*/}

{raceType === 'normal' &&
  !stageHasStarted &&
  !soloStage.breakaway.completed && (
  <View style={styles.breakawaySection}>
    <Text style={styles.breakawayLabel}>Breakaway</Text>

    <View style={styles.breakawayRow}>
      <Pressable
        style={styles.breakawayButton}
       onPress={() => {
  Alert.alert(
    'No Breakaway',
    'Are you sure? This choice cannot be changed.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          startBreakaway(soloStage, 'none');

          await saveGame();
          await updateActiveSavedGame();

          setRefreshKey((current) => current + 1);
        },
      },
    ]
  );
}}
      >
        <Text style={styles.breakawayButtonText}>
          No Breakaway
        </Text>
      </Pressable>

      <Pressable
        style={styles.breakawayButton}
        onPress={() => {
  startBreakaway(soloStage, 'one');

  soloStage.teams.forEach((team) => {
    if (team.teamType !== 'normal-ai') {
      return;
    }

  if (!team.sprinteur || !team.rouleur) {
  return;
}

const riderKey = chooseBreakawayRiderByFatigue(
  team.sprinteur,
  team.rouleur
);

    selectBreakawayRider(
      soloStage,
      team.teamId,
      riderKey
    );
  });

  if (humanAppDrawTeams.length === 0) {
  soloStage.breakaway.phase = 'bid-1';
}

  setRefreshKey((current) => current + 1);
}}
      >
        <Text style={styles.breakawayButtonText}>
          Breakaway
        </Text>
      </Pressable>
    </View>
  </View>
)}

{raceType === 'normal' &&
  !stageHasStarted &&
  soloStage.breakaway.mode !== 'none' &&
  !soloStage.breakaway.completed &&
  humanAppDrawTeams.length > 0 && (
    <View style={styles.breakawayHumanSection}>
      <Text style={styles.breakawayLabel}>
        Select Human Breakaway Rider
      </Text>

      {humanAppDrawTeams.map((team) => {
  const selectedBid = soloStage.breakaway.bids.find(
    (bid) => bid.teamId === team.id
  );

  const bid1Completed =
    selectedBid?.bid1CardId !== undefined;

  return (
  <View
    key={team.id}
    style={[
  styles.row,
  styles.breakawayRiderRow,
]}
  >
    <Image
      source={riderImages[team.color]}
      style={styles.avatar}
    />

    <View style={styles.rowInfo}>
      <Text style={styles.rowText}>
        {team.name}
      </Text>
    </View>

    <View style={styles.breakawayRiderButtons}>
      <Pressable
        disabled={bid1Completed}
        style={[
          styles.breakawayRiderButton,
          selectedBid?.riderKey === 'sprinteur' &&
            styles.breakawayRiderButtonActive,
          bid1Completed &&
            styles.breakawayRiderButtonDisabled,
        ]}
        onPress={() => {
          selectBreakawayRider(
            soloStage,
            team.id,
            'sprinteur'
          );

          soloStage.breakaway.phase = 'bid-1';

          setRefreshKey((current) => current + 1);
        }}
      >
        <Text style={styles.breakawayRiderButtonText}>
          S
        </Text>
      </Pressable>

      <Pressable
        disabled={bid1Completed}
        style={[
          styles.breakawayRiderButton,
          selectedBid?.riderKey === 'rouleur' &&
            styles.breakawayRiderButtonActive,
          bid1Completed &&
            styles.breakawayRiderButtonDisabled,
        ]}
        onPress={() => {
          selectBreakawayRider(
            soloStage,
            team.id,
            'rouleur'
          );

          soloStage.breakaway.phase = 'bid-1';

          setRefreshKey((current) => current + 1);
        }}
      >
        <Text style={styles.breakawayRiderButtonText}>
          R
        </Text>
      </Pressable>
    </View>
  </View>
);
})}
    </View>
  )}

{raceType === 'normal' &&
soloStage.breakaway.phase === 'bid-1' &&
  humanAppDrawTeams.map((team) => {
    const bid = soloStage.breakaway.bids.find(
      (bid) => bid.teamId === team.id
    );

    if (!bid) {
      return null;
    }

    const bid1Completed =
      bid.bid1CardId !== undefined;

    const riderLabel =
      bid.riderKey === 'sprinteur' ? 'S' : 'R';

    return (
      <Pressable
        key={team.id}
        disabled={bid1Completed}
        style={[
          styles.row,
          bid1Completed && styles.buttonDisabled,
        ]}
        onPress={() => {
          router.push({
            pathname: '/draw',
            params: {
              teamId: team.id,
              riderKey: bid.riderKey,
              drawMode: 'human-app',
              breakawayBid: '1',
            },
          });
        }}
      >
        <Image
          source={riderImages[team.color]}
          style={styles.avatar}
        />

        <View style={styles.rowInfo}>
          <Text style={styles.rowText}>
            {team.name} - {riderLabel}
          </Text>

          <Text style={styles.rowSubText}>
            {bid1Completed
              ? `Bid 1 • Played: ${bid.bid1Value}`
              : 'Breakaway • Draw Bid 1'}
          </Text>
        </View>

        <Text style={styles.arrow}>
          {bid1Completed ? '✓' : '›'}
        </Text>
      </Pressable>
    );
  })}

{raceType === 'normal' &&
soloStage.breakaway.phase === 'bid-1' &&
  allHumanBid1Completed && (
  <Pressable
    style={styles.breakawayButton}
    onPress={drawAIBreakawayBid1}
  >
    <Text style={styles.breakawayButtonText}>
      Draw AI Bid 1
    </Text>
  </Pressable>
)}

{(raceType === 'normal' && soloStage.breakaway.phase === 'bid-1' ||
  soloStage.breakaway.phase === 'bid-1-results' ||
  soloStage.breakaway.phase === 'bid-2') &&
  soloStage.breakaway.bids.some(
    (bid) => bid.bid1Value !== undefined
  ) && (
    <View style={styles.breakawayResults}>
      <Text style={styles.breakawayLabel}>
        Bid 1 Results
      </Text>

      {soloStage.breakaway.bids.map((bid) => {
        if (bid.bid1Value === undefined) {
          return null;
        }

        const team = createGameDraft.dummyTeams.find(
          (team) => team.id === bid.teamId
        );

        if (!team) {
          return null;
        }

        const riderLabel =
          bid.riderKey === 'sprinteur' ? 'S' : 'R';

        return (
          <View
            key={bid.teamId}
            style={styles.row}
          >
            <Image
              source={riderImages[team.color]}
              style={styles.avatar}
            />

            <View style={styles.rowInfo}>
              <Text style={styles.rowText}>
                {team.name} - {riderLabel}
              </Text>

              <Text style={styles.rowSubText}>
                Bid 1
              </Text>
            </View>

            <Text style={styles.breakawayBidValue}>
              {bid.bid1Value}
            </Text>
          </View>
        );
      })}
    </View>
  )}

  {raceType === 'normal' &&
  soloStage.breakaway.phase === 'bid-1-results' && (
  <Pressable
    style={styles.breakawayButton}
    onPress={async () => {
      soloStage.breakaway.phase = 'bid-2';

      await saveGame();
      await updateActiveSavedGame();

      setRefreshKey((current) => current + 1);
    }}
  >
    <Text style={styles.breakawayButtonText}>
      Start Bid 2
    </Text>
  </Pressable>
)}

{raceType === 'normal' &&
soloStage.breakaway.phase === 'bid-2-results' &&
  !soloStage.breakaway.completed && (
  <View style={styles.breakawayResults}>
    <Text style={styles.breakawayLabel}>
      Breakaway Results
    </Text>

    <Text style={styles.breakawayWinnerHint}>
  Choose breakaway rider(s)
</Text>

    {soloStage.breakaway.bids.map((bid) => {
  const team = createGameDraft.dummyTeams.find(
    (team) => team.id === bid.teamId
  );

  if (!team) {
    return null;
  }

  const riderLabel =
    bid.riderKey === 'sprinteur' ? 'S' : 'R';

  const isSelected =
    soloStage.breakaway.winnerIds.includes(
      bid.teamId
    );

  return (
    <Pressable
      key={bid.teamId}
      style={[
        styles.row,
        isSelected &&
          styles.breakawayFinalResultSelected,
      ]}
      onPress={() =>
        toggleBreakawayWinner(bid.teamId)
      }
    >
      <Image
        source={riderImages[team.color]}
        style={styles.avatar}
      />

      <View style={styles.rowInfo}>
        <Text style={styles.rowText}>
          {team.name} - {riderLabel}
        </Text>

        <Text style={styles.rowSubText}>
          Bid 1: {bid.bid1Value ?? '-'} • Bid 2:{' '}
          {bid.bid2Value ?? '-'}
        </Text>
      </View>

      <Text style={styles.breakawayBidValue}>
        {bid.totalBid}
      </Text>
    </Pressable>
  );
})}

{humanCardDrawTeams.map((team) => {
  const isSelected =
    soloStage.breakaway.winnerIds.includes(
      team.id
    );

  return (
    <Pressable
      key={team.id}
      style={[
        styles.row,
        isSelected &&
          styles.breakawayFinalResultSelected,
      ]}
      onPress={() =>
        toggleBreakawayWinner(team.id)
      }
    >
      <Image
        source={riderImages[team.color]}
        style={styles.avatar}
      />

      <View style={styles.rowInfo}>
        <Text style={styles.rowText}>
          {team.name}
        </Text>

        <Text style={styles.rowSubText}>
          Human Card Draw
        </Text>
      </View>

      <Text style={styles.arrow}>
        {isSelected ? '✓' : '›'}
      </Text>
    </Pressable>
  );
})}
  </View>
)}

{raceType === 'normal' &&soloStage.breakaway.phase === 'bid-2-results' &&
  !soloStage.breakaway.completed &&
  soloStage.breakaway.winnerIds.length > 0 && (
    <Pressable
      style={styles.breakawayButton}
      onPress={async () => {
        resolveBreakaway(
          soloStage,
          soloStage.breakaway.winnerIds
        );

        await saveGame();
        await updateActiveSavedGame();

        setRefreshKey((current) => current + 1);
      }}
    >
      <Text style={styles.breakawayButtonText}>
        Confirm Breakaway Winners
      </Text>
    </Pressable>
)}

{raceType === 'normal' &&soloStage.breakaway.phase === 'bid-2' &&
  humanAppDrawTeams.map((team) => {
    const bid = soloStage.breakaway.bids.find(
      (bid) => bid.teamId === team.id
    );

    if (!bid) {
      return null;
    }

    const bid2Completed =
      bid.bid2CardId !== undefined;

    const riderLabel =
      bid.riderKey === 'sprinteur' ? 'S' : 'R';

    return (
      <Pressable
        key={team.id}
        disabled={bid2Completed}
        style={[
          styles.row,
          bid2Completed && styles.buttonDisabled,
        ]}
        onPress={() => {
          router.push({
            pathname: '/draw',
            params: {
              teamId: team.id,
              riderKey: bid.riderKey,
              drawMode: 'human-app',
              breakawayBid: '2',
            },
          });
        }}
      >
        <Image
          source={riderImages[team.color]}
          style={styles.avatar}
        />

        <View style={styles.rowInfo}>
          <Text style={styles.rowText}>
            {team.name} - {riderLabel}
          </Text>

          <Text style={styles.rowSubText}>
            {bid2Completed
              ? `Bid 2 • Played: ${bid.bid2Value}`
              : `Bid 1: ${bid.bid1Value ?? '-'} • Draw Bid 2`}
          </Text>
        </View>

        <Text style={styles.arrow}>
          {bid2Completed ? '✓' : '›'}
        </Text>
      </Pressable>
    );
  })}

  {raceType === 'normal' && soloStage.breakaway.phase === 'bid-2' &&
  allHumanBid2Completed && (
    <Pressable
      style={styles.breakawayButton}
      onPress={drawAIBreakawayBid2}
    >
      <Text style={styles.breakawayButtonText}>
        Draw AI Bid 2
      </Text>
    </Pressable>
)}

{raceType === 'normal' && soloStage.breakaway.completed &&
  soloStage.round === 1 &&
  soloStage.breakaway.winnerIds.length > 0 && (
    <View style={styles.breakawaySummary}>
      <Text style={styles.breakawayLabel}>
        Breakaway
      </Text>

      {soloStage.breakaway.bids
        .filter((bid) =>
          soloStage.breakaway.winnerIds.includes(bid.teamId)
        )
        .sort((a, b) => b.totalBid - a.totalBid)
        .map((bid) => {
          const team = createGameDraft.dummyTeams.find(
            (team) => team.id === bid.teamId
          );

          if (!team) {
            return null;
          }

          const riderLabel =
            bid.riderKey === 'sprinteur' ? 'S' : 'R';

          return (
            <Text
              key={bid.teamId}
              style={styles.breakawaySummaryText}
            >
              {team.name} – {riderLabel}: {bid.totalBid}
            </Text>
          );
        })}

        {humanCardDrawTeams
  .filter((team) =>
    soloStage.breakaway.winnerIds.includes(team.id)
  )
  .map((team) => (
    <Text
      key={team.id}
      style={styles.breakawaySummaryText}
    >
      {team.name} – Human Card Draw
    </Text>
  ))}
    </View>
  )}


{(raceType !== 'normal' || soloStage.breakaway.completed) && (
  <>
<Text style={styles.roundText}>
  Round {getCurrentRound()}
</Text>

<Text style={styles.roundHint}>
Draw Human teams before dummy teams.
</Text>

        {drawList.map((item) => {
  const soloStage = getActiveSoloStageState();

  const teamState = soloStage.teams.find(
    (team) => team.teamId === item.teamId
  );

  const playedCardKey =
    item.drawMode === 'peloton'
      ? 'peloton'
      : item.riderKey;

  const playedCard = playedCardKey
    ? teamState?.playedCards?.[playedCardKey]
    : undefined;

const isDrawLocked = Boolean(playedCard);

  return (
    <Pressable
            key={item.id}
            style={styles.row}
 onPress={() => {
  router.push({
    pathname: '/draw',
    params: {
      teamId: item.teamId,
      riderKey: item.riderKey ?? '',
      drawMode: item.drawMode,
    },
  });
}}>
                <Image
  source={riderImages[item.color]}
  style={styles.avatar}
/>
            <View style={styles.rowInfo}>
  <Text style={styles.rowText}>
    {item.label}
    {item.riderLabel ? ` - ${item.riderLabel}` : ''}
  </Text>

  <Text style={styles.rowSubText}>
  {playedCard
    ? `${getDrawModeLabel(item.drawMode)} • Played: ${playedCard.displayValue}`
    : `${getDrawModeLabel(item.drawMode)} • Round ${getCurrentRound()}`}
</Text>
</View>

<Text style={styles.arrow}>
  {isDrawLocked ? '✓' : '›'}
</Text>
              </Pressable>
  );
})}

<Pressable
  style={styles.incompleteRoundRow}
  onPress={() =>
    setAllowIncompleteRound((current) => !current)
  }>
  <View
    style={[
      styles.incompleteRoundToggle,
      allowIncompleteRound &&
        styles.incompleteRoundToggleActive,
    ]}>
    {allowIncompleteRound && (
      <Text style={styles.incompleteRoundCheck}>✓</Text>
    )}
  </View>

  <Text style={styles.incompleteRoundText}>
    Allow incomplete round
  </Text>
</Pressable>

<Pressable
  style={[
    styles.button,
    !(canEndRound() || allowIncompleteRound) &&
      styles.buttonDisabled,
  ]}
  disabled={!(canEndRound() || allowIncompleteRound)}
  onPress={endRound}>
  <Text style={styles.buttonText}>
    End Round {getCurrentRound()}
  </Text>
</Pressable>

        <Pressable
          style={styles.button}
          onPress={() => {
  syncSoloFatigueTransfersFromDecks();

  const soloStage = getActiveSoloStageState();

stageDraft.initialize(
  createGameDraft.playerNames.length,
  soloStage.fatigueTransfers,
  gameState.currentStage
);

  router.push('/enter-stage');
}}>
              <Text style={styles.buttonText}>End Stage</Text>
  </Pressable>

  </>
)}

</ScrollView>
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
    marginTop: -40,
    marginBottom: 24,
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

  arrow: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.red,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
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

avatar: {
  width: 32,
  height: 32,
  marginRight: 12,
},
rowSubText: {
  fontSize: 13,
  color: Colors.brown,
  marginTop: 2,
},
roundText: {
  textAlign: 'center',
  marginTop: 10,
  marginBottom: 16,
  fontSize: 16,
  fontWeight: '600',
  color: Colors.brown,
},
buttonDisabled: {
  opacity: 0.5,
},
roundHint: {
  fontSize: 13,
  color: '#777',
  textAlign: 'center',
  marginTop: -8,
  marginBottom: 12,
},

incompleteRoundRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16,
  marginBottom: 10,
},

incompleteRoundToggle: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: Colors.border,
  backgroundColor: Colors.card,
  alignItems: 'center',
  justifyContent: 'center',
},

incompleteRoundToggleActive: {
  backgroundColor: Colors.red,
  borderColor: Colors.red,
},

incompleteRoundCheck: {
  color: Colors.white,
  fontSize: 14,
  fontWeight: '900',
},

incompleteRoundText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},
stageTypeSection: {
  marginBottom: 24,
},

stageTypeLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
  marginBottom: 6,
},

stageTypeRow: {
  flexDirection: 'row',
  gap: 6,
},

stageTypeButton: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 4,
  borderRadius: 10,
  backgroundColor: Colors.red,
  borderWidth: 1,
  borderColor: Colors.red,
  alignItems: 'center',
},

stageTypeButtonActive: {
  opacity: 0.65,
},

stageTypeButtonText: {
  fontSize: 12,
  fontWeight: '700',
  color: Colors.white,
},

stageTypeButtonTextActive: {
  color: Colors.white,
},
stageTypeTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
},

stageTypeHelp: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.red,
  marginTop: -8,
},

strategyDebug: {
  marginBottom: 16,
  padding: 10,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 8,
},

strategyDebugTitle: {
  fontSize: 12,
  fontWeight: '700',
  marginBottom: 4,
},

strategyDebugText: {
  fontSize: 11,
},

breakawaySection: {
  marginBottom: 20,
},

breakawayLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
  marginBottom: 6,
},

breakawayRow: {
  flexDirection: 'row',
  gap: 8,
},

breakawayButton: {
  flex: 1,
  paddingVertical: 10,
  marginTop: 8,
  borderRadius: 10,
  backgroundColor: Colors.red,
  alignItems: 'center',
},

breakawayButtonText: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.white,
},
breakawayHumanSection: {
  marginBottom: 5,
},

breakawayHumanRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 10,
},

breakawayHumanName: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},

breakawayRiderButtons: {
  flexDirection: 'row',
  gap: 8,
},

breakawayRiderButton: {
  width: 42,
  height: 36,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: Colors.red,
  alignItems: 'center',
  justifyContent: 'center',
},

breakawayRiderButtonActive: {
  backgroundColor: Colors.red,
},

breakawayRiderButtonText: {
  fontSize: 14,
  fontWeight: '900',
  color: Colors.brown,
},

breakawayResults: {
  marginTop: 14,
  marginBottom: 14,
},

breakawayResultText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
  marginBottom: 4,
},

breakawayFinalResult: {
  marginBottom: 10,
},

breakawayResultDetail: {
  fontSize: 13,
  color: Colors.brown,
},

breakawayFinalResultSelected: {
  borderWidth: 2,
  borderColor: Colors.red,
  borderRadius: 8,
  padding: 8,
},

breakawayRiderButtonDisabled: {
  opacity: 0.4,
},

breakawayWinnerHint: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
  marginTop: 12,
  marginBottom: 8,
},

breakawaySummary: {
  marginBottom: 18,
},

breakawaySummaryText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
  marginBottom: 4,
},
breakawayBidValue: {
  fontSize: 22,
  fontWeight: '700',
},

breakawayRiderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderRadius: 12,
  marginBottom: 8,
  minHeight: 0,
},

breakawayRiderChoice: {
  width: 38,
  height: 38,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
},


});