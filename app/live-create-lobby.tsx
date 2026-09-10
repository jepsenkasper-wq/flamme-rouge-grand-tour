import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { liveGameDraft } from '@/lib/live/liveGameDraft';
import {
  createLiveDummyTeam,
  createLiveGame,
  createLivePlayer,
} from '@/lib/live/liveGames';

import { saveLivePlayerIdentity } from '@/lib/livePlayerIdentity';


type CreatedLiveGame = {
  liveGameId: string;
  joinCode: string;
  adminKey: string;
};

export default function LiveCreateLobbyScreen() {


 useEffect(() => {
  let isMounted = true;

  async function createGame() {
    try {
      const createdGame = await createLiveGame();

      const adminPlayer = await createLivePlayer(
        createdGame.liveGameId,
        liveGameDraft.adminName,
        true
      );

      if (!adminPlayer.playerToken) {
  throw new Error('Live player token is missing.');
}

await saveLivePlayerIdentity({
  gameId: createdGame.liveGameId,
  playerId: adminPlayer.id,
  playerToken: adminPlayer.playerToken,
});

for (const team of liveGameDraft.aiTeams) {
  await createLiveDummyTeam(
    createdGame.liveGameId,
    adminPlayer.id,
    adminPlayer.playerToken,
    team
  );
}

      if (!isMounted) {
        return;
      }

      router.replace({
        pathname: '/live-lobby',
        params: {
          gameId: createdGame.liveGameId,
          playerId: adminPlayer.id,
        },
      });
    } catch (error) {
      console.error('CREATE LIVE GAME ERROR', error);

      if (isMounted) {
        Alert.alert(
          'Could not create game',
          'Please try again.'
        );
      }
    }
  }

  createGame();

  return () => {
    isMounted = false;
  };
}, []);

return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <View style={styles.loading}>
      <ActivityIndicator size="large" />

      <Text style={styles.loadingText}>
        Creating live game...
      </Text>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 50,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 28,
  },

  loading: {
    alignItems: 'center',
    marginTop: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.brown,
  },

});