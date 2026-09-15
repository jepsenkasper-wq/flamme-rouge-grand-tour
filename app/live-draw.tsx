import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import {
  Image,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { 
    drawLiveRoundHand, 
    submitLiveRoundCard,
    addLiveRoundFatigue, 
    fetchLiveStageState,
    removeLiveRoundFatigue,
    refreshLiveRoundRider,
    fetchLiveAIRiderStates,
  submitLiveAIRoundCard,
  undoLiveAIRoundCard,
  updateLiveAIRiderState,
  LiveStageState,
  fetchLiveMuscleRiderStates,
submitLiveMuscleRoundCard,
fetchLivePelotonState,
submitLivePelotonRoundCard,
updateLivePelotonState,
updateLiveMuscleRiderState,
fetchLiveTeams,
  type LiveTeam,
  fetchLivePlayers,
  type LivePlayer,
} from '@/lib/live/liveGames';
import {
  getDrawCount,
  playDummyRound,
  DummyCard,
  cloneDummyRiderState,
  addFatigueCardToSetAside,
  removeFatigueCardFromSetAside,
  refreshFromDiscard,
} from '@/lib/solo/dummyDeckEngine';

import type {
    DummyRiderState,
  DummyScenario,
  RiderType,
  WindScenario,
} from '@/lib/solo/dummyDeckEngine';

import {
  getLivePlayerIdentity,
} from '@/lib/livePlayerIdentity';

import {
  drawMuscleCard,
  refreshMuscleTeam,
} from '@/lib/solo/muscleDeckEngine';

import {
  drawPelotonCard,
  refreshPelotonTeam,
} from '@/lib/solo/peletonDeckEngine';

type RiderKey = 'sprinteur' | 'rouleur';

function formatCard(card: DummyCard): string {
  const value =
    card.displayValue ?? card.value;

  const specialMark =
    card.isSpecial ? '*' : '';

  return card.type === 'fatigue'
    ? `F${value}${specialMark}`
    : `${value}${specialMark}`;
}

function getPlayerColor(colorName: string) {
  switch (colorName) {
    case 'Blue':
      return '#2f5fb3';
    case 'White':
      return '#f7f1df';
    case 'Green':
      return '#2f8a3e';
    case 'Red':
      return '#b7372f';
    case 'Black':
      return '#222222';
    case 'Pink':
      return '#d97aa7';
    default:
      return Colors.border;
  }
}

function formatSpecialRiderName(
  specialRiderId?: string
): string {
  if (!specialRiderId) {
    return 'Normal';
  }

  return specialRiderId
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

export default function LiveDrawScreen() {
const params = useLocalSearchParams<{
  gameId: string;
  teamId: string;
  riderKey: RiderKey;
  teamType:
    | 'human'
    | 'normal-ai'
    | 'muscle'
    | 'peloton';
}>();

const isNormalAI =
  params.teamType === 'normal-ai';
const isHuman =
  params.teamType === 'human';
const isMuscle =
  params.teamType === 'muscle';
const isPeloton =
  params.teamType === 'peloton';

  const [drawnCards, setDrawnCards] =
    useState<DummyCard[]>([]);

  const [selectedCard, setSelectedCard] =
    useState<DummyCard | null>(null);

const [team, setTeam] =
  useState<LiveTeam | null>(null);

  useEffect(() => {
  async function loadTeam() {
    try {
      const [teams, loadedPlayers] =
        await Promise.all([
          fetchLiveTeams(params.gameId),
          fetchLivePlayers(params.gameId),
        ]);

      const currentTeam =
        teams.find(
          (item) => item.id === params.teamId
        ) ?? null;

      setTeam(currentTeam);
      setPlayers(loadedPlayers);
    } catch (error) {
      console.error(
        'LOAD LIVE DRAW TEAM ERROR',
        error
      );
    }
  }

  void loadTeam();
}, [params.gameId, params.teamId]);

const [players, setPlayers] =
  useState<LivePlayer[]>([]);

const [windScenario, setWindScenario] =
  useState<WindScenario>('normal');

const [scenario, setScenario] =
  useState<DummyScenario>('normal');

const [aiUndoSnapshot, setAIUndoSnapshot] =
  useState<DummyRiderState | null>(null);

const [hasRefreshed, setHasRefreshed] =
  useState(false);

useEffect(() => {
  async function loadRefreshStatus() {
    try {
      const stageState =
        await fetchLiveStageState(
          params.gameId
        );

      if (!stageState) {
        return;
      }

      const statusKey =
        `${params.teamId}:${params.riderKey}`;

      const drawStatus =
        stageState.drawStatus?.[statusKey] as
          | { refreshed?: boolean }
          | undefined;

      setHasRefreshed(
        drawStatus?.refreshed === true
      );
    } catch (error) {
      console.error(
        'LOAD LIVE REFRESH STATUS ERROR',
        error
      );
    }
  }

  void loadRefreshStatus();
}, [
  params.gameId,
  params.teamId,
  params.riderKey,
]);

const [stageState, setStageState] =
  useState<LiveStageState | null>(null);

useEffect(() => {
  async function loadStageState() {
    try {
      const state =
        await fetchLiveStageState(
          params.gameId
        );

      setStageState(state);
    } catch (error) {
      console.error(
        'LOAD LIVE STAGE STATE ERROR',
        error
      );
    }
  }

  void loadStageState();
}, [params.gameId]);

  const [actionMessage, setActionMessage] =
    useState('');

  function showActionMessage(message: string) {
    setActionMessage(message);

    setTimeout(() => {
      setActionMessage('');
    }, 1200);
  }

  const riderImage =
  params.riderKey === 'sprinteur'
    ? require(
        '@/assets/images/riders/rider-sprinteur.png'
      )
    : require(
        '@/assets/images/riders/rider-rouleur.png'
      );

const riderLabel =
  isPeloton
    ? 'Peloton'
    : params.riderKey === 'sprinteur'
    ? 'Sprinteur'
    : 'Rouleur';

const riderShortLabel =
  isPeloton
    ? ''
    : params.riderKey === 'sprinteur'
    ? 'S'
    : 'R';

  async function drawHand() {
    try {
      const cards =
       await drawLiveRoundHand(
  params.gameId,
  params.teamId,
  params.riderKey,
  getDrawCount(windScenario)
);

      setDrawnCards(cards);
    } catch (error) {
      console.error(
        'DRAW LIVE ROUND HAND ERROR',
        error
      );
    }
  }

  async function selectCard(card: DummyCard) {
    try {
      await submitLiveRoundCard(
        params.gameId,
        params.teamId,
        params.riderKey,
        card.id
      );

      setSelectedCard(card);
      setDrawnCards([]);
    } catch (error) {
      console.error(
  'SUBMIT LIVE ROUND CARD ERROR',
  JSON.stringify(error, null, 2)
);
    }
  }

  async function addFatigue() {
    try {
      await addLiveRoundFatigue(
        params.gameId,
        params.teamId,
        params.riderKey
      );

      showActionMessage(
        'Fatigue card added.'
      );
    } catch (error) {
      console.error(
        'ADD LIVE ROUND FATIGUE ERROR',
        error
      );
    }
  }

  async function removeFatigue() {
  try {
    await removeLiveRoundFatigue(
      params.gameId,
      params.teamId,
      params.riderKey
    );

    showActionMessage(
      'Fatigue card removed.'
    );
  } catch (error) {
    console.error(
      'REMOVE LIVE ROUND FATIGUE ERROR',
      error
    );
  }
}

function confirmRefresh(limit: 24 | 25) {
  Alert.alert(
    `Refresh ${limit}`,
    `Are you sure you want to refresh with a limit of ${limit}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Refresh',
        onPress: () => {
          void refreshRider(limit);
        },
      },
    ]
  );
}

async function refreshRider(limit: 24 | 25) {
  try {
    const refreshedCards =
      await refreshLiveRoundRider(
        params.gameId,
        params.teamId,
        params.riderKey,
        limit
      );
      setHasRefreshed(true);

    if (refreshedCards.length === 0) {
      showActionMessage(
        `No cards refreshed (${limit}).`
      );

      return;
    }

    showActionMessage(
      `${refreshedCards.length} card${
        refreshedCards.length === 1 ? '' : 's'
      } refreshed (${limit}).`
    );
  } catch (error) {
    console.error(
      'REFRESH LIVE ROUND RIDER ERROR',
      error
    );
  }
}

async function playNormalAIDraw() {
  if (
    !isNormalAI ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(
        params.gameId
      );

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const aiRiders =
      await fetchLiveAIRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const riderState =
      aiRiders[params.riderKey];


if (!stageState) {
  throw new Error(
    'Live stage state not found.'
  );
}

    const drawCount =
      getDrawCount(windScenario);

const statusKey =
  `${params.teamId}:${params.riderKey}`;

const drawStatus =
  stageState.drawStatus?.[statusKey] as
    | { refreshed?: boolean }
    | undefined;

const refreshUsed =
  drawStatus?.refreshed === true;

setAIUndoSnapshot(
  cloneDummyRiderState(riderState)
);

const result = playDummyRound(
  riderState,
  scenario,
  stageState.round,
  drawCount,
  refreshUsed,
  stageState.stageType,
  stageState.raceType
);

    await submitLiveAIRoundCard(
      params.gameId,
      params.teamId,
      params.riderKey,
      riderState,
      result.selectedCard
    );

    setSelectedCard(
      result.selectedCard
    );

    setDrawnCards([]);

    showActionMessage(
      'AI card selected.'
    );
  } catch (error) {
    console.error(
      'LIVE NORMAL AI DRAW ERROR',
      error
    );
  }
}

async function undoNormalAIDraw() {
  if (
    !isNormalAI ||
    !aiUndoSnapshot ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    await undoLiveAIRoundCard(
      params.gameId,
      params.teamId,
      params.riderKey,
      aiUndoSnapshot
    );

    setAIUndoSnapshot(null);
    setSelectedCard(null);
    setDrawnCards([]);

    showActionMessage(
      'AI draw undone.'
    );
  } catch (error) {
    console.error(
      'UNDO LIVE AI DRAW ERROR',
      error
    );
  }
}

async function addAIFatigue() {
  if (
    !isNormalAI ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(params.gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const aiRiders =
      await fetchLiveAIRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const riderState =
      aiRiders[params.riderKey];

    addFatigueCardToSetAside(riderState);

    await updateLiveAIRiderState(
      params.gameId,
      params.teamId,
      params.riderKey,
      riderState
    );

    showActionMessage(
      'Fatigue added.'
    );
  } catch (error) {
    console.error(
      'ADD LIVE AI FATIGUE ERROR',
      error
    );
  }
}

async function removeAIFatigue() {
  if (
    !isNormalAI ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(params.gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const aiRiders =
      await fetchLiveAIRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const riderState =
      aiRiders[params.riderKey];

    removeFatigueCardFromSetAside(
      riderState
    );

    await updateLiveAIRiderState(
      params.gameId,
      params.teamId,
      params.riderKey,
      riderState
    );

    showActionMessage(
      'Fatigue removed.'
    );
  } catch (error) {
    console.error(
      'REMOVE LIVE AI FATIGUE ERROR',
      error
    );
  }
}

async function refreshAI(limit: 24 | 25) {
  if (
    !isNormalAI ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(params.gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    if (!stageState) {
  throw new Error(
    'Live stage state not found.'
  );
}

    const aiRiders =
      await fetchLiveAIRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const riderState =
      aiRiders[params.riderKey];

refreshFromDiscard(
  riderState,
  limit,
  stageState.stageType
);

    await updateLiveAIRiderState(
      params.gameId,
      params.teamId,
      params.riderKey,
      riderState,
      true
    );

    setHasRefreshed(true);

    showActionMessage(
      `Refreshed to ${limit}.`
    );
  } catch (error) {
    console.error(
      'REFRESH LIVE AI ERROR',
      error
    );
  }
}

async function playMuscleDraw() {
  if (
    !isMuscle ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(params.gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const muscleTeam =
      await fetchLiveMuscleRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const selectedCard = drawMuscleCard(
      muscleTeam,
      params.riderKey
    );

    await submitLiveMuscleRoundCard(
      params.gameId,
      params.teamId,
      params.riderKey,
      muscleTeam[params.riderKey],
      selectedCard
    );

    setSelectedCard(selectedCard);
    setDrawnCards([]);

    showActionMessage(
      'Muscle card selected.'
    );
  } catch (error) {
    console.error(
      'LIVE MUSCLE DRAW ERROR',
      error
    );
  }
}

async function refreshMuscle(limit: 24 | 25) {
  if (
    !isMuscle ||
    !params.gameId ||
    !params.teamId ||
    !params.riderKey
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(params.gameId);

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const muscleTeam =
      await fetchLiveMuscleRiderStates(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    refreshMuscleTeam(
      muscleTeam,
      params.riderKey,
      limit
    );

    await updateLiveMuscleRiderState(
      params.gameId,
      params.teamId,
      params.riderKey,
      muscleTeam[params.riderKey],
      true
    );

    setHasRefreshed(true);

    showActionMessage(
      `Refreshed to ${limit}.`
    );
  } catch (error) {
    console.error(
      'REFRESH LIVE MUSCLE ERROR',
      error
    );
  }
}

async function playPelotonDraw() {
  if (
    !isPeloton ||
    !params.gameId ||
    !params.teamId
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(
        params.gameId
      );

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const pelotonState =
      await fetchLivePelotonState(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    const selectedCard =
      drawPelotonCard(pelotonState);

    await submitLivePelotonRoundCard(
      params.gameId,
      params.teamId,
      pelotonState,
      selectedCard
    );

    setSelectedCard(selectedCard);
    setDrawnCards([]);

    showActionMessage(
      'Peloton card selected.'
    );
  } catch (error) {
    console.error(
      'LIVE PELOTON DRAW ERROR',
      error
    );
  }
}

async function refreshPeloton(limit: 24 | 25) {
  if (
    !isPeloton ||
    !params.gameId ||
    !params.teamId
  ) {
    return;
  }

  try {
    const identity =
      await getLivePlayerIdentity(
        params.gameId
      );

    if (!identity) {
      throw new Error(
        'Live player identity not found.'
      );
    }

    const pelotonState =
      await fetchLivePelotonState(
        params.gameId,
        identity.playerId,
        identity.playerToken,
        params.teamId
      );

    refreshPelotonTeam(
      pelotonState,
      limit
    );

    await updateLivePelotonState(
      params.gameId,
      params.teamId,
      pelotonState,
      true
    );

    setHasRefreshed(true);

    showActionMessage(
      `Refreshed to ${limit}.`
    );
  } catch (error) {
    console.error(
      'REFRESH LIVE PELOTON ERROR',
      error
    );
  }
}

const ownerPlayer =
  team?.ownerPlayerId
    ? players.find(
        (player) =>
          player.id === team.ownerPlayerId
      )
    : undefined;

const specialRiderId =
  params.riderKey === 'sprinteur'
    ? team?.teamType === 'human'
      ? ownerPlayer?.sprinteurSpecialRiderId
      : team?.sprinteurSpecialRiderId
    : team?.teamType === 'human'
    ? ownerPlayer?.rouleurSpecialRiderId
    : team?.rouleurSpecialRiderId;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen
        options={{
          title: 'Live Draw',
        }}
      />

      

      <View style={styles.entryHero}>
  <View style={styles.playerTitleRow}>
    <Text
      style={[
        styles.playerStar,
        {
          color: getPlayerColor(
            team?.color ?? ''
          ),
        },
      ]}
    >
      ★
    </Text>

    <Text style={styles.playerTitle}>
      {team?.name ?? 'Team'}
      {riderShortLabel
        ? ` – ${riderShortLabel}`
        : ''}
    </Text>

    <Text
      style={[
        styles.playerStar,
        {
          color: getPlayerColor(
            team?.color ?? ''
          ),
        },
      ]}
    >
      ★
    </Text>
  </View>

<Image
  source={riderImage}
  style={styles.riderImage}
  resizeMode="stretch"
/>

<Text style={styles.riderName}>
  {riderLabel}
</Text>

{(isHuman || isNormalAI) && (
  <>
    <Text style={styles.deckInfo}>
      {specialRiderId
        ? `Special Rider: ${formatSpecialRiderName(
            specialRiderId
          )}`
        : 'Normal deck'}
    </Text>

    {specialRiderId && (
      <Text style={styles.deckInfoSmall}>
        * = Special Rider card
      </Text>
    )}
  </>
)}

  {isMuscle && (
    <Text style={styles.deckInfo}>
      Muscle
    </Text>
  )}

</View>

        <View style={styles.drawArea}>
          <Text style={styles.sectionTitle}>
            Choose Card
          </Text>

        {drawnCards.length === 0 && !selectedCard && (
            <>
           {isNormalAI && (
  <View style={styles.scenarioSection}>
    <Text style={styles.sectionTitle}>
      Scenario
    </Text>

    <View style={styles.scenarioRow}>
      {(
        [
  ['normal', 'Normal'],
  ['climb', 'Ascent'],
  ['descent', 'Descent'],

  ...(
    stageState?.stageType === 'mountain' ||
    stageState?.stageType === 'hilly'
      ? [
          ['open-valley', 'Open Valley'] as const,
        ]
      : []
  ),

  ['supply-zone', 'Supply Zone'],
  ['sprint', 'Sprint'],
] as const
      ).map(([value, label]) => (
        <Pressable
          key={value}
          style={[
            styles.scenarioButton,
            scenario === value &&
              styles.scenarioButtonActive,
          ]}
          onPress={() => {
            setScenario(value);
          }}
        >
          <Text
            style={[
              styles.scenarioButtonText,
              scenario === value &&
                styles.scenarioButtonTextActive,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  </View>
)}

{(isHuman || isNormalAI) && (
            <View style={styles.windRow}>
  {(
    [
      ['normal', 'Normal'],
      ['headwind', 'Headwind'],
      ['tailwind', 'Tailwind'],
    ] as const
  ).map(([value, label]) => (
    <Pressable
      key={value}
      style={[
        styles.windButton,
        windScenario === value &&
          styles.windButtonActive,
      ]}
      onPress={() => {
        setWindScenario(value);
      }}
    >
      <Text
        style={[
          styles.windButtonText,
          windScenario === value &&
            styles.windButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  ))}
</View>
)}
  <Pressable
  style={styles.primaryButton}
  onPress={() => {
if (isNormalAI) {
  void playNormalAIDraw();
  return;
}

if (isMuscle) {
  void playMuscleDraw();
  return;
}

if (isPeloton) {
  void playPelotonDraw();
  return;
}

void drawHand();
  }}
>
  <Text style={styles.primaryButtonText}>
    Draw
  </Text>
</Pressable>
  </>
)}

          {isHuman && drawnCards.length > 0 && (
            <View style={styles.cardRow}>
              {drawnCards.map(
                (card, index) => (
                  <Pressable
                    key={`${card.id}-${index}`}
                    style={styles.drawnCard}
                    onPress={() => {
  void selectCard(card);
}}
                  >
                    <Text
                      style={
                        styles.drawnCardText
                      }
                    >
                      {formatCard(card)}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          )}

       {isHuman && selectedCard && (
  <View style={styles.selectedCardBox}>
    <Text style={styles.sectionTitle}>
      Played Card
    </Text>

    <Text style={styles.playedCardText}>
      {formatCard(selectedCard)}
    </Text>
  </View>
)}

{isNormalAI && aiUndoSnapshot && (
  <Pressable
    style={styles.secondaryButton}
    onPress={() => {
      void undoNormalAIDraw();
    }}
  >
    <Text style={styles.secondaryButtonText}>
      Undo
    </Text>
  </Pressable>
)}

          {(isHuman || isNormalAI) && (
          <View style={styles.actionRow}>
            <Pressable
  style={styles.secondaryButton}
  onPress={() => {
  if (isNormalAI) {
    void addAIFatigue();
    return;
  }

  void addFatigue();
}}
>
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Add Fatigue
              </Text>
            </Pressable>

            <Pressable
  style={styles.secondaryButton}
    onPress={() => {
  if (isNormalAI) {
    void removeAIFatigue();
    return;
  }

  void removeFatigue();
}}
>
  <Text style={styles.secondaryButtonText}>
    Remove Fatigue
  </Text>
</Pressable>
          </View>
          )}

          {actionMessage !== '' && (
  <Text style={styles.actionMessage}>
    ✓ {actionMessage}
  </Text>
)}

          <View style={styles.actionRow}>
         <Pressable
  disabled={hasRefreshed}
  style={[
    styles.secondaryButton,
    hasRefreshed && styles.disabledButton,
  ]}
onPress={() => {
  if (isNormalAI) {
    void refreshAI(24);
    return;
  }

  if (isMuscle) {
    void refreshMuscle(24);
    return;
  }

  if (isPeloton) {
  void refreshPeloton(24);
  return;
}

  void refreshRider(24);
}}
>
  <Text style={styles.secondaryButtonText}>
    Refresh 24
  </Text>
</Pressable>

<Pressable
  disabled={hasRefreshed}
  style={[
    styles.secondaryButton,
    hasRefreshed && styles.disabledButton,
  ]}
onPress={() => {
  if (isNormalAI) {
    void refreshAI(25);
    return;
  }

  if (isMuscle) {
    void refreshMuscle(25);
    return;
  }

  if (isPeloton) {
    void refreshPeloton(25);
    return;
  }

  void refreshRider(25);
}}
>
  <Text style={styles.secondaryButtonText}>
    Refresh 25
  </Text>
</Pressable>
          </View>

          <Pressable
            style={styles.confirmButton}
            onPress={() => router.back()}
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Back
            </Text>
               </Pressable>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },

  entryHero: {
    alignItems: 'center',
    marginBottom: 20,
  },

  playerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 10,
  },

  riderImage: {
    width: 300,
    height: 200,
  },

  drawArea: {
    marginTop: -12,
    gap: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brown,
  },

  primaryButton: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },

  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },

  drawnCard: {
    flex: 1,
    height: 86,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  drawnCardText: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.brown,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },

  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.brown,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },

  confirmButton: {
    backgroundColor: Colors.red,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.35,
  },

  selectedCardBox: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 18,
  alignItems: 'center',
},

playedCardText: {
  fontSize: 42,
  fontWeight: '900',
  color: Colors.red,
  marginTop: 8,
},
actionMessage: {
  marginTop: 10,
  textAlign: 'center',
  color: '#2E7D32',
  fontSize: 14,
  fontWeight: '700',
},
windRow: {
  flexDirection: 'row',
  gap: 6,
  marginBottom: 10,
},

windButton: {
  flex: 1,
  paddingVertical: 6,
  paddingHorizontal: 8,
  borderWidth: 1,
  borderColor: '#999',
  borderRadius: 7,
  alignItems: 'center',
},

windButtonActive: {
  backgroundColor: '#333',
},

windButtonText: {
  fontSize: 12,
  fontWeight: '600',
},

windButtonTextActive: {
  color: '#fff',
},
scenarioSection: {
  marginBottom: 12,
},

scenarioRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
},

scenarioButton: {
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: '#999',
  borderRadius: 7,
},

scenarioButtonActive: {
  backgroundColor: '#333',
},

scenarioButtonText: {
  fontSize: 12,
  fontWeight: '600',
},

scenarioButtonTextActive: {
  color: '#fff',
},

playerTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
},

playerStar: {
  fontSize: 18,
  marginBottom: 8,
},

riderName: {
  fontSize: 16,
  fontWeight: '600',
  textAlign: 'center',
  marginTop: 4,
},

deckInfo: {
  fontSize: 13,
  textAlign: 'center',
  marginTop: 4,
},

deckInfoSmall: {
  fontSize: 11,
  textAlign: 'center',
  marginTop: 2,
  opacity: 0.7,
},

});