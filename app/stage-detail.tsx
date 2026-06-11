import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { gameResults } from '@/lib/gameResults';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';

export default function StageDetailScreen() {
  const params = useLocalSearchParams();
  const entryIndex = Number(params.entryIndex ?? 0);

  const entry = gameResults.entries[entryIndex];
const [tieVersion, setTieVersion] = useState(0);

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
  playerIndex: number;
  riderType: 'sprinteur' | 'rouleur';
}[] = [];

if (entry) {
  entry.players.forEach((player, index) => {
    const playerName =
      createGameDraft.playerNames[index] || `Player ${index + 1}`;

    riderResults.push({
  riderName: `${playerName} - Sprinteur`,
  time: player.sprinteur.time,
  tieBreakOrder: player.sprinteur.tieBreakOrder ?? 0,
  playerIndex: index,
  riderType: 'sprinteur',
});

    riderResults.push({
  riderName: `${playerName} - Rouleur`,
  time: player.rouleur.time,
  tieBreakOrder: player.rouleur.tieBreakOrder ?? 0,
  playerIndex: index,
  riderType: 'rouleur',
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

  const aOrder =
    entry.players[a.playerIndex][a.riderType].tieBreakOrder ?? 0;

  const bOrder =
    entry.players[b.playerIndex][b.riderType].tieBreakOrder ?? 0;

  return aOrder - bOrder + tieVersion * 0;
});

function hasSameTimeNeighbor(index: number) {
  const current = riderResults[index];
  const previous = riderResults[index - 1];
  const next = riderResults[index + 1];

  return (
    (previous && previous.time === current.time) ||
    (next && next.time === current.time)
  );
}

function moveTieBreaker(
  riderToMove: (typeof riderResults)[number],
  direction: 'up' | 'down'
) {
  const index = riderResults.findIndex(
    (rider) =>
      rider.playerIndex === riderToMove.playerIndex &&
      rider.riderType === riderToMove.riderType
  );
  const targetIndex = direction === 'up' ? index - 1 : index + 1;

  const current = riderResults[index];
  const target = riderResults[targetIndex];


  if (!current || !target || current.time !== target.time) {
    return;
  }

  const newOrder = [...riderResults];

  newOrder[index] = target;
  newOrder[targetIndex] = current;

  newOrder.forEach((rider, order) => {
    entry.players[rider.playerIndex][rider.riderType].tieBreakOrder = order;
  });

saveGame();
updateActiveSavedGame();

setTieVersion((version) => version + 1);
}

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
  <View key={`${rider.playerIndex}-${rider.riderType}`} style={styles.resultRow}>
    <Text style={styles.position}>{index + 1}</Text>

    <Text style={styles.riderName}>{rider.riderName}</Text>

    <Text style={styles.time}>{rider.time || '-'}</Text>

    {hasSameTimeNeighbor(index) && (
      <View style={styles.tieButtons}>
      <Pressable
  style={styles.tiePressable}
  onPress={() => {
    moveTieBreaker(rider, 'up');
  }}>
  <Text style={styles.tieButton}>↑</Text>
</Pressable>

<Pressable
  style={styles.tiePressable}
  onPress={() => {
    moveTieBreaker(rider, 'down');
  }}>
  <Text style={styles.tieButton}>↓</Text>
</Pressable>
      </View>
    )}
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
tieButtons: {
  flexDirection: 'row',
  gap: 6,
  marginLeft: 10,
},

tieButton: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.red,
},
tiePressable: {
  width: 36,
  height: 36,
  alignItems: 'center',
  justifyContent: 'center',
},
});