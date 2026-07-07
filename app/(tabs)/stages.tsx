import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { gameResults } from '@/lib/gameResults';
import BackgroundWatermark from '@/components/BackgroundWatermark';

export default function StagesScreen() {
  return (
    <View style={styles.screen}>
          <BackgroundWatermark />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stages</Text>

      {gameResults.entries.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No stages yet</Text>
          <Text style={styles.cardText}>
            Completed stages will appear here.
          </Text>
        </View>
      ) : (
        gameResults.entries.map((entry, index) => (
          <Pressable
  key={index}
  style={styles.stageRow}
  onPress={() =>
    router.push({
      pathname: '/stage-detail',
      params: {
        entryIndex: String(index),
      },
    })
  }>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.stageText}>
              {entry.entryType === 'restDay'
                ? `Rest Day after Stage ${entry.stageNumber}`
                : `Stage ${entry.stageNumber}`}
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
    paddingTop: 50,
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
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: Colors.brown,
  },
  stageRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.red,
    marginRight: 12,
  },
  stageText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brown,
  },
 
});