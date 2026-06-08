import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { stageDraft } from '@/lib/stageDraft';

export default function HomeScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>
        {createGameDraft.gameName || 'FLAMME ROUGE'}
      </Text>

      <Text style={styles.subtitle}>Grand Tour</Text>

      <View style={styles.stageBar}>
        <Text style={styles.stageText}>
          Stage 0 of {createGameDraft.stages || '21'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Players</Text>

        {playerNames.map((name, index) => (
          <View key={index} style={styles.playerRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: getPlayerColor(playerColors[index]) },
              ]}
            />
            <Text style={styles.playerText}>
              {name || `Player ${index + 1}`} ({playerColors[index]})
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tour Setup</Text>
        <Text style={styles.cardText}>Stages: {createGameDraft.stages}</Text>
        <Text style={styles.cardText}>
          Rest days: {createGameDraft.restDays}
        </Text>
      </View>

      <Pressable
  style={styles.button}
  onPress={() => {
    stageDraft.initialize(createGameDraft.playerNames.length);
    router.push('/enter-stage');
  }}>
  <Text style={styles.buttonText}>Enter Stage 1</Text>
</Pressable>
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
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.brown,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    color: Colors.red,
    textAlign: 'center',
    marginBottom: 20,
  },

  stageBar: {
    backgroundColor: Colors.brown,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },

  stageText: {
    color: Colors.card,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 12,
  },

  cardText: {
    fontSize: 16,
    color: Colors.brown,
    marginBottom: 6,
  },

  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
  },

  playerText: {
    fontSize: 16,
    color: Colors.brown,
    fontWeight: '700',
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
});