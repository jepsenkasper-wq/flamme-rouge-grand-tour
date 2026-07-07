import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { stageDraft } from '@/lib/stageDraft';
import { gameState } from '@/lib/gameState';
import { gameResults } from '@/lib/gameResults';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function formatTime(value: string, finalize = false) {
  const cleaned = value.replace(/[^\d:]/g, '');

  if (!cleaned) {
    return finalize ? '0:00' : '';
  }

  if (cleaned.includes(':')) {
    const [minutes = '', seconds = ''] = cleaned.split(':');

    const minuteNumber = Number(minutes || 0);

    if (!finalize) {
      return `${minuteNumber}:${seconds}`;
    }

    if (seconds === '') {
      return `${minuteNumber}:00`;
    }

    if (seconds.length === 1) {
      return `${minuteNumber}:${seconds}0`;
    }

    return `${minuteNumber}:${seconds.slice(0, 2)}`;
  }

  const digits = cleaned.replace(/\D/g, '');

  if (!finalize) {
    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
  }

  if (digits.length <= 2) {
    return `${Number(digits)}:00`;
  }

  return `${Number(digits.slice(0, -2))}:${digits
    .slice(-2)
    .padStart(2, '0')}`;
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
export default function PlayerEntryScreen() {
  const params = useLocalSearchParams();
  const playerIndex = Number(params.playerIndex ?? 0);
  const editEntryIndex =
  params.editEntryIndex !== undefined ? Number(params.editEntryIndex) : null;

const editedEntry =
  editEntryIndex !== null ? gameResults.entries[editEntryIndex] : null;

  const playerName =
    createGameDraft.playerNames[playerIndex] || `Player ${playerIndex + 1}`;

    const playerColor =
  createGameDraft.playerColors[playerIndex];

const playerCount = createGameDraft.playerNames.length;

const isRestDay = editedEntry
  ? editedEntry.entryType === 'restDay'
  : gameState.currentEntryType === 'restDay';

const entryTitle = editedEntry
  ? editedEntry.entryType === 'restDay'
    ? `Edit Rest Day after Stage ${editedEntry.stageNumber}`
    : `Edit Stage ${editedEntry.stageNumber}`
  : isRestDay
    ? `Rest Day after Stage ${gameState.currentStage}`
    : `Stage ${gameState.currentStage}`;

const [selectedRider, setSelectedRider] = useState<'sprinteur' | 'rouleur'>(
  'rouleur'
);

const currentPlayerEntry = stageDraft.players[playerIndex];

if (!currentPlayerEntry) {
  return (
    <View style={styles.screen}>
      <View style={styles.unavailableCard}>
        <Text style={styles.playerTitle}>{playerName}</Text>

        <Text style={styles.helperText}>
          This player was not part of this stage when it was entered.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const currentEntry = currentPlayerEntry[selectedRider];

function goToPlayer(nextIndex: number) {
  router.replace({
    pathname: '/player-entry',
    params: {
      playerIndex: String(nextIndex),
      ...(editEntryIndex !== null && {
        editEntryIndex: String(editEntryIndex),
      }),
    },
  });
}

const [, setDraftVersion] = useState(0);

function updateEntry(field: keyof typeof currentEntry, value: string) {
  currentEntry[field] = value;
  setDraftVersion((version) => version + 1);
}

const riderImage =
  selectedRider === 'sprinteur'
    ? require('@/assets/images/riders/rider-sprinteur.png')
    : require('@/assets/images/riders/rider-rouleur.png');

const riderLabel =
  selectedRider === 'sprinteur' ? 'Sprinteur' : 'Rouleur';

  return (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
<Text style={styles.stageTitle}>{entryTitle}</Text>

<View style={styles.entryHero}>
 <View style={styles.playerTitleRow}>
  <Text style={[styles.playerStar, { color: getPlayerColor(playerColor) }]}>
    ★
  </Text>

  <Text style={styles.playerTitle}>{playerName}</Text>

  <Text style={[styles.playerStar, { color: getPlayerColor(playerColor) }]}>
    ★
  </Text>
</View>

  <Image
    source={riderImage}
    style={styles.riderImage}
    resizeMode="stretch"
  />

  <View style={styles.riderToggle}>
    <Pressable
  style={[
    styles.riderButton,
    selectedRider === 'rouleur' && styles.activeButton,
  ]}
  onPress={() => setSelectedRider('rouleur')}
>
  <Text
    style={[
      styles.riderButtonText,
      selectedRider === 'rouleur' && styles.activeButtonText,
    ]}
  >
    Rouleur
  </Text>
</Pressable>

    <Pressable
  style={[
    styles.riderButton,
    selectedRider === 'sprinteur' && styles.activeButton,
  ]}
  onPress={() => setSelectedRider('sprinteur')}
>
  <Text
    style={[
      styles.riderButtonText,
      selectedRider === 'sprinteur' && styles.activeButtonText,
    ]}
  >
    Sprinteur
  </Text>
</Pressable>
  </View>
</View>

      <View style={styles.card}>
  {isRestDay ? (
    <>
      <Text style={styles.label}>Tour Points</Text>
      <TextInput
        style={styles.input}
        value={currentEntry.tourPoints}
        onChangeText={(value) => updateEntry('tourPoints', value)}
        keyboardType="number-pad"
      />
    </>
  ) : (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        <View style={styles.gridCard}>
          <View style={styles.gridInputRow}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={26}
              color={Colors.brown}
              style={styles.gridIcon}
            />

            <View style={styles.inputColumn}>
              <Text style={styles.gridLabel}>Time</Text>
              <TextInput
                style={styles.gridInput}
                value={currentEntry.time}
                onChangeText={(value) =>
  updateEntry('time', formatTime(value))
}
onEndEditing={() =>
  updateEntry('time', formatTime(currentEntry.time, true))
}
                keyboardType="number-pad"
                placeholder="0:00"
              />
            </View>
          </View>
        </View>

        <View style={styles.gridCard}>
          <View style={styles.gridInputRow}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={26}
              color={Colors.brown}
              style={styles.gridIcon}
            />

            <View style={styles.inputColumn}>
              <Text style={styles.gridLabel}>Tour Points</Text>
              <TextInput
                style={styles.gridInput}
                value={currentEntry.tourPoints}
                onChangeText={(value) => updateEntry('tourPoints', value)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCard}>
          <View style={styles.gridInputRow}>
            <MaterialCommunityIcons
              name="image-filter-hdr"
              size={26}
              color={Colors.brown}
              style={styles.gridIcon}
            />

            <View style={styles.inputColumn}>
              <Text style={styles.gridLabel}>Mountain Points</Text>
              <TextInput
                style={styles.gridInput}
                value={currentEntry.mountainPoints}
                onChangeText={(value) => updateEntry('mountainPoints', value)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>

        <View style={styles.gridCard}>
          <View style={styles.gridInputRow}>
            <MaterialCommunityIcons
              name="flag-checkered"
              size={26}
              color={Colors.brown}
              style={styles.gridIcon}
            />

            <View style={styles.inputColumn}>
              <Text style={styles.gridLabel}>Sprint Points</Text>
              <TextInput
                style={styles.gridInput}
                value={currentEntry.sprintPoints}
                onChangeText={(value) => updateEntry('sprintPoints', value)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </View>
      </View>

     <View style={styles.fatigueRow}>
  <View style={styles.gridInputRow}>
    <MaterialCommunityIcons
      name="cards-outline"
      size={26}
      color={Colors.brown}
      style={styles.gridIcon}
    />

    <View style={styles.inputColumn}>
      <View style={styles.labelRow}>
  <Text style={styles.gridLabel}>Fatigue Cards</Text>

  <Pressable
    onPress={() =>
      Alert.alert(
        'Fatigue Cards',
        "Enter the number of fatigue cards currently in this rider's deck if you want to save the game and resume it later."
      )
    }
  >
    <Ionicons
      name="help-circle-outline"
      size={18}
      color={Colors.brown}
    />
  </Pressable>
</View>

      <TextInput
        style={styles.fatigueInput}
        value={currentEntry.fatigueCards}
        onChangeText={(value) => updateEntry('fatigueCards', value)}
        keyboardType="number-pad"
      />
    </View>
  </View>
</View>
</View>
  )}
</View>
      <View style={styles.navigationRow}>
  <Pressable
    style={[
      styles.navButton,
      playerIndex === 0 && styles.disabledButton,
    ]}
    disabled={playerIndex === 0}
    onPress={() => goToPlayer(playerIndex - 1)}>
    <Text style={styles.navButtonText}>Previous Player</Text>
  </Pressable>

<Pressable
  style={styles.navButton}
  onPress={() => {
    if (playerIndex === playerCount - 1) {
  router.push({
    pathname: '/review-stage-entry',
    params:
      editEntryIndex !== null
        ? { editEntryIndex: String(editEntryIndex) }
        : {},
  });
} else {
  goToPlayer(playerIndex + 1);
}  }}>
  <Text style={styles.navButtonText}>
    {playerIndex === playerCount - 1 ? 'Finish Stage' : 'Next Player'}
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
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
},
entryHero: {
  backgroundColor: 'rgba(250, 241, 222, 0.72)',
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 18,
  paddingTop: 10,
  paddingHorizontal: 14,
  paddingBottom: 10,
  alignItems: 'center',
  marginBottom: 14,
  marginHorizontal: -10,
},

stageTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 32,
  color: Colors.brown,
  textAlign: 'center',
  letterSpacing: 1,
  marginBottom: 0,
  marginTop: -65,
},

playerTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 30,
  color: Colors.brown,
  textAlign: 'center',
  letterSpacing: 1,
},

riderLabel: {
  fontFamily: 'BebasNeue',
  fontSize: 20,
  color: Colors.red,
  letterSpacing: 1,
  marginTop: -2,
  marginBottom: 2,
},

riderImage: {
  width: '100%',
  height: 140,
  marginTop: 0,
  marginBottom: -6,
},

riderToggle: {
  flexDirection: 'row',
  backgroundColor: Colors.card,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: Colors.border,
  padding: 4,
  marginTop: 10,
  marginBottom: -6,
  width: '100%',
},

  riderButton: {
  flex: 1,
  alignItems: 'center',
  paddingVertical: 10,
  borderRadius: 999,
},

activeButton: {
  backgroundColor: Colors.red,
},

riderButtonText: {
  color: Colors.brown,
  fontWeight: '900',
},

activeButtonText: {
  color: Colors.white,
},

  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginHorizontal: -10,
    marginTop: -8,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 14,
  },
  navigationRow: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 20,
},

navButton: {
  flex: 1,
  backgroundColor: Colors.red,
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
},

disabledButton: {
  opacity: 0.35,
},

navButtonText: {
  color: Colors.white,
  fontWeight: '900',
  textAlign: 'center',
},
playerTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 14,
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
grid: {
  gap: 12,
},

gridRow: {
  flexDirection: 'row',
  gap: 12,
},

gridCard: {
  flex: 1,
  alignItems: 'center',
},

gridLabel: {
  fontSize: 13,
  fontWeight: '800',
  color: Colors.brown,
  marginBottom: 6,
  textAlign: 'center',
},

labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},

fatigueRow: {
  marginTop: 6,
},

fatigueInput: {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  padding: 10,
  fontSize: 18,
  color: Colors.brown,
  textAlign: 'center',
},


gridInput: {
  flex: 1,
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  padding: 10,
  fontSize: 18,
  color: Colors.brown,
  textAlign: 'center',
},
inputColumn: {
  flex: 1,
},
gridInputRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 10,
  width: '100%',
},

gridIcon: {
  marginBottom: 11,
},

inputColumn: {
  flex: 1,
},

gridLabel: {
  fontSize: 13,
  fontWeight: '800',
  color: Colors.brown,
  marginBottom: 6,
  textAlign: 'center',
},
unavailableCard: {
  margin: 24,
  marginTop: 120,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 18,
  padding: 20,
  alignItems: 'center',
},

helperText: {
  fontSize: 16,
  color: Colors.brown,
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 20,
},
});