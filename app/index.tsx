import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export default function StartScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>FLAMME ROUGE</Text>
      <Text style={styles.subtitle}>Grand Tour</Text>

      <View style={styles.buttonGroup}>
        <Link href="/create-game" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Create Game</Text>
          </Pressable>
        </Link>

        <Link href="/my-games" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>My Games</Text>
          </Pressable>
        </Link>

        <Link href="/follow-game" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Follow Game</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.brown,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 24,
    color: Colors.red,
    marginTop: 8,
    marginBottom: 48,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  button: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.brown,
    fontSize: 18,
    fontWeight: '800',
  },
});