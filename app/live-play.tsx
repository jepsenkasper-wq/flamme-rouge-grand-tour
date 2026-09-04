import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';

export default function LivePlayScreen() {
  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <Text style={styles.title}>Live Play</Text>

      <Text style={styles.description}>
        Create a new shared game or join an existing game with a join code.
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push('/live-create-game')}
      >
        <Text style={styles.cardTitle}>Create Game</Text>

        <Text style={styles.cardText}>
          Set up a new Live Play game and invite the other players with a join code.
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push('/live-join-game')}
      >
        <Text style={styles.cardTitle}>Join Game</Text>

        <Text style={styles.cardText}>
          Enter a join code and connect to a Live Play game created by another player.
        </Text>
      </Pressable>
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
    marginBottom: 12,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.brown,
    marginBottom: 28,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 8,
  },

  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.brown,
  },
});