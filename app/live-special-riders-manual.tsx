import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  fetchLivePlayers,
  resetLiveSpecialRiderSetup,
  setLivePlayerSpecialRider,
  setLiveSpecialRiderMode,
  setLiveAISpecialRider,
  updateLiveGamePhase,
  fetchLiveTeams,
  type LivePlayer,
  type LiveTeam,
} from '@/lib/live/liveGames';
import {
  specialRiders,
  type SpecialRiderDefinition,
} from '@/lib/solo/specialRiders';
import { useNavigation } from '@react-navigation/native';

import {
  getLivePlayerIdentity,
} from '@/lib/livePlayerIdentity';

export default function LiveSpecialRidersManualScreen() {
  const params = useLocalSearchParams();

  const gameId = String(params.gameId ?? '');

  const playerId = String(params.playerId ?? '');

  const navigation = useNavigation();

  const allowNavigationRef = useRef(false);

  const [players, setPlayers] = useState<LivePlayer[]>([]);
  const [teams, setTeams] =
  useState<LiveTeam[]>([]);

  const allSpecialRiders =
    Object.values(specialRiders) as SpecialRiderDefinition[];

  const sprinteurSpecialRiders =
    allSpecialRiders.filter(
      (rider) => rider.riderType === 'sprinteur'
    );

  const rouleurSpecialRiders =
    allSpecialRiders.filter(
      (rider) => rider.riderType === 'rouleur'
    );

  useEffect(() => {
  async function loadSetup() {
    try {
      const [
        loadedPlayers,
        loadedTeams,
      ] = await Promise.all([
        fetchLivePlayers(gameId),
        fetchLiveTeams(gameId),
      ]);

      setPlayers(loadedPlayers);
      setTeams(loadedTeams);
    } catch (error) {
      console.error(
        'LOAD MANUAL SPECIAL RIDERS ERROR',
        error
      );

      Alert.alert(
        'Could not load Special Riders',
        'Please try again.'
      );
    }
  }

  if (gameId) {
    loadSetup();
  }
}, [gameId]);

  async function selectRider(
  team: LiveTeam,
  rider: SpecialRiderDefinition
) {
  try {
    if (team.teamType === 'human') {
      if (!team.ownerPlayerId) {
        throw new Error(
          'Human team has no owner player.'
        );
      }

      await setLivePlayerSpecialRider(
        gameId,
        team.ownerPlayerId,
        rider.riderType,
        rider.id
      );

      setPlayers((currentPlayers) =>
        currentPlayers.map((player) => {
          if (player.id !== team.ownerPlayerId) {
            return player;
          }

          if (rider.riderType === 'sprinteur') {
            return {
              ...player,
              sprinteurSpecialRiderId: rider.id,
              sprinteurSpecialRiderSet: true,
            };
          }

          return {
            ...player,
            rouleurSpecialRiderId: rider.id,
            rouleurSpecialRiderSet: true,
          };
        })
      );

      return;
    }

    if (team.teamType === 'normal-ai') {
      const identity =
        await getLivePlayerIdentity(gameId);

      if (!identity) {
        throw new Error(
          'Live player identity not found.'
        );
      }

      await setLiveAISpecialRider(
        gameId,
        identity.playerId,
        identity.playerToken,
        team.id,
        rider.id,
        rider.riderType
      );

      setTeams((currentTeams) =>
        currentTeams.map((currentTeam) => {
          if (currentTeam.id !== team.id) {
            return currentTeam;
          }

          if (rider.riderType === 'sprinteur') {
            return {
  ...currentTeam,
  sprinteurSpecialRiderId: rider.id,
  sprinteurSpecialRiderSet: true,
};
          }

          return {
  ...currentTeam,
  rouleurSpecialRiderId: rider.id,
  rouleurSpecialRiderSet: true,
};
        })
      );
    }
  } catch (error) {
    console.error(
      'MANUAL SPECIAL RIDER PICK ERROR',
      error
    );

    Alert.alert(
      'Could not select rider',
      'Please try again.'
    );
  }
}

  const specialRiderTeams = teams.filter(
  (team) =>
    team.teamType === 'human' ||
    team.teamType === 'normal-ai'
);

  useEffect(() => {
  const unsubscribe = navigation.addListener(
    'beforeRemove',
    (event) => {
        if (allowNavigationRef.current) {
  return;
}
      event.preventDefault();

      async function goBackToSetup() {
  try {
    await resetLiveSpecialRiderSetup(gameId);

    allowNavigationRef.current = true;

    router.replace({
      pathname: '/live-special-riders',
      params: {
        gameId,
        playerId,
      },
    });
  } catch (error) {
    console.error(
      'RESET MANUAL SPECIAL RIDER MODE ERROR',
      error
    );

    Alert.alert(
      'Could not go back',
      'Please try again.'
    );
  }
}

      goBackToSetup();
    }
  );

  return unsubscribe;
}, [navigation, gameId]);

const allTeamsComplete =
  specialRiderTeams.length > 0 &&
  specialRiderTeams.every((team) => {
    if (team.teamType === 'human') {
      const ownerPlayer = players.find(
        (player) =>
          player.id === team.ownerPlayerId
      );

      if (!ownerPlayer) {
        return false;
      }

      return (
        (
          ownerPlayer.sprinteurSpecialRiderSet ||
          !!ownerPlayer.sprinteurSpecialRiderId
        ) &&
        (
          ownerPlayer.rouleurSpecialRiderSet ||
          !!ownerPlayer.rouleurSpecialRiderId
        )
      );
    }

    return (
  team.sprinteurSpecialRiderSet &&
  team.rouleurSpecialRiderSet
);
  });
  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          Manual Special Riders
        </Text>

        <Text style={styles.description}>
          Choose one Sprinteur and one Rouleur Special Rider
          for each player. Duplicate Special Riders are allowed.
        </Text>

       {specialRiderTeams.map((team) => {
  const ownerPlayer = team.ownerPlayerId
    ? players.find(
        (player) => player.id === team.ownerPlayerId
      )
    : undefined;

  const sprinteurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.sprinteurSpecialRiderId
      : team.sprinteurSpecialRiderId;

  const rouleurSpecialRiderId =
    team.teamType === 'human'
      ? ownerPlayer?.rouleurSpecialRiderId
      : team.rouleurSpecialRiderId;

  return (
    <View
      key={team.id}
      style={styles.playerCard}
    >
      <Text style={styles.playerName}>
        {team.name}
        {team.teamType === 'normal-ai'
          ? ' – Normal AI'
          : ''}
      </Text>

      <Text style={styles.riderTypeTitle}>
        Sprinteur
      </Text>

      <Pressable
        style={[
          styles.riderButton,
          styles.noneButton,
          !sprinteurSpecialRiderId &&
            styles.riderButtonSelected,
        ]}
        onPress={async () => {
  if (team.teamType === 'human') {
    if (!team.ownerPlayerId) {
      return;
    }

    await setLivePlayerSpecialRider(
      gameId,
      team.ownerPlayerId,
      'sprinteur',
      null
    );

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === team.ownerPlayerId
          ? {
              ...player,
              sprinteurSpecialRiderId: undefined,
              sprinteurSpecialRiderSet: true,
            }
          : player
      )
    );

    return;
  }

  if (team.teamType === 'normal-ai') {
    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      return;
    }

    await setLiveAISpecialRider(
      gameId,
      identity.playerId,
      identity.playerToken,
      team.id,
      null,
      'sprinteur'
    );

    setTeams((currentTeams) =>
      currentTeams.map((currentTeam) =>
        currentTeam.id === team.id
        ? {
    ...currentTeam,
    sprinteurSpecialRiderId: undefined,
    sprinteurSpecialRiderSet: true,
  }
          : currentTeam
      )
    );
  }
}}      >
        <Text
          style={[
            styles.riderButtonText,
            !sprinteurSpecialRiderId &&
              styles.riderButtonTextSelected,
          ]}
        >
          None
        </Text>
      </Pressable>

      <View style={styles.riderGrid}>
        {sprinteurSpecialRiders.map((rider) => {
          const isSelected =
            sprinteurSpecialRiderId === rider.id;

          return (
            <Pressable
              key={rider.id}
              style={[
                styles.riderButton,
                isSelected &&
                  styles.riderButtonSelected,
              ]}
              onPress={() =>
                selectRider(team, rider)
              }
            >
              <Text
                style={[
                  styles.riderButtonText,
                  isSelected &&
                    styles.riderButtonTextSelected,
                ]}
              >
                {rider.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.riderTypeTitle}>
        Rouleur
      </Text>

      <Pressable
        style={[
          styles.riderButton,
          styles.noneButton,
          !rouleurSpecialRiderId &&
            styles.riderButtonSelected,
        ]}
        onPress={async () => {
  if (team.teamType === 'human') {
    if (!team.ownerPlayerId) {
      return;
    }

    await setLivePlayerSpecialRider(
      gameId,
      team.ownerPlayerId,
      'rouleur',
      null
    );

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === team.ownerPlayerId
          ? {
              ...player,
              rouleurSpecialRiderId: undefined,
              rouleurSpecialRiderSet: true,
            }
          : player
      )
    );

    return;
  }

  if (team.teamType === 'normal-ai') {
    const identity =
      await getLivePlayerIdentity(gameId);

    if (!identity) {
      return;
    }

    await setLiveAISpecialRider(
      gameId,
      identity.playerId,
      identity.playerToken,
      team.id,
      null,
      'rouleur'
    );

    setTeams((currentTeams) =>
      currentTeams.map((currentTeam) =>
        currentTeam.id === team.id
          ? {
    ...currentTeam,
    rouleurSpecialRiderId: undefined,
    rouleurSpecialRiderSet: true,
  }
          : currentTeam
      )
    );
  }
}}
      >
        <Text
          style={[
            styles.riderButtonText,
            !rouleurSpecialRiderId &&
              styles.riderButtonTextSelected,
          ]}
        >
          None
        </Text>
      </Pressable>

      <View style={styles.riderGrid}>
        {rouleurSpecialRiders.map((rider) => {
          const isSelected =
            rouleurSpecialRiderId === rider.id;

          return (
            <Pressable
              key={rider.id}
              style={[
                styles.riderButton,
                isSelected &&
                  styles.riderButtonSelected,
              ]}
              onPress={() =>
                selectRider(team, rider)
              }
            >
              <Text
                style={[
                  styles.riderButtonText,
                  isSelected &&
                    styles.riderButtonTextSelected,
                ]}
              >
                {rider.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
})}

        <Pressable
  style={styles.backButton}
  onPress={() => {
    router.back();
  }}
>
  <Text style={styles.backButtonText}>
    Back to Special Rider Setup
  </Text>
</Pressable>

        <Pressable
          disabled={!allTeamsComplete}
          style={[
            styles.continueButton,
            !allTeamsComplete &&
              styles.continueButtonDisabled,
          ]}
          onPress={async () => {
            try {
              await updateLiveGamePhase(
                gameId,
                'review'
              );

              allowNavigationRef.current = true;

              router.replace({
                pathname: '/live-review-game',
                params: {
  gameId,
  playerId,
},
              });
            } catch (error) {
              console.error(
                'CONTINUE TO REVIEW ERROR',
                error
              );

              Alert.alert(
                'Could not continue',
                'Please try again.'
              );
            }
          }}
        >
          <Text style={styles.continueButtonText}>
            CONTINUE TO REVIEW
          </Text>
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

  scrollView: {
    flex: 1,
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
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.brown,
    marginBottom: 24,
  },

  playerCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
  },

  playerName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },

  riderTypeTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.red,
    marginTop: 8,
    marginBottom: 10,
  },

  riderGrid: {
    gap: 8,
  },

  riderButton: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },

  riderButtonSelected: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },

  riderButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brown,
  },

  riderButtonTextSelected: {
    color: Colors.white,
  },

  backButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.red,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },

  backButtonText: {
    color: Colors.red,
    fontSize: 16,
    fontWeight: '900',
  },

  continueButton: {
    backgroundColor: Colors.red,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  continueButtonDisabled: {
    opacity: 0.4,
  },

  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },
  noneButton: {
  marginBottom: 8,
},
});