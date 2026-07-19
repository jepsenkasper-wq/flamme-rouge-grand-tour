import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { gameResults } from '@/lib/gameResults';
import { createGameDraft } from '@/lib/createGameDraft';
import {
  getActiveSavedGame,
  saveGame,
  updateActiveSavedGame,
} from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

export default function StageDetailScreen() {
  const params = useLocalSearchParams();
  const entryIndex = Number(params.entryIndex ?? 0);

  const entry = gameResults.entries[entryIndex];
const [tieVersion, setTieVersion] = useState(0);

const [isFollower, setIsFollower] = useState(false);

const insets = useSafeAreaInsets();

const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

useEffect(() => {
  async function loadRole() {
    const savedGame = await getActiveSavedGame();
    setIsFollower(savedGame?.role === 'follower');
  }

  loadRole();
}, []);

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

function getRiderImage(playerIndex: number) {
  const playerColor = createGameDraft.playerColors[playerIndex];
  return riderImages[playerColor] || riderImages.Blue;
}

  return (
  <ScrollView
  style={styles.screen}
  contentContainerStyle={[styles.content, contentStyle]}
>
    
<View style={styles.stageNav}>
  <Pressable
    disabled={!hasPrevious}
    style={[styles.stageNavSide, !hasPrevious && styles.disabledNavButton]}
    onPress={() =>
      router.replace({
        pathname: '/stage-detail',
        params: { entryIndex: String(entryIndex - 1) },
      })
    }>
    <Ionicons name="arrow-back" size={20} color={Colors.brown} />
    <Text style={styles.stageNavButton}>Prev</Text>
  </Pressable>

  <View style={styles.stageNavCenter}>
    <Text style={styles.stageNavTitle}>
      {entry.entryType === 'restDay'
        ? 'Rest Day'
        : `Stage ${entry.stageNumber}`}
    </Text>
  </View>

  <Pressable
    disabled={!hasNext}
    style={[styles.stageNavSide, !hasNext && styles.disabledNavButton]}
    onPress={() =>
      router.replace({
        pathname: '/stage-detail',
        params: { entryIndex: String(entryIndex + 1) },
      })
    }>
    <Text style={styles.stageNavButton}>Next</Text>
    <Ionicons name="arrow-forward" size={20} color={Colors.brown} />
  </Pressable>
</View>

<View style={styles.winnerSection}>
  <View style={styles.doubleLine}>
    <View style={styles.lineThin} />
    <View style={styles.lineThin} />
  </View>

  <Text style={styles.winnerHeadline}>
    WINNER!
  </Text>

  <View style={styles.doubleLine}>
    <View style={styles.lineThin} />
    <View style={styles.lineThin} />
  </View>

  <Image
    source={require('@/assets/images/stages/stage-winner.png')}
    style={styles.winnerImage}
    resizeMode="stretch"
  />

  <Text style={styles.winnerName}>
    {riderResults[0]?.riderName
      .replace(' - Sprinteur', ' S')
      .replace(' - Rouleur', ' R')}
  </Text>

  <Text style={styles.winnerSubline}>
    Stage Winner
  </Text>
  <View style={styles.newspaperLine} />
  </View>


    

{riderResults.map((rider, index) => (
<View key={`${rider.playerIndex}-${rider.riderType}`} style={styles.resultRow}>
  <Text style={styles.position}>{index + 1}</Text>

  <Image
    source={getRiderImage(rider.playerIndex)}
    style={styles.riderAvatar}
  />

  <Text style={styles.riderName}>
    {rider.riderName
      .replace(' - Sprinteur', ' S')
      .replace(' - Rouleur', ' R')}
  </Text>

  <View style={styles.tieColumn}>
  {!isFollower && hasSameTimeNeighbor(index) && (
    <View style={styles.tieButtons}>
      <Pressable
        style={styles.tiePressable}
        onPress={() => moveTieBreaker(rider, 'up')}
      >
        <Text style={styles.tieButton}>↑</Text>
      </Pressable>

      <Pressable
        style={styles.tiePressable}
        onPress={() => moveTieBreaker(rider, 'down')}
      >
        <Text style={styles.tieButton}>↓</Text>
      </Pressable>
    </View>
  )}
</View>

  <Text style={styles.time}>{rider.time || '-'}</Text>
</View>
))}

{!isFollower && (
  <Pressable
    style={styles.button}
    onPress={() =>
      router.push({
        pathname: '/enter-stage',
        params: { editEntryIndex: String(entryIndex) },
      })
    }
  >
    <Text style={styles.buttonText}>Edit Stage</Text>
  </Pressable>
)}

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
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingVertical: 12,
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


content: {
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
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


tieButton: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.red,
},

riderAvatar: {
  width: 34,
  height: 34,
  marginRight: 8,
},
tieColumn: {
  width: 54,
  alignItems: 'center',
},

time: {
  width: 54,
  textAlign: 'right',
  fontFamily: 'BebasNeue',
  fontSize: 22,
  color: Colors.brown,
},

tieButtons: {
  flexDirection: 'row',
  gap: 2,
},

tiePressable: {
  width: 24,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
},
winnerSection: {
  alignItems: 'center',
  marginBottom: 24,
  marginHorizontal: -24,
},

winnerHeadline: {
  fontFamily: 'BebasNeue',
  fontSize: 42,
  color: Colors.brown,
  letterSpacing: 2,
  marginBottom: -10,
  marginTop: -8,
},

winnerImage: {
  width: 320,
  height: 180,
  marginTop: -30,


},

winnerName: {
  fontFamily: 'BebasNeue',
  fontSize: 20,
  color: Colors.brown,
  marginTop: 8,
},

winnerSubline: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.red,
  textTransform: 'uppercase',
},
newspaperLine: {
  height: 1,
  backgroundColor: Colors.brown,
  opacity: 0.4,
  width: 320,
  marginVertical: 10,
  marginBottom: -26,
},
doubleLine: {
  width: 320,
  marginVertical: 8,

},

lineThin: {
  height: 1,
  backgroundColor: Colors.brown,
  opacity: 0.4,
  marginVertical: 1,
},
stageNav: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 18,
  marginTop: -50,
},

stageNavSide: {
  minWidth: 88,
  height: 44,
  borderWidth: 1,
  borderColor: '#8c7446',
  borderRadius: 10,

  backgroundColor: '#a34c0e',

  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
},

stageNavCenter: {
  flex: 1,
  alignItems: 'center',
},

stageNavButton: {
  color: Colors.brown,
  fontFamily: 'BebasNeue',
  fontSize: 18,
  letterSpacing: 0.7,
},

stageNavTitle: {
  color: Colors.brown,
  fontFamily: 'BebasNeue',
  fontSize: 34,
  letterSpacing: 1.5,
},

disabledNavButton: {
  opacity: 0.3,
},
});