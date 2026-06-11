import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

export default function HomeScreen() {
  const [, setRefreshVersion] = useState(0);

useFocusEffect(
  useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, [])
);
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const overallClassification = calculateOverallClassification();

  const podium = overallClassification.slice(0, 3);
  function getRiderImage(playerName: string) {
  const playerIndex = playerNames.findIndex((name) => name === playerName);
  const playerColor = playerColors[playerIndex];

  return riderImages[playerColor];
}
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
      <View style={styles.header}>
  <Text style={styles.title}>
    {createGameDraft.gameName || 'GRAND TOUR'}
  </Text>

  <View style={styles.stageBadge}>
    <Text style={styles.stageText}>
      {entryTitle.toUpperCase()}
    </Text>
  </View>
</View>

      <View style={styles.podium}>
  <View style={styles.podiumRow}>
    <View style={styles.podiumColumn}>
      {podium[1] && (
        <Image
          source={getRiderImage(podium[1].playerName)}
          style={styles.podiumAvatar}
        />
      )}
      <Text style={styles.podiumName}>
  {podium[1].playerName}
</Text>

<Text style={styles.podiumPoints}>
  {podium[1].points} pts
</Text>

      <View style={[styles.podiumBlock, styles.secondBlock]}>
        <Text style={styles.podiumNumber}>2</Text>
      </View>
    </View>

    <View style={styles.podiumColumn}>
      {podium[0] && (
        <Image
          source={getRiderImage(podium[0].playerName)}
          style={styles.podiumAvatar}          
        />
      )}

<Text style={styles.podiumName}>
  {podium[0].playerName}
</Text>

<Text style={styles.podiumPoints}>
  {podium[0].points} pts
</Text>

      <View style={[styles.podiumBlock, styles.firstBlock]}>
        <Text style={styles.podiumNumber}>1</Text>
      </View>
    </View>

    <View style={styles.podiumColumn}>
      {podium[2] && (
        <Image
          source={getRiderImage(podium[2].playerName)}
          style={styles.podiumAvatar}
        />
      )}

      <Text style={styles.podiumName}>
  {podium[2].playerName}
</Text>

      <Text style={styles.podiumPoints}>
  {podium[2].points} pts
</Text>

      <View style={[styles.podiumBlock, styles.thirdBlock]}>
        <Text style={styles.podiumNumber}>3</Text>
      </View>
    </View>
  </View>
</View>

{remainingPlayers.length > 0 && (
  <View style={styles.remainingPodiumList}>
    {remainingPlayers.map((player, index) => (
      <View key={player.playerName} style={styles.remainingPodiumRow}>
        <Text style={styles.remainingPosition}>{index + 4}</Text>

        <Image
          source={getRiderImage(player.playerName)}
          style={styles.remainingAvatar}
        />

        <Text style={styles.remainingName} numberOfLines={1}>
          {player.playerName}
        </Text>

        <Text style={styles.remainingPoints}>
          {player.points} pts
        </Text>
      </View>
    ))}
  </View>
)}

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

header: {
  alignItems: 'center',
  marginBottom: 22,
},

title: {
  fontFamily: 'BebasNeue',
  fontSize: 28,
  lineHeight: 56,
  color: '#2A241C',
  textAlign: 'center',
  letterSpacing: 2,
},

subtitle: {
  fontSize: 26,
  color: '#4A3328',
  textAlign: 'center',
  marginTop: -6,
  marginBottom: 14,
  fontStyle: 'italic',
  fontWeight: '700',
},

stageBadge: {
  backgroundColor: '#D4A235',
  borderColor: '#9B6C16',
  borderWidth: 1,
  paddingVertical: 5,
  paddingHorizontal: 18,
  alignSelf: 'center',
},

stageText: {
  color: '#2A241C',
  fontFamily: 'BebasNeue',
  fontSize: 16,
  letterSpacing: 1.5,
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

podium: {
  height: 320,
  justifyContent: 'flex-end',
  marginBottom: 22,
},

podiumRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 10,
},

podiumBlock: {
  width: 100,
  borderWidth: 2,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
shadowOpacity: 0.14,
shadowRadius: 6,
shadowOffset: {
  width: 0,
  height: 3,
},
elevation: 3,
},

firstBlock: {
  height: 125,
  backgroundColor: '#D4A235',
  borderColor: '#9B6C16',
},

secondBlock: {
  height: 90,
  backgroundColor: '#B8B2A3',
  borderColor: '#7C7568',
},

thirdBlock: {
  height: 75,
  backgroundColor: '#B87333',
  borderColor: '#8A4E22',
},

podiumNumber: {
  fontFamily: 'BebasNeue',
  fontSize: 54,
  color: 'rgba(42, 36, 28, 0.55)',
},
podiumColumn: {
  alignItems: 'center',
  justifyContent: 'flex-end',
},

podiumAvatar: {
  width: 54,
  height: 54,
  marginBottom: -4,
},
podiumName: {
  fontSize: 15,
  fontWeight: '700',
  color: Colors.brown,
  textAlign: 'center',
  minHeight: 36,
  marginBottom: 6,
},
podiumPoints: {
  fontFamily: 'BebasNeue',
  fontSize: 18,
  color: '#7A1D12',
  marginBottom: 6,
  letterSpacing: 0.5,
},
remainingPodiumList: {
  marginTop: -20,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  overflow: 'hidden',
  backgroundColor: 'rgba(250, 241, 222, 0.72)',
},

remainingPodiumRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 7,
  paddingHorizontal: 10,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},

remainingPosition: {
  width: 22,
  fontFamily: 'BebasNeue',
  fontSize: 22,
  color: '#7A1D12',
},

remainingAvatar: {
  width: 28,
  height: 28,
  marginRight: 8,
},

remainingName: {
  flex: 1,
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},

remainingPoints: {
  fontFamily: 'BebasNeue',
  fontSize: 18,
  color: '#7A1D12',
  letterSpacing: 0.5,
},
});