import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';

export default function SocialPlayScreen() {
  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <Text style={styles.title}>Social Play</Text>

      <Text style={styles.description}>
        Follow an existing Grand Tour or play together in a shared Live Play game.
      </Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push('/follow-game')}
      >
        <Text style={styles.cardTitle}>Follow Game</Text>

        <Text style={styles.cardText}>
          Follow an existing Grand Tour using a follow code.
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push('/live-play')}
      >
        <Text style={styles.cardTitle}>Live Play</Text>

        <Text style={styles.cardText}>
          Play a shared Grand Tour using your own Flamme Rouge board game. Each player uses their own device to draw cards, follow the race and enter results, while the app keeps the game in sync. You can also add dummy teams to race alongside the human players.
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