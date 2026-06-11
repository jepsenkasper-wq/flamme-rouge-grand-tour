import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export default function EditGameScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Edit Game</Text>

      <Pressable
        style={styles.menuButton}
        onPress={() => router.push('/edit-game-settings')}>
        <Text style={styles.menuText}>Game Settings</Text>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.menuButton}
        onPress={() => router.push('/edit-players')}>
        <Text style={styles.menuText}>Players</Text>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      <Pressable
        style={styles.menuButton}
        onPress={() => router.push('/edit-scoring-rules')}>
        <Text style={styles.menuText}>Scoring Rules</Text>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 24,
    paddingTop: 72,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  menuButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },

  arrow: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.red,
  },
});