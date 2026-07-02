import { router, useLocalSearchParams } from 'expo-router';
import {
  Image,  
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { gameState } from '@/lib/gameState';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { stageDraft } from '@/lib/stageDraft';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

export default function ReviewStageEntryScreen() {
  const params = useLocalSearchParams();
  const editEntryIndex =
    params.editEntryIndex !== undefined
      ? Number(params.editEntryIndex)
      : null;
  
      const insets = useSafeAreaInsets();
      const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

  function saveStage() {
    const editedEntry =
      editEntryIndex !== null ? gameResults.entries[editEntryIndex] : null;

    const playersToSave = JSON.parse(JSON.stringify(stageDraft.players));

    let tieBreakOrder = 0;

    playersToSave.forEach((player: any) => {
      player.sprinteur.tieBreakOrder = tieBreakOrder++;
      player.rouleur.tieBreakOrder = tieBreakOrder++;
    });

    const entryToSave = {
      entryType: editedEntry?.entryType || gameState.currentEntryType,
      stageNumber: editedEntry?.stageNumber || gameState.currentStage,
      players: playersToSave,
    };

    if (editEntryIndex !== null) {
      gameResults.updateEntry(editEntryIndex, entryToSave);
    } else {
      gameResults.addEntry(entryToSave);


      const restDayStages = createGameDraft.restDayStages.map(Number);

      if (
        gameState.currentEntryType === 'stage' &&
        restDayStages.includes(gameState.currentStage)
      ) {
        gameState.currentEntryType = 'restDay';
      } else {
        gameState.currentStage = Number(gameState.currentStage || 1) + 1;
        gameState.currentEntryType = 'stage';
      }
    }

    saveGame();
    updateActiveSavedGame();

    router.replace('/(tabs)');
  }
  
  
return (
    <View style={styles.screen}>
        <Image
          source={require('@/assets/images/background-blackwhite.png')}
          style={styles.watermark}
          resizeMode="cover"
        />
    <ScrollView
  contentContainerStyle={[styles.content, contentStyle]}
>
      <Text style={styles.title}>Review Stage</Text>

      {createGameDraft.playerNames.map((playerName, playerIndex) => {
        const player = stageDraft.players[playerIndex];

        if (!player) {
          return null;
        }
const playerColor =
  createGameDraft.playerColors[playerIndex];

const riderImage = riderImages[playerColor];  
        return (
          <View key={playerIndex} style={styles.card}>
            <View style={styles.playerHeader}>
  <Image
    source={riderImage}
    style={styles.playerAvatar}
  />

  <Text style={styles.playerName}>
    {playerName || `Player ${playerIndex + 1}`}
  </Text>
</View>

            <View style={styles.reviewTable}>
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}></Text>
    <Text style={styles.reviewValue}>Sprinteur</Text>
    <Text style={styles.reviewValue}>Rouleur</Text>
  </View>

  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>Time</Text>
    <Text style={styles.reviewValue}>{player.sprinteur.time}</Text>
    <Text style={styles.reviewValue}>{player.rouleur.time}</Text>
  </View>

  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>Tour Points</Text>
    <Text style={styles.reviewValue}>{player.sprinteur.tourPoints}</Text>
    <Text style={styles.reviewValue}>{player.rouleur.tourPoints}</Text>
  </View>

  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>Mountain Points</Text>
    <Text style={styles.reviewValue}>{player.sprinteur.mountainPoints}</Text>
    <Text style={styles.reviewValue}>{player.rouleur.mountainPoints}</Text>
  </View>

  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>Sprint Points</Text>
    <Text style={styles.reviewValue}>{player.sprinteur.sprintPoints}</Text>
    <Text style={styles.reviewValue}>{player.rouleur.sprintPoints}</Text>
  </View>

  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>Fatigue Cards</Text>
    <Text style={styles.reviewValue}>{player.sprinteur.fatigueCards}</Text>
    <Text style={styles.reviewValue}>{player.rouleur.fatigueCards}</Text>
  </View>
</View>
          </View>
        );
      })}

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={saveStage}>
          <Text style={styles.buttonText}>Save Stage</Text>
        </Pressable>
      </View>
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
    fontFamily: 'BebasNeue',
    fontSize: 36,
    color: Colors.brown,
    marginBottom: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  playerName: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: Colors.brown,
    marginBottom: 10,
  },
  riderBlock: {
    marginTop: 8,
  },
  riderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.red,
    marginBottom: 4,
  },
  line: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brown,
    marginBottom: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: Colors.brown,
    fontSize: 16,
    fontWeight: '900',
  },
  reviewTable: {
  marginTop: 6,
},

reviewRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 2,
},

reviewLabel: {
  flex: 1.2,
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},

reviewValue: {
  flex: 1,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '900',
  color: Colors.brown,
},
playerHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

playerAvatar: {
  width: 50,
  height: 50,
  marginRight: 8,
},
watermark: {
  position: 'absolute',
  width: 500,
  height: 700,
  right: -120,
  bottom: 0,
  opacity: 0.2,
},
});