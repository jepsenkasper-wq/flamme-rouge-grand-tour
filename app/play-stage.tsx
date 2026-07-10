import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { getActiveSoloStageState, syncSoloFatigueTransfersFromDecks } from '@/lib/solo/activeSoloStage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

type DrawListItem = {
  id: string;
  teamId: string;
  label: string;
  color: string;
  riderLabel?: 'S' | 'R';
  riderKey?: 'sprinteur' | 'rouleur';
  drawMode: 'human-app' | 'normal-ai' | 'muscle' | 'peloton';
};

function getDrawList(): DrawListItem[] {
  return createGameDraft.dummyTeams.flatMap<DrawListItem>((team) => {
    if (team.teamType === 'human' && team.drawMode !== 'app-draw') {
      return [];
    }

    if (team.teamType === 'peloton') {
      return [
        {
  id: `${team.id}-peloton`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  drawMode: 'peloton',
}
      ];
    }

    return [
      {
  id: `${team.id}-sprinteur`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  riderLabel: 'S',
  riderKey: 'sprinteur',
  drawMode:
    team.teamType === 'human'
      ? 'human-app'
      : team.teamType === 'normal-ai'
      ? 'normal-ai'
      : 'muscle',
},
      {
  id: `${team.id}-rouleur`,
  teamId: team.id,
  label: team.name,
  color: team.color,
  riderLabel: 'R',
  riderKey: 'rouleur',
  drawMode:
    team.teamType === 'human'
      ? 'human-app'
      : team.teamType === 'normal-ai'
      ? 'normal-ai'
      : 'muscle',
},
    ];
  });
}

export default function PlayStageScreen() {
  const drawList = getDrawList();

  const insets = useSafeAreaInsets();

const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <ScrollView
  contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>
          Play Stage {gameState.currentStage}
        </Text>

        {drawList.map((item) => (
          <Pressable
            key={item.id}
            style={styles.row}
 onPress={() => {
  router.push({
    pathname: '/draw',
    params: {
      teamId: item.teamId,
      riderKey: item.riderKey ?? '',
      drawMode: item.drawMode,
    },
  });
}}>
                <Image
  source={riderImages[item.color]}
  style={styles.avatar}
/>
            <View style={styles.rowInfo}>
  <Text style={styles.rowText}>
    {item.label}
    {item.riderLabel ? ` - ${item.riderLabel}` : ''}
  </Text>
</View>

<Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}

        <Pressable
          style={styles.button}
          onPress={() => {
  syncSoloFatigueTransfersFromDecks();

  const soloStage = getActiveSoloStageState();

  stageDraft.initialize(
    createGameDraft.playerNames.length,
    soloStage.fatigueTransfers
  );

  router.push('/enter-stage');
}}>
          <Text style={styles.buttonText}>End Stage</Text>
        </Pressable>

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
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  row: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  arrow: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.red,
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
  rowInfo: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
},

rowText: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
},

avatar: {
  width: 32,
  height: 32,
  marginRight: 12,
},
});