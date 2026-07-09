import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
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

export default function AddPlayerScreen() {
  const [name, setName] = useState('');
  const [color, setColor] = useState('Blue');

const isDummyGame = createGameDraft.companionMode === 'dummy';

const [teamType, setTeamType] = useState<'human' | 'normal-ai' | 'muscle' | 'peloton'>('human');

const [drawMode, setDrawMode] = useState<'card-draw' | 'app-draw'>('card-draw');
const [sprinteurSpecialRiderId, setSprinteurSpecialRiderId] =
  useState<SpecialRiderId | undefined>(undefined);
const [rouleurSpecialRiderId, setRouleurSpecialRiderId] =
  useState<SpecialRiderId | undefined>(undefined);

  return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Add Player</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Player name"
        />

        <Text style={styles.label}>Color</Text>

        <View style={styles.colorGrid}>
          {['Blue', 'White', 'Green', 'Red', 'Black', 'Pink'].map(
            (colorOption) => (
              <Pressable
                key={colorOption}
                style={[
                  styles.colorOption,
                  color === colorOption && styles.activeColorOption,
                ]}
                onPress={() => setColor(colorOption)}>
                <Text style={styles.colorOptionText}>{colorOption}</Text>
              </Pressable>
            )
          )}
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
  if (createGameDraft.playerNames.length >= 6) {
    return;
  }

  const nextPlayerName =
    name || `Player ${createGameDraft.playerNames.length + 1}`;

  createGameDraft.playerNames.push(nextPlayerName);
  createGameDraft.playerColors.push(color);

  if (isDummyGame) {
    createGameDraft.dummyTeams.push({
      id: `team-${Date.now()}`,
      name: nextPlayerName,
      color,
      teamType,
      drawMode,
      sprinteurSpecialRiderId,
      rouleurSpecialRiderId,
    });

    resetActiveSoloStageState();
  }

  saveGame();
  updateActiveSavedGame();

  router.back();
}}>
                    <Text style={styles.buttonText}>Add Player</Text>
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
  paddingTop: 20,
  paddingBottom: 40,
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