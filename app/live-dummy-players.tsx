import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  liveGameDraft,
  type LiveAITeamType,
} from '@/lib/live/liveGameDraft';

const PLAYER_COLORS = [
  'Blue',
  'White',
  'Green',
  'Red',
  'Black',
  'Pink',
];

export default function LiveDummyPlayersScreen() {
  const dummyPlayerCount =
    Number(liveGameDraft.dummyPlayers || 0);

  const [dummyNames, setDummyNames] = useState(
    Array.from(
      { length: dummyPlayerCount },
      (_, index) => `Dummy ${index + 1}`
    )
  );

  const [dummyTypes, setDummyTypes] = useState<
    LiveAITeamType[]
  >(
    Array.from(
      { length: dummyPlayerCount },
      () => 'normal-ai'
    )
  );

  const insets = useSafeAreaInsets();

  function updateDummyName(
    index: number,
    value: string
  ) {
    const nextNames = [...dummyNames];
    nextNames[index] = value;
    setDummyNames(nextNames);
  }

  function updateDummyType(
    index: number,
    type: LiveAITeamType
  ) {
    const nextTypes = [...dummyTypes];
    nextTypes[index] = type;
    setDummyTypes(nextTypes);
  }

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              40 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.title}>
          Dummy Players
        </Text>

        {dummyNames.map((name, index) => (
          <View
            key={index}
            style={styles.playerCard}
          >
            <Text style={styles.playerTitle}>
              Dummy {index + 1}
            </Text>

            <Text style={styles.label}>
              Name
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(value) =>
                updateDummyName(
                  index,
                  value
                )
              }
              placeholder={`Dummy ${
                index + 1
              }`}
            />

            <Text style={styles.label}>
              Type
            </Text>

            <View style={styles.typeRow}>
              <Pressable
                onPress={() =>
                  updateDummyType(
                    index,
                    'normal-ai'
                  )
                }
                style={[
                  styles.typeButton,
                  dummyTypes[index] ===
                    'normal-ai' &&
                    styles.typeButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    dummyTypes[index] ===
                      'normal-ai' &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Normal AI
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  updateDummyType(
                    index,
                    'muscle'
                  )
                }
                style={[
                  styles.typeButton,
                  dummyTypes[index] ===
                    'muscle' &&
                    styles.typeButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    dummyTypes[index] ===
                      'muscle' &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Muscle
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  updateDummyType(
                    index,
                    'peloton'
                  )
                }
                style={[
                  styles.typeButton,
                  dummyTypes[index] ===
                    'peloton' &&
                    styles.typeButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    dummyTypes[index] ===
                      'peloton' &&
                      styles.typeButtonTextSelected,
                  ]}
                >
                  Peloton
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable
          style={styles.button}
          onPress={() => {
            liveGameDraft.aiTeams =
              dummyNames.map(
                (name, index) => ({
                  id: `dummy-${index + 1}`,
                  name:
                    name.trim() ||
                    `Dummy ${index + 1}`,
                  color:
                    PLAYER_COLORS[
                      Number(
                        liveGameDraft.players
                      ) + index
                    ],
                  teamType:
                    dummyTypes[index],
                })
              );

            router.push('/live-rest-days');
          }}
        >
          <Text style={styles.buttonText}>
            Next
          </Text>
        </Pressable>
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
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  playerCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  playerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },

  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 16,
  },

  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  typeButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  typeButtonSelected: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },

  typeButtonText: {
    color: Colors.brown,
    fontWeight: '800',
  },

  typeButtonTextSelected: {
    color: Colors.white,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});