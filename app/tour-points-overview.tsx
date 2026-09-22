import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { calculateBonusBreakdown } from '@/lib/classifications';
import BackgroundWatermark from '@/components/BackgroundWatermark';

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

export default function TourPointsOverviewScreen() {
const bonusBreakdown = calculateBonusBreakdown();
  const rows = createGameDraft.playerNames.map((playerName, playerIndex) => {
    let sprinteurStagePoints = 0;
let rouleurStagePoints = 0;
let sprinteurRestDayPoints = 0;
let rouleurRestDayPoints = 0;

    gameResults.entries.forEach((entry) => {
  const player = entry.players[playerIndex];

  if (!player) return;

  const sprinteurPoints = Number(
    player.sprinteur.tourPoints || 0
  );

  const rouleurPoints = Number(
    player.rouleur.tourPoints || 0
  );

  if (entry.entryType === 'restDay') {
    sprinteurRestDayPoints += sprinteurPoints;
    rouleurRestDayPoints += rouleurPoints;
  } else {
    sprinteurStagePoints += sprinteurPoints;
    rouleurStagePoints += rouleurPoints;
  }
});

const sprinteurPoints =
  sprinteurStagePoints +
  sprinteurRestDayPoints;

const rouleurPoints =
  rouleurStagePoints +
  rouleurRestDayPoints;
      
const bonus = bonusBreakdown[playerIndex];

const sprinteurBonus =
  (bonus?.sprinteur.yellow || 0) +
  (bonus?.sprinteur.mountain || 0) +
  (bonus?.sprinteur.sprint || 0);

const rouleurBonus =
  (bonus?.rouleur.yellow || 0) +
  (bonus?.rouleur.mountain || 0) +
  (bonus?.rouleur.sprint || 0);

const teamBonus = bonus?.team || 0;

return {
  playerName: playerName || `Player ${playerIndex + 1}`,
  playerColor: createGameDraft.playerColors[playerIndex],
  bonus,
  sprinteurBonus,
  rouleurBonus,
  teamBonus,

  sprinteurStagePoints,
  rouleurStagePoints,
  sprinteurRestDayPoints,
  rouleurRestDayPoints,

  overallPoints:
    sprinteurPoints +
    rouleurPoints +
    sprinteurBonus +
    rouleurBonus +
    teamBonus,

  sprinteurPoints,
  rouleurPoints,
  totalPoints: sprinteurPoints + rouleurPoints,
};
  });

  return (
    <View style={styles.screen}>
        <BackgroundWatermark />

    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tour Points Overview</Text>

      {rows.map((row) => (
        <View key={row.playerName} style={styles.card}>
          <View style={styles.playerNameRow}>
  <Text
    style={[
      styles.playerStar,
      { color: getPlayerColor(row.playerColor) },
    ]}>
    ★
  </Text>

  <Text style={styles.playerName}>
    {row.playerName}
  </Text>

  <Text
    style={[
      styles.playerStar,
      { color: getPlayerColor(row.playerColor) },
    ]}>
    ★
  </Text>
</View>

<Text style={styles.bonusTitle}>Tour Points</Text>
          <View style={styles.line}>
  <Text style={styles.label}>
    Sprinteur – Stages
  </Text>
  <Text style={styles.value}>
    {row.sprinteurStagePoints} pts
  </Text>
</View>

{row.sprinteurRestDayPoints > 0 && (
  <View style={styles.line}>
    <Text style={styles.label}>
      Sprinteur – Rest Days
    </Text>
    <Text style={styles.value}>
      {row.sprinteurRestDayPoints} pts
    </Text>
  </View>
)}

<View style={styles.line}>
  <Text style={styles.label}>
    Rouleur – Stages
  </Text>
  <Text style={styles.value}>
    {row.rouleurStagePoints} pts
  </Text>
</View>

{row.rouleurRestDayPoints > 0 && (
  <View style={styles.line}>
    <Text style={styles.label}>
      Rouleur – Rest Days
    </Text>
    <Text style={styles.value}>
      {row.rouleurRestDayPoints} pts
    </Text>
  </View>
)}
          <View style={styles.bonusBox}>
  <Text style={styles.bonusTitle}>Bonus Points</Text>

  <Text style={styles.bonusText}>
    Sprinteur: Yellow {row.bonus?.sprinteur.yellow || 0} · Mountain {row.bonus?.sprinteur.mountain || 0} · Sprint {row.bonus?.sprinteur.sprint || 0}
  </Text>

  <Text style={styles.bonusText}>
    Rouleur: Yellow {row.bonus?.rouleur.yellow || 0} · Mountain {row.bonus?.rouleur.mountain || 0} · Sprint {row.bonus?.rouleur.sprint || 0}
  </Text>

  <Text style={styles.bonusText}>
    Team: {row.teamBonus} pts
  </Text>
</View>

          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Overall Total</Text>
<Text style={styles.totalValue}>{row.overallPoints} pts</Text>
          </View>
     
        </View>
      ))}
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
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brown,
  },
  value: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.brown,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.red,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.red,
  },
  
bonusBox: {
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  marginTop: 8,
  paddingTop: 8,
  gap: 3,
},

bonusTitle: {
  fontSize: 13,
  fontWeight: '900',
  color: Colors.red,
  marginBottom: 2,
},

bonusText: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
},
playerNameRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
},

playerStar: {
  fontSize: 18,
  marginTop: -16,
  textShadowColor: 'rgba(42,36,28,0.5)',
  textShadowOffset: {
    width: 0,
    height: 0,
  },
  textShadowRadius: 2,
},
});