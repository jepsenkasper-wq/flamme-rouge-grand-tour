import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';

export default function TourPointsOverviewScreen() {
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

    return {
      playerName: playerName || `Player ${playerIndex + 1}`,
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
      <Text style={styles.title}>Tour Points</Text>

      {rows.map((row) => (
        <View key={row.playerName} style={styles.card}>
          <Text style={styles.playerName}>{row.playerName}</Text>

          <View style={styles.line}>
            <Text style={styles.label}>Sprinteur</Text>
            <Text style={styles.value}>{row.sprinteurPoints} pts</Text>
          </View>

          <View style={styles.line}>
            <Text style={styles.label}>Rouleur</Text>
            <Text style={styles.value}>{row.rouleurPoints} pts</Text>
          </View>

          <View style={styles.totalLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{row.totalPoints} pts</Text>
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
});