import { router } from 'expo-router';
import { useState } from 'react';
import {
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

export default function EditScoringRulesScreen() {
  const defaultRules = getClassificationBonusRules(
    Number(createGameDraft.stages || 21)
  );

  const rules = createGameDraft.scoringRules || defaultRules;

  const [yellow, setYellow] = useState(
    rules.yellow.map(String)
  );

  const [sprint, setSprint] = useState(
    rules.sprint.map(String)
  );

  const [mountain, setMountain] = useState(
    rules.mountain.map(String)
  );

  const [team, setTeam] = useState(
    rules.team.map(String)
  );

  return (
    <View style={styles.screen}>
      <Image
            source={require('@/assets/images/background-blackwhite.png')}
            style={styles.watermark}
            resizeMode="cover"
          />
      <Text style={styles.title}>Scoring Rules</Text>

   <View style={styles.card}>
  <ScoringInputRow title="Yellow" values={yellow} setValues={setYellow} />
  <ScoringInputRow title="Sprint" values={sprint} setValues={setSprint} />
  <ScoringInputRow title="Mountain" values={mountain} setValues={setMountain} />
  <ScoringInputRow title="Team" values={team} setValues={setTeam} />

  <Pressable
  style={styles.button}
  onPress={() => {
    createGameDraft.scoringRules = {
      yellow: yellow.map((value) => Number(value || 0)),
      sprint: sprint.map((value) => Number(value || 0)),
      mountain: mountain.map((value) => Number(value || 0)),
      team: team.map((value) => Number(value || 0)),
    };

    saveGame();
    updateActiveSavedGame();

    router.back();
  }}>
  <Text style={styles.buttonText}>Save</Text>
</Pressable>

</View>
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
  return (
    <View style={styles.ruleRow}>
      <Text style={styles.ruleTitle}>{title}</Text>

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
    padding: 24,
    paddingTop: 20,
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
watermark: {
  position: 'absolute',
  width: 500,
  height: 700,
  right: -120,
  bottom: 0,
  opacity: 0.2,
},
});