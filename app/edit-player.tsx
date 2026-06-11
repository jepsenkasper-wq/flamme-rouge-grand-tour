import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert, Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { gameResults } from '@/lib/gameResults';

export default function EditPlayerScreen() {
  const params = useLocalSearchParams();
  const playerIndex = Number(params.playerIndex ?? 0);

  const playerName =
    createGameDraft.playerNames[playerIndex] || `Player ${playerIndex + 1}`;

  const playerColor = createGameDraft.playerColors[playerIndex];
  const [name, setName] = useState(playerName);
  const [color, setColor] = useState(playerColor);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Edit Player</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>

<TextInput
  style={styles.input}
  value={name}
  onChangeText={setName}
/>

        <Text style={styles.label}>Color</Text>

<View style={styles.colorGrid}>
  {['Blue', 'White', 'Green', 'Red', 'Black', 'Pink'].map((colorOption) => (
    <Pressable
      key={colorOption}
      style={[
        styles.colorOption,
        color === colorOption && styles.activeColorOption,
      ]}
      onPress={() => setColor(colorOption)}>
      <Text style={styles.colorOptionText}>{colorOption}</Text>
    </Pressable>
  ))}
</View>
  <Pressable
  style={styles.button}
  onPress={() => {
  createGameDraft.playerNames[playerIndex] = name;
  createGameDraft.playerColors[playerIndex] = color;

  saveGame();
  updateActiveSavedGame();

  router.back();
}}>
  <Text style={styles.buttonText}>Save</Text>
</Pressable>
      </View>
{createGameDraft.playerNames.length > 2 && (
  <Pressable
    style={styles.deleteButton}
    onPress={() => {
      if (gameResults.entries.length > 0) {
  Alert.alert(
    'Delete player?',
    'This will remove the player and all stage results for this player.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          createGameDraft.playerNames.splice(playerIndex, 1);
          createGameDraft.playerColors.splice(playerIndex, 1);

          gameResults.entries.forEach((entry) => {
  entry.players.splice(playerIndex, 1);

  let tieBreakOrder = 0;

  entry.players.forEach((player) => {
    player.sprinteur.tieBreakOrder = tieBreakOrder++;
    player.rouleur.tieBreakOrder = tieBreakOrder++;
  });
});

          saveGame();
          updateActiveSavedGame();

          router.back();
        },
      },
    ]
  );

  return;
}

      createGameDraft.playerNames.splice(playerIndex, 1);
      createGameDraft.playerColors.splice(playerIndex, 1);

      saveGame();
      updateActiveSavedGame();

      router.back();
    }}>
    <Text style={styles.deleteButtonText}>Delete Player</Text>
  </Pressable>
)}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 72,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.red,
    marginBottom: 6,
  },

  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 18,
  },
  input: {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  padding: 12,
  fontSize: 18,
  color: Colors.brown,
  marginBottom: 18,
},

button: {
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 12,
},

buttonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},
colorGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 18,
},

colorOption: {
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 999,
  paddingVertical: 10,
  paddingHorizontal: 14,
},

activeColorOption: {
  borderColor: Colors.red,
  borderWidth: 2,
},

colorOptionText: {
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
},
deleteButton: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.red,
  padding: 16,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 12,
},

deleteButtonText: {
  color: Colors.red,
  fontSize: 18,
  fontWeight: '900',
},
});