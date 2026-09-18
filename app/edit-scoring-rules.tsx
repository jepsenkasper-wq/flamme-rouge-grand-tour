import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { getClassificationBonusRules } from '@/lib/classifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackgroundWatermark from '@/components/BackgroundWatermark';

import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';
import {
  applyLiveGameData,
  fetchLiveGame,
  updateLiveGameSettings,
} from '@/lib/live/liveGames';

export default function EditScoringRulesScreen() {
  const defaultRules = getClassificationBonusRules(
    Number(createGameDraft.stages || 21)
  );

  const rules = createGameDraft.scoringRules || defaultRules;

  const liveSession = getActiveLiveGameSession();

const toFiveValues = (values: number[]) =>
  Array.from(
    { length: 5 },
    (_, index) => String(values[index] ?? 0)
  );

const [yellow, setYellow] = useState(
  toFiveValues(rules.yellow)
);

const [sprint, setSprint] = useState(
  toFiveValues(rules.sprint)
);

const [mountain, setMountain] = useState(
  toFiveValues(rules.mountain)
);

const [team, setTeam] = useState(
  toFiveValues(rules.team)
);

const [bonusAwardMode, setBonusAwardMode] = useState<
  'each-stage' | 'final-stage'
>(createGameDraft.bonusAwardMode);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />
      <ScrollView
  contentContainerStyle={[
    styles.content,
    { paddingBottom: 40 + insets.bottom },
  ]}
  showsVerticalScrollIndicator={false}
>
      <Text style={styles.title}>Bonus Rules</Text>
<Text style={styles.subtitle}>
  Choose when classification Bonus Tour Points are awarded.
</Text>

   <View style={styles.card}>
    <Text style={styles.ruleTitle}>
  Award Bonus Tour Points
</Text>

<View style={styles.optionRow}>
  <Pressable
    style={[
      styles.optionButton,
      bonusAwardMode === 'each-stage' &&
        styles.optionButtonActive,
    ]}
    onPress={() =>
      setBonusAwardMode('each-stage')
    }
  >
    <Text
      style={[
        styles.optionText,
        bonusAwardMode === 'each-stage' &&
          styles.optionTextActive,
      ]}
    >
      After each stage
    </Text>
  </Pressable>

  <Pressable
    style={[
      styles.optionButton,
      bonusAwardMode === 'final-stage' &&
        styles.optionButtonActive,
    ]}
    onPress={() =>
      setBonusAwardMode('final-stage')
    }
  >
    <Text
      style={[
        styles.optionText,
        bonusAwardMode === 'final-stage' &&
          styles.optionTextActive,
      ]}
    >
      After final stage
    </Text>
  </Pressable>
</View>
  <ScoringInputRow title="GC Bonus" values={yellow} setValues={setYellow} />
<ScoringInputRow title="Sprint Bonus" values={sprint} setValues={setSprint} />
<ScoringInputRow title="Mountain Bonus" values={mountain} setValues={setMountain} />
<ScoringInputRow title="Team Bonus" values={team} setValues={setTeam} />

  <Pressable
  style={styles.button}
  onPress={async () => {
    const newScoringRules = {
      yellow: yellow.map((value) =>
        Number(value || 0)
      ),
      sprint: sprint.map((value) =>
        Number(value || 0)
      ),
      mountain: mountain.map((value) =>
        Number(value || 0)
      ),
      team: team.map((value) =>
        Number(value || 0)
      ),
    };

    if (liveSession) {
      await updateLiveGameSettings(
        liveSession.gameId,
        {
          gameName:
            createGameDraft.gameName,
          stages:
            createGameDraft.stages,
          restDayStages: [
            ...createGameDraft.restDayStages,
          ],
          scoringRules:
            newScoringRules,
          bonusAwardMode,
        }
      );

      const updatedGame =
        await fetchLiveGame(
          liveSession.gameId
        );

      if (updatedGame.gameData) {
        applyLiveGameData(
          updatedGame.gameData
        );
      }

      router.back();
      return;
    }

    createGameDraft.scoringRules =
      newScoringRules;

    createGameDraft.bonusAwardMode =
      bonusAwardMode;

    saveGame();
    updateActiveSavedGame();

    router.back();
  }}
>
  <Text style={styles.buttonText}>
    Save
  </Text>
</Pressable>

</View>
</ScrollView>
    </View>
  );
}

function ScoringInputRow({
  title,
  values,
  setValues,
}: {
  title: string;
  values: string[];
  setValues: (values: string[]) => void;
}) {
  const places = ['1st', '2nd', '3rd', '4th', '5th'];

  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleTitle}>{title}</Text>

      <View style={styles.placeRow}>
        {values.map((_, index) => (
          <Text key={index} style={styles.placeLabel}>
            {places[index] || `${index + 1}th`}
          </Text>
        ))}
      </View>

      <View style={styles.pointsRow}>
        {values.map((value, index) => (
          <TextInput
            key={index}
            style={styles.ruleInput}
            value={value}
            onChangeText={(newValue) => {
              const updated = [...values];
              updated[index] = newValue;
              setValues(updated);
            }}
            keyboardType="number-pad"
          />
        ))}
      </View>
    </View>
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
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },

  ruleRow: {
    marginBottom: 22,
  },

  ruleTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 10,
  },

  pointsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  pointBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.red,
  },

  pointText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
  },
ruleInput: {
  width: 42,
  height: 42,
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 10,
  textAlign: 'center',
  fontSize: 18,
  fontWeight: '900',
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

subtitle: {
  fontSize: 15,
  fontWeight: '700',
  color: Colors.brown,
  marginTop: -14,
  marginBottom: 20,
},

placeRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 6,
},

placeLabel: {
  width: 42,
  textAlign: 'center',
  fontSize: 12,
  fontWeight: '900',
  color: Colors.red,
},
content: {
  padding: 24,
  paddingTop: 20,
},
optionRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 24,
},

optionButton: {
  flex: 1,
  backgroundColor: Colors.white,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  paddingVertical: 12,
  paddingHorizontal: 10,
  alignItems: 'center',
},

optionButtonActive: {
  backgroundColor: Colors.red,
  borderColor: Colors.red,
},

optionText: {
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
  textAlign: 'center',
},

optionTextActive: {
  color: Colors.white,
},
});