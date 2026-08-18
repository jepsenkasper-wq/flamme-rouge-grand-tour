import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { getActiveSoloStageState, syncSoloFatigueTransfersFromDecks } from '@/lib/solo/activeSoloStage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';
import { assignStrategiesForStage } from '@/lib/solo/strategyEngine';

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

function getDrawModeLabel(
  mode: DrawListItem['drawMode']
): string {
  switch (mode) {
    case 'human-app':
      return 'Human (Draw Assist)';
    case 'normal-ai':
      return 'Normal AI';
    case 'muscle':
      return 'Muscle Team';
    case 'peloton':
      return 'Peloton Team';
  }
}

function getCurrentRound(): number {
  return getActiveSoloStageState().round;
}

function canEndRound(): boolean {
  const soloStage = getActiveSoloStageState();

  return soloStage.teams.every((team) => {
    if (team.teamType === 'human' && !team.usesAppDraw) {
      return true;
    }

    const played = team.playedCards ?? {};

    if (team.teamType === 'peloton') {
      return Boolean(played.peloton);
    }

    return Boolean(played.sprinteur && played.rouleur);
  });
}

export default function PlayStageScreen() {
  const [, setRefreshKey] = useState(0);

const [allowIncompleteRound, setAllowIncompleteRound] =
  useState(false);

useFocusEffect(
  useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, [])
);

  const drawList = getDrawList();

  const soloStage = getActiveSoloStageState();
const stageType = soloStage.stageType;

const stageHasStarted =
  soloStage.round > 1 ||
  soloStage.teams.some((team) =>
    Object.values(team.playedCards ?? {}).some(Boolean)
  );

  const insets = useSafeAreaInsets();

const contentStyle = {
  paddingBottom: 40 + insets.bottom,
};

async function endRound() {
  const soloStage = getActiveSoloStageState();

  soloStage.round++;

  for (const team of soloStage.teams) {
    team.playedCards = {};
  }

await saveGame();
await updateActiveSavedGame();

setAllowIncompleteRound(false);

setRefreshKey((c) => c + 1);
}
return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Play Stage {gameState.currentStage}
      </Text>

      {!stageHasStarted && (
        <View style={styles.stageTypeSection}>
          <View style={styles.stageTypeTitleRow}>
  <Text style={styles.stageTypeLabel}>
    Stage Profile
  </Text>

  <Pressable
    onPress={() =>
      Alert.alert(
        'Stage Profile',
        'Choose the profile that best matches the current stage. The selected profile helps the AI adapt its strategy for this stage.\n\n' +
        'Flat\nMostly flat, with few or no significant climbs.\n\n' +
        'Hills\nSeveral shorter climbs and frequent changes in terrain.\n\n' +
        'Mountain\nMultiple and/or long climbs.\n\n' +
        'Cobbles\nCobblestone sections are an important part of the stage.\n\n' +
        'Selecting a profile is optional. If no profile is selected, the AI uses its standard strategy.'
      )
    }>
    <Text style={styles.stageTypeHelp}>?</Text>
  </Pressable>
</View>

          <View style={styles.stageTypeRow}>
            {[
              { key: 'flat', label: 'Flat' },
              { key: 'hilly', label: 'Hills' },
              { key: 'mountain', label: 'Mountain' },
              { key: 'cobbles', label: 'Cobbles' },
            ].map((item) => (
              <Pressable
                key={item.key}
                style={[
                  styles.stageTypeButton,
                  stageType === item.key &&
                    styles.stageTypeButtonActive,
                ]}
                onPress={() => {
                  const isSelected = stageType === item.key;

                  Alert.alert(
                    isSelected
                      ? 'Clear Stage Profile?'
                      : 'Select Stage Profile?',
                    isSelected
                      ? `Remove "${item.label}" and use the standard AI strategy for this stage?`
                      : `Use "${item.label}" as the stage profile? This will affect the AI riders' strategy for this stage.`,
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Confirm',
                      onPress: async () => {
  soloStage.stageType = isSelected
    ? 'standard'
    : (item.key as typeof stageType);

  assignStrategiesForStage(soloStage);

  await saveGame();
  await updateActiveSavedGame();

  setRefreshKey((current) => current + 1);
},
                      },
                    ]
                  );
                }}
              >
                <Text
                  style={[
                    styles.stageTypeButtonText,
                    stageType === item.key &&
                      styles.stageTypeButtonTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

{/*
{stageType !== 'standard' && (
  <View style={styles.strategyDebug}>
    <Text style={styles.strategyDebugTitle}>
      AI Strategy Debug
    </Text>

    {soloStage.teams.map((team, playerIndex) => {
      if (team.teamType !== 'normal-ai') {
        return null;
      }

      const teamName =
        createGameDraft.playerNames[playerIndex] ||
        `Player ${playerIndex + 1}`;

      return (
        <Text
          key={team.teamId}
          style={styles.strategyDebugText}
        >
          {teamName}: S = {team.sprinteur?.strategy ?? '-'} | R ={' '}
          {team.rouleur?.strategy ?? '-'}
        </Text>
      );
    })}
  </View>
)}
*/}

<Text style={styles.roundText}>
  Round {getCurrentRound()}
</Text>

<Text style={styles.roundHint}>
Draw Human teams before dummy teams.
</Text>

        {drawList.map((item) => {
  const soloStage = getActiveSoloStageState();

  const teamState = soloStage.teams.find(
    (team) => team.teamId === item.teamId
  );

  const playedCardKey =
    item.drawMode === 'peloton'
      ? 'peloton'
      : item.riderKey;

  const playedCard = playedCardKey
    ? teamState?.playedCards?.[playedCardKey]
    : undefined;

const isDrawLocked = Boolean(playedCard);

  return (
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

  <Text style={styles.rowSubText}>
  {playedCard
    ? `${getDrawModeLabel(item.drawMode)} • Played: ${playedCard.displayValue}`
    : `${getDrawModeLabel(item.drawMode)} • Round ${getCurrentRound()}`}
</Text>
</View>

<Text style={styles.arrow}>
  {isDrawLocked ? '✓' : '›'}
</Text>
              </Pressable>
  );
})}

<Pressable
  style={styles.incompleteRoundRow}
  onPress={() =>
    setAllowIncompleteRound((current) => !current)
  }>
  <View
    style={[
      styles.incompleteRoundToggle,
      allowIncompleteRound &&
        styles.incompleteRoundToggleActive,
    ]}>
    {allowIncompleteRound && (
      <Text style={styles.incompleteRoundCheck}>✓</Text>
    )}
  </View>

  <Text style={styles.incompleteRoundText}>
    Allow incomplete round
  </Text>
</Pressable>

<Pressable
  style={[
    styles.button,
    !(canEndRound() || allowIncompleteRound) &&
      styles.buttonDisabled,
  ]}
  disabled={!(canEndRound() || allowIncompleteRound)}
  onPress={endRound}>
  <Text style={styles.buttonText}>
    End Round {getCurrentRound()}
  </Text>
</Pressable>

        <Pressable
          style={styles.button}
          onPress={() => {
  syncSoloFatigueTransfersFromDecks();

  const soloStage = getActiveSoloStageState();

stageDraft.initialize(
  createGameDraft.playerNames.length,
  soloStage.fatigueTransfers,
  gameState.currentStage
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
    marginTop: -40,
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
  flexDirection: 'column',
  justifyContent: 'center',
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
rowSubText: {
  fontSize: 13,
  color: Colors.brown,
  marginTop: 2,
},
roundText: {
  textAlign: 'center',
  marginTop: -18,
  marginBottom: 16,
  fontSize: 16,
  fontWeight: '600',
  color: Colors.brown,
},
buttonDisabled: {
  opacity: 0.5,
},
roundHint: {
  fontSize: 13,
  color: '#777',
  textAlign: 'center',
  marginTop: -8,
  marginBottom: 12,
},

incompleteRoundRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16,
  marginBottom: 10,
},

incompleteRoundToggle: {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1,
  borderColor: Colors.border,
  backgroundColor: Colors.card,
  alignItems: 'center',
  justifyContent: 'center',
},

incompleteRoundToggleActive: {
  backgroundColor: Colors.red,
  borderColor: Colors.red,
},

incompleteRoundCheck: {
  color: Colors.white,
  fontSize: 14,
  fontWeight: '900',
},

incompleteRoundText: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},
stageTypeSection: {
  marginBottom: 24,
},

stageTypeLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: Colors.brown,
  marginBottom: 6,
},

stageTypeRow: {
  flexDirection: 'row',
  gap: 6,
},

stageTypeButton: {
  flex: 1,
  paddingVertical: 8,
  paddingHorizontal: 4,
  borderRadius: 10,
  backgroundColor: Colors.red,
  borderWidth: 1,
  borderColor: Colors.red,
  alignItems: 'center',
},

stageTypeButtonActive: {
  opacity: 0.65,
},

stageTypeButtonText: {
  fontSize: 12,
  fontWeight: '700',
  color: Colors.white,
},

stageTypeButtonTextActive: {
  color: Colors.white,
},
stageTypeTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
},

stageTypeHelp: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.red,
  marginTop: -8,
},

strategyDebug: {
  marginBottom: 16,
  padding: 10,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 8,
},

strategyDebugTitle: {
  fontSize: 12,
  fontWeight: '700',
  marginBottom: 4,
},

strategyDebugText: {
  fontSize: 11,
},
});