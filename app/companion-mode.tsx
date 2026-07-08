import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import BackgroundWatermark from '@/components/BackgroundWatermark';
import { router } from 'expo-router';
import { createGameDraft } from '@/lib/createGameDraft';

export default function CompanionModeScreen() {
  return (
    <View style={styles.screen}>
      <BackgroundWatermark />

      <Text style={styles.title}>Companion Mode</Text>

      <Pressable
  style={styles.card}
  onPress={() => {
    createGameDraft.companionMode = 'normal';
    router.push('/players');
  }}>
        <Text style={styles.cardTitle}>Normal Companion</Text>

        <Text style={styles.cardText}>
          The classic Companion experience.
          {"\n"}
          All players draw their own cards.
        </Text>
      </Pressable>

      <Pressable
  style={styles.card}
  onPress={() => {
    createGameDraft.companionMode = 'dummy';
    router.push('/dummy-players');
  }}>
        <Text style={styles.cardTitle}>Dummy Companion</Text>

        <Text style={styles.cardText}>
          Supports dummy teams and
          app-assisted card drawing.
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