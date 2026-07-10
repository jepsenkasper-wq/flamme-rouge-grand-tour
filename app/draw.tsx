import { useLocalSearchParams } from 'expo-router';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { getActiveSoloStageState } from '@/lib/solo/activeSoloStage';
import {
  saveGame,
  updateActiveSavedGame,
} from '@/lib/storage';
import { useState } from 'react';
import { Alert, Image, ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  updateSoloFatigueTransfer,
} from '@/lib/solo/soloStageEngine';
import {
  drawMuscleCard,
  refreshMuscleTeam,
} from '@/lib/solo/muscleDeckEngine';

import {
  drawPelotonCard,
  refreshPelotonTeam,
} from '@/lib/solo/peletonDeckEngine';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  addFatigueCardToSetAside,
  cloneDummyRiderState,
  drawHumanAppHand,
  finishHumanAppDraw,
  playDummyRound,
  refreshFromDiscard,
  removeFatigueCardFromSetAside,
  restoreDummyRiderState,
  getFatigueCardsForStageResult,
  type DummyCard,
  type DummyRiderState,
  type DummyScenario,
} from '@/lib/solo/dummyDeckEngine';

type DrawMode =
  | 'human-app'
  | 'normal-ai'
  | 'muscle'
  | 'peloton';

type RiderKey = 'sprinteur' | 'rouleur';

function formatCard(card: DummyCard): string {
  const value = card.displayValue ?? card.value;
  const specialMark = card.isSpecial ? '*' : '';

  return card.type === 'fatigue'
    ? `F${value}${specialMark}`
    : `${value}${specialMark}`;
}

function getDrawModeLabel(drawMode: DrawMode): string {
  if (drawMode === 'human-app') return 'Human App-assisted';
  if (drawMode === 'normal-ai') return 'Normal AI';
  if (drawMode === 'muscle') return 'Muscle';
  return 'Peloton';
}

function getRiderLabel(riderKey?: RiderKey): string {
  if (riderKey === 'sprinteur') return 'Sprinteur';
  if (riderKey === 'rouleur') return 'Rouleur';
  return 'Team Deck';
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

export default function DrawScreen() {
  const params = useLocalSearchParams<{
    teamId?: string;
    riderKey?: RiderKey;
    drawMode?: DrawMode;
  }>();

  const [drawnCards, setDrawnCards] = useState<DummyCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<DummyCard | null>(null);
  const [undoSnapshot, setUndoSnapshot] =
    useState<DummyRiderState | null>(null);
  const [teamUndoSnapshot, setTeamUndoSnapshot] = useState<any>(null);
  const [, forceUpdate] = useState(0);

  const team = createGameDraft.dummyTeams.find(
    (team) => team.id === params.teamId
  );

  const drawMode = params.drawMode;

  const soloStage = getActiveSoloStageState();

  const [scenario, setScenario] = useState<DummyScenario>('normal');

  const teamState = soloStage.teams.find(
    (team) => team.teamId === params.teamId
  );

  const riderState =
    params.riderKey === 'sprinteur'
      ? teamState?.sprinteur
      : params.riderKey === 'rouleur'
      ? teamState?.rouleur
      : undefined;

const muscleTeamState = teamState?.muscleTeam;
const pelotonTeamState = teamState?.pelotonTeam;

      const riderImage =
  params.riderKey === 'sprinteur'
    ? require('@/assets/images/riders/rider-sprinteur.png')
    : require('@/assets/images/riders/rider-rouleur.png');

const riderShortLabel =
  params.riderKey === 'sprinteur'
    ? 'S'
    : params.riderKey === 'rouleur'
    ? 'R'
    : '';


  if (!team || !drawMode || !teamState) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Draw</Text>
        <Text style={styles.text}>Missing draw information.</Text>
      </View>
    );
  }

  // DEBUG
console.log('DRAW DEBUG', {
  drawMode,
  teamType: teamState.teamType,
  hasMuscleTeam: !!muscleTeamState,
  hasPelotonTeam: !!pelotonTeamState,
});

const insets = useSafeAreaInsets();

const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

  function persistDrawState() {
  saveGame();
  updateActiveSavedGame();
}

  function updateFatigueTransfer() {
  if (!team || !riderState || !params.riderKey) return;

  updateSoloFatigueTransfer(
    soloStage,
    team.id,
    params.riderKey,
    getFatigueCardsForStageResult(riderState)
  );
}

 function playNormalAIDraw() {
  if (!riderState) return;

  setUndoSnapshot(cloneDummyRiderState(riderState));

  const result = playDummyRound(
    riderState,
    scenario,
    riderState.round
  );

  riderState.round += 1;

  setSelectedCard(result.selectedCard);
setDrawnCards([]);
updateFatigueTransfer();
updateScreen();
persistDrawState();
}

function drawMuscleTeamCard() {
  if (!muscleTeamState || !params.riderKey) return;

  setTeamUndoSnapshot(JSON.parse(JSON.stringify(muscleTeamState)));
console.log('MUSCLE BEFORE DRAW', {
  riderKey: params.riderKey,
  sprinteurDeck: muscleTeamState.sprinteur.deck.length,
  sprinteurDiscard: muscleTeamState.sprinteur.discard.length,
  rouleurDeck: muscleTeamState.rouleur.deck.length,
  rouleurDiscard: muscleTeamState.rouleur.discard.length,
});
  const card = drawMuscleCard(
    muscleTeamState,
    params.riderKey
  );
console.log('MUSCLE DRAWN CARD', card);

  setSelectedCard(card);
  updateScreen();
  persistDrawState();
}

function refreshMuscle(limit: 24 | 25) {
  if (!muscleTeamState || !params.riderKey) return;

  const riderKey = params.riderKey;

  setTeamUndoSnapshot(JSON.parse(JSON.stringify(muscleTeamState)));

  refreshMuscleTeam(
    muscleTeamState,
    riderKey,
    limit
  );

  setSelectedCard(null);
  updateScreen();
  persistDrawState();
}

function drawPelotonTeamCard() {
  if (!pelotonTeamState) return;

  setTeamUndoSnapshot(JSON.parse(JSON.stringify(pelotonTeamState)));

  const card = drawPelotonCard(pelotonTeamState);

  setSelectedCard(card);
  updateScreen();
  persistDrawState();
}

function refreshPeloton(limit: 24 | 25) {
  if (!pelotonTeamState) return;

  setTeamUndoSnapshot(JSON.parse(JSON.stringify(pelotonTeamState)));

  refreshPelotonTeam(pelotonTeamState, limit);

  setSelectedCard(null);
  updateScreen();
  persistDrawState();
}

function undoTeamDraw() {
  if (!teamUndoSnapshot || !teamState) return;

  if (drawMode === 'muscle' && teamState.muscleTeam) {
    Object.assign(
      teamState.muscleTeam,
      JSON.parse(JSON.stringify(teamUndoSnapshot))
    );
  }

  if (drawMode === 'peloton' && teamState.pelotonTeam) {
    Object.assign(
      teamState.pelotonTeam,
      JSON.parse(JSON.stringify(teamUndoSnapshot))
    );
  }

  setTeamUndoSnapshot(null);
  setSelectedCard(null);
  updateScreen();
  persistDrawState();
}

  function updateScreen() {
    forceUpdate((current) => current + 1);
  }

function drawHumanHand() {
  if (!riderState) return;

  setUndoSnapshot(cloneDummyRiderState(riderState));
  setSelectedCard(null);

  const hand = drawHumanAppHand(riderState);
  setDrawnCards(hand);
  updateScreen();
  persistDrawState();
}

function selectHumanCard(cardId: string) {
  if (!riderState) return;

  const card = finishHumanAppDraw(
    riderState,
    drawnCards,
    cardId
  );

  if (!card) return;


  setSelectedCard(card);
setDrawnCards([]);
updateFatigueTransfer();
updateScreen();
persistDrawState();
}

function addFatigue() {
  if (!riderState) return;

  setUndoSnapshot(cloneDummyRiderState(riderState));
  addFatigueCardToSetAside(riderState);
  updateFatigueTransfer();
  updateScreen();
  persistDrawState();
}

function removeFatigue() {
  if (!riderState) return;

  setUndoSnapshot(cloneDummyRiderState(riderState));
  removeFatigueCardFromSetAside(riderState);
  updateFatigueTransfer();
  updateScreen();
  persistDrawState();
}

function refresh(limit: 24 | 25) {
  if (!riderState) return;

  setUndoSnapshot(cloneDummyRiderState(riderState));
  refreshFromDiscard(riderState, limit);
  updateFatigueTransfer();
  updateScreen();
  persistDrawState();
}

function undo() {
  if (!riderState || !undoSnapshot) return;

  restoreDummyRiderState(riderState, undoSnapshot);
  setUndoSnapshot(null);
  setDrawnCards([]);
  setSelectedCard(null);
  updateFatigueTransfer();
  updateScreen();
  persistDrawState();
}
function getDrawModeLabel(drawMode: DrawMode): string {
  switch (drawMode) {
    case 'human-app':
      return 'Human App-assisted';
    case 'normal-ai':
      return 'Normal AI';
    case 'muscle':
      return 'Muscle Team';
    case 'peloton':
      return 'Peloton Team';
    default:
      return '';
  }
}

function getSpecialRiderLabel(
  specialRiderId?: string
): string | null {
  if (!specialRiderId) return null;

  switch (specialRiderId) {
    case 'grimpeur':
      return 'Grimpeur';
    case 'descender':
      return 'Descender';
    case 'mountaineer':
      return 'Mountaineer';
    default:
      return specialRiderId;
  }
}

  return (
    <ScrollView
    style={styles.screen}
    contentContainerStyle={[styles.content, contentStyle]}>


      <Text style={styles.title}>Draw</Text>


      <View style={styles.card}>
        <View style={styles.entryHero}>
  <View style={styles.playerTitleRow}>
  <Text
    style={[
      styles.playerStar,
      { color: getPlayerColor(team.color) },
    ]}>
    ★
  </Text>

  <Text style={styles.playerTitle}>
    {team.name}
    {riderShortLabel ? ` - ${riderShortLabel}` : ''}
  </Text>

  <Text
    style={[
      styles.playerStar,
      { color: getPlayerColor(team.color) },
    ]}>
    ★
  </Text>
</View>

  <Image
    source={riderImage}
    style={styles.riderImage}
    resizeMode="stretch"
  />

  <Text style={styles.deckInfo}>
  Draw Mode: {getDrawModeLabel(drawMode)}
</Text>

{(drawMode === 'human-app' || drawMode === 'normal-ai') && (
  <>
    <Text style={styles.deckInfo}>
      {riderState?.specialRiderId
        ? `Special Rider: ${formatSpecialRiderName(riderState.specialRiderId)}`
        : 'Normal deck'}
    </Text>

    <Text style={styles.deckInfoSmall}>
      * = Special Rider card
    </Text>
  </>
)}

</View>

{drawMode === 'human-app' && riderState && (
  <View style={styles.drawArea}>
    <Text style={styles.sectionTitle}>Choose Card</Text>

   {drawnCards.length === 0 && (
  <Pressable style={styles.primaryButton} onPress={drawHumanHand}>
    <Text style={styles.primaryButtonText}>Draw 4 Cards</Text>
  </Pressable>
)}

    {drawnCards.length > 0 && (
      <View style={styles.cardRow}>
        {drawnCards.map((card) => (
          <Pressable
            key={card.id}
            style={styles.drawnCard}
            onPress={() => selectHumanCard(card.id)}>
            <Text style={styles.drawnCardText}>
              {formatCard(card)}
            </Text>
          </Pressable>
        ))}
      </View>
    )}

    {selectedCard && (
      <View style={styles.selectedCardBox}>
        <Text style={styles.sectionTitle}>Played Card</Text>
        <Text style={styles.playedCardText}>
          {formatCard(selectedCard)}
        </Text>
      </View>
    )}

    <View style={styles.actionRow}>
      <Pressable style={styles.secondaryButton} onPress={addFatigue}>
        <Text style={styles.secondaryButtonText}>Add Fatigue</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={removeFatigue}>
        <Text style={styles.secondaryButtonText}>Remove Fatigue</Text>
      </Pressable>
    </View>

    <View style={styles.actionRow}>
      <Pressable style={styles.secondaryButton} onPress={() => refresh(24)}>
        <Text style={styles.secondaryButtonText}>Refresh 24</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => refresh(25)}>
        <Text style={styles.secondaryButtonText}>Refresh 25</Text>
      </Pressable>
    </View>

    <Pressable style={styles.undoButton} onPress={undo}>
      <Text style={styles.secondaryButtonText}>Undo</Text>
    </Pressable>
  </View>
)}
{drawMode === 'normal-ai' && riderState && (
  <View style={styles.drawArea}>
    <View style={styles.labelRow}>
  <Text style={styles.label}>Rider Placement Scenario</Text>

  <Pressable
    onPress={() =>
      Alert.alert(
        'AI Draw',
        'The AI automatically selects the card it considers optimal based on the current situation. Its decision takes into account the rider\'s position, Special Rider abilities, the stage situation, previously played cards and deck management.\n\n' +

        'Normal\n' +
        'Used for normal squares on the course.\n\n' +

        'Ascent / Close to Ascent\n' +
        'Use when the rider is on an ascent square or within 5 squares of an ascent.\n\n' +

        'Descent\n' +
        'Use when the rider is on a descent.\n\n' +

        'Supply Zone\n' +
        'Use when the rider is in a supply zone.\n\n' +

        'Sprint\n' +
        'Use when the rider is within 15 squares of the finish line.'
      )
    }>
    <Text style={styles.help}>?</Text>
  </Pressable>
</View>

    <View style={styles.optionRow}>
      {[
        { label: 'Normal Square', value: 'normal' },
        { label: 'Ascent / Close to Ascent', value: 'climb' },
        { label: 'Descent', value: 'descent' },
        { label: 'Supply Zone', value: 'supply-zone' },
        { label: 'Sprint', value: 'sprint' },
      ].map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.optionButton,
            scenario === option.value && styles.optionButtonActive,
          ]}
          onPress={() => setScenario(option.value as DummyScenario)}>
          <Text
            style={[
              styles.optionText,
              scenario === option.value && styles.optionTextActive,
            ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>

    <Pressable style={styles.primaryButton} onPress={playNormalAIDraw}>
      <Text style={styles.primaryButtonText}>Draw AI Card</Text>
    </Pressable>

    {selectedCard && (
      <View style={styles.selectedCardBox}>
        <Text style={styles.sectionTitle}>Played Card</Text>
        <Text style={styles.playedCardText}>
          {formatCard(selectedCard)}
        </Text>
      </View>
    )}

    <View style={styles.actionRow}>
      <Pressable style={styles.secondaryButton} onPress={addFatigue}>
        <Text style={styles.secondaryButtonText}>Add Fatigue</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={removeFatigue}>
        <Text style={styles.secondaryButtonText}>Remove Fatigue</Text>
      </Pressable>
    </View>

    <View style={styles.actionRow}>
      <Pressable style={styles.secondaryButton} onPress={() => refresh(24)}>
        <Text style={styles.secondaryButtonText}>Refresh 24</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => refresh(25)}>
        <Text style={styles.secondaryButtonText}>Refresh 25</Text>
      </Pressable>
    </View>

    <Pressable style={styles.undoButton} onPress={undo}>
      <Text style={styles.secondaryButtonText}>Undo</Text>
    </Pressable>
  </View>
)}

{drawMode === 'muscle' && muscleTeamState && (
  <View style={styles.drawArea}>
    <Pressable
      style={styles.primaryButton}
      onPress={drawMuscleTeamCard}>
      <Text style={styles.primaryButtonText}>
        Draw Card
      </Text>
    </Pressable>

    {selectedCard && (
      <View style={styles.selectedCardBox}>
        <Text style={styles.sectionTitle}>
          Drawn Card
        </Text>

        <Text style={styles.playedCardText}>
          {formatCard(selectedCard)}
        </Text>
      </View>
    )}

    <View style={styles.actionRow}>
  <Pressable
    style={styles.secondaryButton}
    onPress={() => refreshMuscle(24)}>
    <Text style={styles.secondaryButtonText}>
      Refresh 24
    </Text>
  </Pressable>

  <Pressable
    style={styles.secondaryButton}
    onPress={() => refreshMuscle(25)}>
    <Text style={styles.secondaryButtonText}>
      Refresh 25
    </Text>
  </Pressable>
</View> 

    <Pressable
      style={styles.undoButton}
      onPress={undoTeamDraw}>
      <Text style={styles.secondaryButtonText}>
        Undo
      </Text>
    </Pressable>
  </View>
)}
{drawMode === 'peloton' && pelotonTeamState && (
  <View style={styles.drawArea}>
    <Pressable
      style={styles.primaryButton}
      onPress={drawPelotonTeamCard}>
      <Text style={styles.primaryButtonText}>
        Draw Card
      </Text>
    </Pressable>

    {selectedCard && (
      <View style={styles.selectedCardBox}>
        <Text style={styles.sectionTitle}>
          Drawn Card
        </Text>

        <Text style={styles.playedCardText}>
          {formatCard(selectedCard)}
        </Text>
      </View>
    )}

    <View style={styles.actionRow}>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => refreshPeloton(24)}>
        <Text style={styles.secondaryButtonText}>
          Refresh 24
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => refreshPeloton(25)}>
        <Text style={styles.secondaryButtonText}>
          Refresh 25
        </Text>
      </Pressable>
    </View>

    <Pressable
      style={styles.undoButton}
      onPress={undoTeamDraw}>
      <Text style={styles.secondaryButtonText}>
        Undo
      </Text>
    </Pressable>
  </View>
)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },


  text: {
    fontSize: 16,
    color: Colors.brown,
    marginBottom: 8,
  },

  drawArea: {
  marginTop: 18,
  gap: 14,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
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

undoButton: {
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
content: {
  paddingBottom: 40,
},

riderHeader: {
  alignItems: 'center',
  marginBottom: 16,
},

entryHero: {
  alignItems: 'center',
  marginBottom: 20,
},

playerTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
  marginBottom: 10,
},

playerStar: {
  fontSize: 22,
  marginTop: -6,

  textShadowColor: 'rgba(42,36,28,0.7)',
  textShadowOffset: {
    width: 0,
    height: 0,
  },
  textShadowRadius: 2,
},

playerTitle: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.brown,
},

riderImage: {
  width: 300,
  height: 200,
},

teamName: {
  marginTop: 10,
  fontSize: 24,
  fontWeight: '900',
  color: Colors.brown,
},

optionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 8,
},

optionButton: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 12,
},

optionButtonActive: {
  backgroundColor: Colors.red,
  borderColor: Colors.red,
},

optionText: {
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
},

optionTextActive: {
  color: Colors.white,
},
label: {
  fontSize: 20,
  fontWeight: '800',
  color: Colors.brown,
},

labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

help: {
  marginLeft: 8,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: Colors.red,
  color: Colors.white,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '900',
  overflow: 'hidden',
},
specialInfo: {
  marginTop: -10,
  marginBottom: 14,
  fontSize: 13,
  color: Colors.brown,
  opacity: 0.65,
  textAlign: 'center',
},
deckInfoSmall: {
  fontSize: 12,
  color: Colors.brown,
  opacity: 0.65,
  textAlign: 'center',
  marginTop: 2,
  marginBottom: -30,
},
});