import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { gameResults } from '@/lib/gameResults';
import { createGameDraft } from '@/lib/createGameDraft';

export default function StageDetailScreen() {
  const params = useLocalSearchParams();
  const entryIndex = Number(params.entryIndex ?? 0);

  const entry = gameResults.entries[entryIndex];

  const hasPrevious = entryIndex > 0;
const hasNext = entryIndex < gameResults.entries.length - 1;
  

  if (!entry) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Stage not found</Text>
      </View>
    );
  }

const riderResults: {
  riderName: string;
  time: string;
  tieBreakOrder: number;
}[] = [];

if (entry) {
  entry.players.forEach((player, index) => {
    const playerName =
      createGameDraft.playerNames[index] || `Player ${index + 1}`;

    riderResults.push({
  riderName: `${playerName} - Sprinteur`,
  time: player.sprinteur.time,
  tieBreakOrder: player.sprinteur.tieBreakOrder ?? 0,
});

    riderResults.push({
  riderName: `${playerName} - Rouleur`,
  time: player.rouleur.time,
  tieBreakOrder: player.rouleur.tieBreakOrder ?? 0,
});
  });
}

function timeToSeconds(time: string) {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const [minutes, seconds] = time.split(':').map(Number);

  return minutes * 60 + seconds;
}

riderResults.sort((a, b) => {
  const timeDifference =
    timeToSeconds(a.time) - timeToSeconds(b.time);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return a.tieBreakOrder - b.tieBreakOrder;
});

  return (
  <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    
    <View style={styles.stageNav}>
  <Pressable
    disabled={!hasPrevious}
    onPress={() =>
      router.replace({
        pathname: '/stage-detail',
        params: { entryIndex: String(entryIndex - 1) },
      })
    }>
    <Text
      style={[
        styles.stageNavButton,
        !hasPrevious && styles.disabledNavButton,
      ]}>
      Previous
    </Text>
  </Pressable>

  <Text style={styles.stageNavTitle}>
    {entry.entryType === 'restDay'
      ? 'Rest Day'
      : `Stage ${entry.stageNumber}`}
  </Text>

  <Pressable
    disabled={!hasNext}
    onPress={() =>
      router.replace({
        pathname: '/stage-detail',
        params: { entryIndex: String(entryIndex + 1) },
      })
    }>
    <Text
      style={[
        styles.stageNavButton,
        !hasNext && styles.disabledNavButton,
      ]}>
      Next
    </Text>
  </Pressable>
</View>

      <Text style={styles.title}>
        {entry.entryType === 'restDay'
          ? `Rest Day after Stage ${entry.stageNumber}`
          : `Stage ${entry.stageNumber}`}
      </Text>

      <Text style={styles.subtitle}>Results</Text>

{riderResults.map((rider, index) => (
  <View key={index} style={styles.resultRow}>
    <Text style={styles.position}>{index + 1}</Text>

    <Text style={styles.riderName}>{rider.riderName}</Text>

    <Text style={styles.time}>{rider.time || '-'}</Text>
  </View>
))}

<Pressable
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: '/enter-stage',
      params: { editEntryIndex: String(entryIndex) },
    })
  }>
  <Text style={styles.buttonText}>Edit Stage</Text>
</Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  subtitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },

resultRow: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 14,
  padding: 14,
  marginBottom: 10,
},

position: {
  width: 32,
  fontSize: 18,
  fontWeight: '900',
  color: Colors.red,
},

riderName: {
  flex: 1,
  fontSize: 16,
  fontWeight: '800',
  color: Colors.brown,
},

time: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.brown,
},
content: {
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
},
stageNav: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
},

stageNavButton: {
  color: Colors.red,
  fontWeight: '900',
  fontSize: 14,
},

stageNavTitle: {
  color: Colors.brown,
  fontWeight: '900',
  fontSize: 18,
},
disabledNavButton: {
  opacity: 0.3,
},
button: {
  backgroundColor: Colors.red,
  padding: 18,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 24,
},

buttonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},
});