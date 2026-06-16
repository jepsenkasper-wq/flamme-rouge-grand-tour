import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { calculateBonusBreakdown } from '@/lib/classifications';

export default function TourPointsOverviewScreen() {
const bonusBreakdown = calculateBonusBreakdown();
  const rows = createGameDraft.playerNames.map((playerName, playerIndex) => {
    let sprinteurPoints = 0;
    let rouleurPoints = 0;

    gameResults.entries
      .filter((entry) => entry.entryType === 'stage')
      .forEach((entry) => {
        const player = entry.players[playerIndex];

        if (!player) return;

        sprinteurPoints += Number(player.sprinteur.tourPoints || 0);
        rouleurPoints += Number(player.rouleur.tourPoints || 0);
      });
      
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
      bonus,
    sprinteurBonus,
    rouleurBonus,
    teamBonus,
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
        <Image
          source={require('@/assets/images/background-blackwhite.png')}
          style={styles.watermark}
          resizeMode="cover"
        />

    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tour Points Overview</Text>

      {rows.map((row) => (
        <View key={row.playerName} style={styles.card}>
          <Text style={styles.playerName}>{row.playerName}</Text>
<Text style={styles.bonusTitle}>Tour Points</Text>
          <View style={styles.line}>
            <Text style={styles.label}>Sprinteur</Text>
            <Text style={styles.value}>{row.sprinteurPoints} pts</Text>
          </View>

          <View style={styles.line}>
            <Text style={styles.label}>Rouleur</Text>
            <Text style={styles.value}>{row.rouleurPoints} pts</Text>
          </View>
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
  watermark: {
  position: 'absolute',
  width: 500,
  height: 700,
  right: -120,
  bottom: 0,
  opacity: 0.2,
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
});