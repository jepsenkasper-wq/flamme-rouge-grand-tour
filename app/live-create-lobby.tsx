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
  createLiveGame,
  createLivePlayer,
} from '@/lib/live/liveGames';

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