import { router, useFocusEffect } from 'expo-router';
import { Alert, Image, ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { useCallback, useEffect, useState } from 'react';
import BackgroundWatermark from '@/components/BackgroundWatermark';

import { getActiveLiveGameSession } from '@/lib/live/activeLiveGame';

import { fetchLiveGame } from '@/lib/live/liveGames';

function formatSpecialRiderName(specialRiderId?: string): string {
  if (!specialRiderId) {
    return 'Normal';
  }

  return specialRiderId
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

export default function EditPlayersScreen() {
 const liveSession =
  getActiveLiveGameSession();

  const [, setRefreshVersion] = useState(0);

const [liveTeamTypes, setLiveTeamTypes] = useState<
  ('human' | 'normal-ai' | 'muscle' | 'peloton')[]
>([]);

useFocusEffect(
  useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, [])
);

useEffect(() => {
  if (!liveSession) return;

  async function loadLiveTeamTypes() {
    try {
      const liveGame = await fetchLiveGame(
        liveSession!.gameId
      );

      if (!liveGame.gameData) return;

      setLiveTeamTypes(
        liveGame.gameData.setup.teamTypes
      );
    } catch (error) {
      console.error(
        'LOAD LIVE TEAM TYPES ERROR',
        error
      );
    }
  }

  void loadLiveTeamTypes();
}, [liveSession?.gameId]);
    return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Players</Text>

      {createGameDraft.playerNames.map((name, index) => {
  const isDummyGame = createGameDraft.companionMode === 'dummy';
  const dummyTeam = isDummyGame
    ? createGameDraft.dummyTeams[index]
    : undefined;

  const teamType = liveSession
  ? liveTeamTypes[index]
  : dummyTeam?.teamType;

  

  const showSpecialRiders = liveSession
  ? teamType === 'human' ||
    teamType === 'normal-ai'
  : !isDummyGame ||
    dummyTeam?.teamType === 'normal-ai' ||
    (dummyTeam?.teamType === 'human' &&
      dummyTeam?.drawMode === 'app-draw');

const rouleurSpecialRiderId = liveSession
  ? createGameDraft.playerRouleurSpecialRiders?.[index]
  : isDummyGame
    ? dummyTeam?.rouleurSpecialRiderId
    : createGameDraft.playerRouleurSpecialRiders?.[index];

const sprinteurSpecialRiderId = liveSession
  ? createGameDraft.playerSprinteurSpecialRiders?.[index]
  : isDummyGame
    ? dummyTeam?.sprinteurSpecialRiderId
    : createGameDraft.playerSprinteurSpecialRiders?.[index];

  return (
    <Pressable
      key={index}
      style={styles.playerRow}
      onPress={() =>
        router.push({
          pathname: '/edit-player',
          params: { playerIndex: String(index) },
        })
      }
    >
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {name || `Player ${index + 1}`}
        </Text>

    {teamType === 'muscle' && (
  <Text>Muscle Team</Text>
)}

{teamType === 'peloton' && (
  <Text>Peloton Team</Text>
)}

        {showSpecialRiders && (
          <>
            <Text style={styles.specialRiderText}>
              Rouleur: {formatSpecialRiderName(
                rouleurSpecialRiderId
              )}
            </Text>

            <Text style={styles.specialRiderText}>
              Sprinteur: {formatSpecialRiderName(
                sprinteurSpecialRiderId
              )}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.playerColor}>
        {createGameDraft.playerColors[index]}
      </Text>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
})}

{createGameDraft.playerNames.length < 6 && (
    <Pressable
      style={styles.addButton}
      onPress={() => {
        Alert.alert(
          'Add player?',
          'Adding a player during an active dummy stage will reset the current stage draw rounds. Do you want to continue?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              style: 'destructive',
              onPress: () =>
                router.push('/add-player'),
            },
          ]
        );
      }}
    >
      <Text style={styles.addButtonText}>
        + Add Player
      </Text>
    </Pressable>
  )}

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
  paddingTop: 10,
  paddingBottom: 40,
},

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  playerRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  playerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  playerColor: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.red,
  },
  arrow: {
  fontSize: 28,
  fontWeight: '900',
  color: Colors.red,
  marginLeft: 10,
},
addButton: {
  backgroundColor: Colors.red,
  padding: 16,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 12,
},

addButtonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},

playerInfo: {
  flex: 1,
},

specialRiderText: {
  fontSize: 14,
  color: Colors.brown,
  marginTop: 4,
},

});