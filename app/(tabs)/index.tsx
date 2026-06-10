import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { stageDraft } from '@/lib/stageDraft';
import { gameState } from '@/lib/gameState';
import { gameResults } from '@/lib/gameResults';
import {
  calculateOverallClassification,
  calculateYellowClassification,
  calculateMountainClassification,
  calculateSprintClassification,
  calculateTeamClassification,
} from '@/lib/classifications';

export default function HomeScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const overallClassification = calculateOverallClassification();
  const podium = overallClassification.slice(0, 3);
const remainingPlayers = overallClassification.slice(3);
  const yellowLeader = calculateYellowClassification()[0];
const mountainLeader = calculateMountainClassification()[0];
const sprintLeader = calculateSprintClassification()[0];
const teamLeader = calculateTeamClassification()[0];

const entryTitle =
  gameState.currentEntryType === 'restDay'
    ? `Rest Day after Stage ${gameState.currentStage}`
    : `Stage ${gameState.currentStage} of ${createGameDraft.stages || '21'}`;

const buttonTitle =
  gameState.currentEntryType === 'restDay'
    ? 'Enter Rest Day'
    : `Enter Stage ${gameState.currentStage}`;

  return (
  <ScrollView
    style={styles.screen}
    contentContainerStyle={styles.content}
  >
      <Text style={styles.title}>
        {createGameDraft.gameName || 'FLAMME ROUGE'}
      </Text>

      <Text style={styles.subtitle}>Grand Tour</Text>

      <View style={styles.stageBar}>
        <Text style={styles.stageText}>
  {entryTitle}
</Text>
      </View>

      <View style={styles.card}>
  <Text style={styles.cardTitle}>Overall Standings</Text>

<View style={styles.podiumContainer}>
  {podium[0] && (
    <View style={styles.firstPlace}>
      <Text style={styles.podiumTitle}>
    Overall Leader
  </Text>
      <Text style={styles.firstPlacePosition}>1</Text>
      <Text style={styles.firstPlaceName}>
        {podium[0].playerName}
      </Text>
      <Text style={styles.firstPlacePoints}>
        {podium[0].points} pts
      </Text>
    </View>
  )}

  <View style={styles.lowerPodium}>
    {podium[1] && (
      <View style={styles.podiumSide}>
        <Text style={styles.position}>2</Text>
        <Text style={styles.playerText}>
          {podium[1].playerName}
        </Text>
        <Text style={styles.pointsText}>
          {podium[1].points} pts
        </Text>
      </View>
    )}

    {podium[2] && (
      <View style={styles.podiumSide}>
        <Text style={styles.position}>3</Text>
        <Text style={styles.playerText}>
          {podium[2].playerName}
        </Text>
        <Text style={styles.pointsText}>
          {podium[2].points} pts
        </Text>
      </View>
    )}
  </View>
</View>

{remainingPlayers.length > 0 && (
  <View style={styles.remainingContainer}>
    {remainingPlayers.map((player, index) => (
      <View key={index} style={styles.playerRow}>
        <Text style={styles.position}>
          {index + 4}
        </Text>

        <Text style={styles.playerText}>
          {player.playerName}
        </Text>

        <Text style={styles.pointsText}>
          {player.points} pts
        </Text>
      </View>
    ))}
  </View>
)}
</View>

<View style={styles.card}>
  <Text style={styles.cardTitle}>Current Leaders</Text>

  <View style={styles.leadersGrid}>
    <View style={[styles.leaderBox, styles.yellowLeaderBox]}>
      <Text style={styles.leaderLabel}>Yellow Jersey</Text>
      <Text style={styles.leaderName}>
        {formatLeaderName(yellowLeader?.riderName)}
      </Text>
    </View>

    <View style={[styles.leaderBox, styles.mountainLeaderBox]}>
      <Text style={styles.leaderLabel}>Mountain Jersey</Text>
      <Text style={styles.leaderName}>
        {formatLeaderName(mountainLeader?.riderName)}
      </Text>
    </View>

    <View style={[styles.leaderBox, styles.sprintLeaderBox]}>
      <Text style={styles.leaderLabel}>Sprint Jersey</Text>
      <Text style={styles.leaderName}>
        {formatLeaderName(sprintLeader?.riderName)}
      </Text>
    </View>

    <View style={[styles.leaderBox, styles.teamLeaderBox]}>
      <Text style={styles.leaderLabel}>Team GC</Text>
      <Text style={styles.leaderName}>
        {teamLeader?.playerName || '-'}
      </Text>
    </View>
  </View>
</View>


      <Pressable
  style={styles.button}
  onPress={() => {
  stageDraft.initialize(createGameDraft.playerNames.length);
  router.push('/enter-stage');
}}>
  <Text style={styles.buttonText}>
  {buttonTitle}
</Text>
</Pressable>
    </ScrollView>
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

function formatLeaderName(name?: string) {
  if (!name) return '-';

  return name
    .replace(' - Sprinteur', ' - S')
    .replace(' - Rouleur', ' - R');
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
  flex: 1,
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
  position: {
  width: 28,
  fontSize: 16,
  fontWeight: '900',
  color: Colors.red,
},

pointsText: {
  fontSize: 15,
  fontWeight: '900',
  color: Colors.brown,
},
leadersGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
},

leaderBox: {
  width: '48%',
  backgroundColor: Colors.paper,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  padding: 12,
},
yellowLeaderBox: {
  backgroundColor: '#f7e08c',
},

mountainLeaderBox: {
  backgroundColor: '#f4c7c3',
},

sprintLeaderBox: {
  backgroundColor: '#cfe8c8',
},

teamLeaderBox: {
  backgroundColor: '#d9e4f5',
},

leaderLabel: {
  fontSize: 14,
  fontWeight: '900',
  color: Colors.red,
  marginBottom: 6,
},

leaderName: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},
content: {
  paddingBottom: 40,
},
podiumContainer: {
  marginBottom: 12,
},

podiumRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 8,
},

remainingContainer: {
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  paddingTop: 12,
},
firstPlace: {
  alignItems: 'center',
  marginBottom: 16,
  padding: 16,
  borderRadius: 16,
  backgroundColor: '#f7e08c',
  borderWidth: 2,
  borderColor: '#d9a441',
},

firstPlacePosition: {
  fontSize: 36,
  fontWeight: '900',
  color: Colors.red,
  marginBottom: 4,
},

firstPlaceName: {
  fontSize: 24,
  fontWeight: '900',
  color: Colors.brown,
},

firstPlacePoints: {
  fontSize: 16,
  fontWeight: '800',
  color: Colors.brown,
},

lowerPodium: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},

podiumSide: {
  flex: 1,
  alignItems: 'center',
},
podiumTitle: {
  fontSize: 12,
  fontWeight: '800',
  color: Colors.brown,
  textTransform: 'uppercase',
  marginBottom: 4,
},
});