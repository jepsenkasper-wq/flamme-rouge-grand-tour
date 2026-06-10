import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  calculateYellowClassification,
  calculateMountainClassification,
  calculateSprintClassification,
  calculateTeamClassification,
  calculateOverallClassification,
  secondsToTime,
} from '@/lib/classifications';
import { useState } from 'react';

export default function StandingsScreen() {
const [activeTab, setActiveTab] =
  useState<'yellow' | 'mountain' | 'sprint' | 'team' | 'overall'>('yellow');

const yellowClassification = calculateYellowClassification();
const mountainClassification = calculateMountainClassification();
const sprintClassification = calculateSprintClassification();
const teamClassification = calculateTeamClassification();
const overallClassification = calculateOverallClassification();

const activeClassification =
  activeTab === 'yellow'
    ? yellowClassification
    : activeTab === 'mountain'
      ? mountainClassification
      : activeTab === 'sprint'
        ? sprintClassification
        : activeTab === 'team'
          ? teamClassification
          : overallClassification;

const activeTitle =
  activeTab === 'yellow'
    ? 'Yellow Jersey'
    : activeTab === 'mountain'
      ? 'Mountain Classification'
      : activeTab === 'sprint'
        ? 'Sprint Classification'
        : activeTab === 'team'
          ? 'Team Classification'
          : 'Overall Classification';

  return (
    <ScrollView
  style={styles.screen}
  contentContainerStyle={styles.content}>
      <Text style={styles.title}>Standings</Text>

      <View style={styles.tabs}>
  <Pressable onPress={() => setActiveTab('yellow')}>
    <Text style={activeTab === 'yellow' ? styles.activeTab : styles.tab}>
      Yellow
    </Text>
  </Pressable>

  <Pressable onPress={() => setActiveTab('mountain')}>
    <Text style={activeTab === 'mountain' ? styles.activeTab : styles.tab}>
      Mountain
    </Text>
  </Pressable>

  <Pressable onPress={() => setActiveTab('sprint')}>
  <Text style={activeTab === 'sprint' ? styles.activeTab : styles.tab}>
    Sprint
  </Text>
</Pressable>

  <Pressable onPress={() => setActiveTab('team')}>
    <Text style={activeTab === 'team' ? styles.activeTab : styles.tab}>
      Team
    </Text>
  </Pressable>

  <Pressable onPress={() => setActiveTab('overall')}>
  <Text style={activeTab === 'overall' ? styles.activeTab : styles.tab}>
    Overall
  </Text>
</Pressable>
</View>

      <View style={styles.card}>
  <Text style={styles.cardTitle}>{activeTitle}</Text>

{activeClassification.map((rider, index) => (
  <View key={index} style={styles.resultRow}>
    <Text style={styles.position}>{index + 1}</Text>
    <Text style={styles.riderName}>
  {'riderName' in rider ? rider.riderName : rider.playerName}
</Text>

<Text style={styles.time}>
  {activeTab === 'yellow' || activeTab === 'team'
    ? secondsToTime(rider.totalTime)
    : rider.points}
</Text>
  </View>
))}
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4e8c8',
    padding: 24,
    paddingTop: 72,
  },
  content: {
  padding: 24,
  paddingTop: 72,
  paddingBottom: 40,
},
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#3a261f',
    marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  activeTab: {
    backgroundColor: '#d9a441',
    color: '#3a261f',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '800',
  },
  tab: {
    backgroundColor: '#fff6dc',
    color: '#5c4a3f',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#c8a96a',
  },
  card: {
    backgroundColor: '#fff6dc',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#c8a96a',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3a261f',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#5c4a3f',
  },
  resultRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},

position: {
  width: 32,
  fontSize: 18,
  fontWeight: '900',
  color: Colors.red,
},

riderName: {
  flex: 1,
  fontSize: 16,
  fontWeight: '800',
  color: Colors.brown,
},

time: {
  fontSize: 16,
  fontWeight: '900',
  color: Colors.brown,
},
});