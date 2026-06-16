import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { SavedGame, getSavedGames, openSavedGame, refreshFollowedGame } from '@/lib/storage';

export default function MyGamesScreen() {
  const [games, setGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    async function loadGames() {
      const savedGames = await getSavedGames();
      setGames(savedGames);
    }

    loadGames();
  }, []);


  return (
    <View style={styles.screen}>
          <Image
            source={require('@/assets/images/background-blackwhite.png')}
            style={styles.watermark}
            resizeMode="cover"
          />
    <ScrollView
  
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Games</Text>

      {games.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No saved games</Text>
          <Text style={styles.cardText}>
            Saved games will appear here.
          </Text>
        </View>
      ) : (
        games.map((game) => (
          <Pressable
  key={game.id}
  style={styles.card}
 onPress={async () => {
  let gameToOpen = game;

  if (game.role === 'follower') {
    gameToOpen = await refreshFollowedGame(game);
  }

  const didOpen = await openSavedGame(gameToOpen.id);

  if (didOpen) {
    router.replace('/(tabs)');
  }
}}>
            <Text style={styles.cardTitle}>{game.name}</Text>
            <Text style={styles.roleText}>
  {game.role === 'admin'
    ? 'Admin'
    : game.role === 'follower'
    ? 'Follower'
    : 'Local'}
</Text>

            <Text style={styles.cardText}>
              Stages completed: {game.gameResults.entries?.length ?? 0}
            </Text>

            <Text style={styles.cardText}>
              Created: {new Date(game.createdAt).toLocaleDateString()}
            </Text>
          </Pressable>
        ))
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
    paddingTop: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    color: Colors.brown,
  },
  watermark: {
  position: 'absolute',
  width: 500,
  height: 700,
  right: -120,
  bottom: 0,
  opacity: 0.2,
},
roleText: {
  marginTop: 4,
  fontSize: 13,
  color: '#777',
  fontWeight: '600',
},
});