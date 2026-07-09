import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image, Alert, Pressable,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { gameResults } from '@/lib/gameResults';
import BackgroundWatermark from '@/components/BackgroundWatermark';
import type { SpecialRiderId } from '@/lib/solo/specialRiders';
import { resetActiveSoloStageState } from '@/lib/solo/activeSoloStage';

const TEAM_TYPES = [
  { label: 'Human', value: 'human' },
  { label: 'Normal AI', value: 'normal-ai' },
  { label: 'Muscle', value: 'muscle' },
  { label: 'Peloton', value: 'peloton' },
] as const;

const DRAW_MODES = [
  { label: 'Card Draw', value: 'card-draw' },
  { label: 'App-assisted', value: 'app-draw' },
] as const;

const SPRINTEUR_DECKS: {
  label: string;
  value: SpecialRiderId | undefined;
}[] = [
  { label: 'Normal', value: undefined },
  { label: 'Descender', value: 'descender' },
  { label: 'Mountaineer', value: 'mountaineer' },
  { label: 'Polyvalent', value: 'polyvalent' },
  { label: 'Squirrel', value: 'squirrel' },
  { label: 'Super Sprinteur', value: 'super-sprinteur' },
  { label: 'Flahute', value: 'flahute' },
];

const ROULEUR_DECKS: {
  label: string;
  value: SpecialRiderId | undefined;
}[] = [
  { label: 'Normal', value: undefined },
  { label: 'Baroudeur', value: 'baroudeur' },
  { label: 'Flandrien', value: 'flandrien' },
  { label: 'Grimpeur', value: 'grimpeur' },
  { label: 'Domestique', value: 'domestique' },
  { label: 'Super Rouleur', value: 'super-rouleur' },
  { label: 'Puncheur', value: 'puncheur' },
];

export default function EditPlayerScreen() {
  const params = useLocalSearchParams();
  const playerIndex = Number(params.playerIndex ?? 0);

  const playerName =
    createGameDraft.playerNames[playerIndex] || `Player ${playerIndex + 1}`;

  const playerColor = createGameDraft.playerColors[playerIndex];

const isDummyGame = createGameDraft.companionMode === 'dummy';

const dummyTeam = isDummyGame
  ? createGameDraft.dummyTeams[playerIndex]
  : undefined;
  
  const [name, setName] = useState(playerName);
  const [color, setColor] = useState(playerColor);

const [teamType, setTeamType] = useState(
  dummyTeam?.teamType ?? 'human'
);

const [drawMode, setDrawMode] = useState(
  dummyTeam?.drawMode ?? 'card-draw'
);

const [sprinteurSpecialRiderId, setSprinteurSpecialRiderId] =
  useState<SpecialRiderId | undefined>(
    dummyTeam?.sprinteurSpecialRiderId
  );

const [rouleurSpecialRiderId, setRouleurSpecialRiderId] =
  useState<SpecialRiderId | undefined>(
    dummyTeam?.rouleurSpecialRiderId
  );

  return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

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

{isDummyGame && (
  <>
    <Text style={styles.label}>Team Type</Text>

    <View style={styles.optionRow}>
      {TEAM_TYPES.map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.optionButton,
            teamType === option.value && styles.optionButtonActive,
          ]}
          onPress={() => setTeamType(option.value)}>
          <Text
            style={[
              styles.optionText,
              teamType === option.value && styles.optionTextActive,
            ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>

    {teamType === 'human' && (
      <>
        <Text style={styles.label}>Draw Mode</Text>

        <View style={styles.optionRow}>
          {DRAW_MODES.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionButton,
                drawMode === option.value && styles.optionButtonActive,
              ]}
              onPress={() => setDrawMode(option.value)}>
              <Text
                style={[
                  styles.optionText,
                  drawMode === option.value && styles.optionTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </>
    )}

    {(teamType === 'normal-ai' ||
      (teamType === 'human' && drawMode === 'app-draw')) && (
      <>
        <Text style={styles.label}>Sprinteur Deck</Text>

        <View style={styles.optionRow}>
          {SPRINTEUR_DECKS.map((deck) => (
            <Pressable
              key={deck.label}
              style={[
                styles.optionButton,
                sprinteurSpecialRiderId === deck.value &&
                  styles.optionButtonActive,
              ]}
              onPress={() => setSprinteurSpecialRiderId(deck.value)}>
              <Text
                style={[
                  styles.optionText,
                  sprinteurSpecialRiderId === deck.value &&
                    styles.optionTextActive,
                ]}>
                {deck.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Rouleur Deck</Text>

        <View style={styles.optionRow}>
          {ROULEUR_DECKS.map((deck) => (
            <Pressable
              key={deck.label}
              style={[
                styles.optionButton,
                rouleurSpecialRiderId === deck.value &&
                  styles.optionButtonActive,
              ]}
              onPress={() => setRouleurSpecialRiderId(deck.value)}>
              <Text
                style={[
                  styles.optionText,
                  rouleurSpecialRiderId === deck.value &&
                    styles.optionTextActive,
                ]}>
                {deck.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </>
    )}
  </>
)}

  <Pressable
  style={styles.button}
  onPress={() => {
 createGameDraft.playerNames[playerIndex] = name;
createGameDraft.playerColors[playerIndex] = color;

if (isDummyGame && createGameDraft.dummyTeams[playerIndex]) {
  createGameDraft.dummyTeams[playerIndex] = {
    ...createGameDraft.dummyTeams[playerIndex],
    name,
    color,
    teamType,
    drawMode,
    sprinteurSpecialRiderId,
    rouleurSpecialRiderId,
  };

  resetActiveSoloStageState();
}
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
  paddingTop: 72,
  paddingBottom: 40,
},
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
    marginTop: -60,
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

optionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
},

optionButton: {
  backgroundColor: Colors.white,
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

});