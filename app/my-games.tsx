import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  deleteSavedGameById,
  getSavedGames,
  openSavedGame,
  refreshFollowedGame,
} from '@/lib/storage';

import BackgroundWatermark from '@/components/BackgroundWatermark';

import type { SavedGame } from '@/lib/savedGameTypes';

export default function MyGamesScreen() {
  const [games, setGames] = useState<SavedGame[]>([]);

  useEffect(() => {
    async function loadGames() {
      const savedGames = await getSavedGames();
      setGames(savedGames);
    }

      loadGames();
  }, []);
  
    async function handleDeleteGame(game: SavedGame) {
  Alert.alert(
    'Delete game',
    `Are you sure you want to delete "${game.name}"?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const remainingGames = await deleteSavedGameById(game.id);
          setGames(remainingGames);
        },
      },
    ]
  );
}



  return (
    <View style={styles.screen}>
          <BackgroundWatermark />
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
            <Pressable
  style={styles.deleteButton}
  onPress={(event) => {
    event.stopPropagation();
    handleDeleteGame(game);
  }}>
  <Text style={styles.deleteButtonText}>Delete</Text>
</Pressable>
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
 
roleText: {
  marginTop: 4,
  fontSize: 13,
  color: '#777',
  fontWeight: '600',
},
deleteButton: {
  alignSelf: 'flex-end',
  marginTop: 12,
  backgroundColor: Colors.red,
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 12,
},

deleteButtonText: {
  color: Colors.white,
  fontSize: 13,
  fontWeight: '900',
},
});