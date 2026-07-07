import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';
import { gameResults } from '@/lib/gameResults';
import { stageDraft } from '@/lib/stageDraft';
import { useEffect, useState } from 'react';
import { getActiveSavedGame } from '@/lib/storage';
import BackgroundWatermark from '@/components/BackgroundWatermark';
export default function EnterStageScreen() {

const [isCheckingRole, setIsCheckingRole] = useState(true);

useEffect(() => {
  async function checkRole() {
    const savedGame = await getActiveSavedGame();

    if (savedGame?.role === 'follower') {
      Alert.alert(
        'Read only',
        'Followers cannot edit stages.'
      );

      router.replace('/(tabs)');
      return;
    }

    setIsCheckingRole(false);
  }

  checkRole();
}, []);

if (isCheckingRole) {
  return null;
}

  const params = useLocalSearchParams();
const editEntryIndex =
  params.editEntryIndex !== undefined ? Number(params.editEntryIndex) : null;


  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;

const editedEntry =
  editEntryIndex !== null ? gameResults.entries[editEntryIndex] : null;

const entryTitle =
  editedEntry
    ? editedEntry.entryType === 'restDay'
      ? `Edit Rest Day after Stage ${editedEntry.stageNumber}`
      : `Edit Stage ${editedEntry.stageNumber}`
    : gameState.currentEntryType === 'restDay'
      ? `Rest Day after Stage ${gameState.currentStage}`
      : `Stage ${gameState.currentStage}`;

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />
      <Text style={styles.title}>{entryTitle}</Text>

      <View style={styles.playerList}>
        {playerNames.map((name, index) => (
          <Pressable
  key={index}
  style={styles.playerRow}
  onPress={() => {
    if (editEntryIndex !== null) {
      const editedEntry = gameResults.entries[editEntryIndex];

      if (editedEntry) {
        stageDraft.players = JSON.parse(JSON.stringify(editedEntry.players));
      }
    }

    router.push({
      pathname: '/player-entry',
      params: {
        playerIndex: String(index),
        ...(editEntryIndex !== null && {
          editEntryIndex: String(editEntryIndex),
        }),
      },
    });
  }}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: getPlayerColor(playerColors[index]) },
              ]}
            />

            <Text style={styles.playerName}>
              {name || `Player ${index + 1}`}
            </Text>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>

    </View>
  );
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 30,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  playerList: {
    gap: 12,
  },

  playerRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },

  playerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  arrow: {
    fontSize: 30,
    color: Colors.red,
    fontWeight: '900',
  },
 

});