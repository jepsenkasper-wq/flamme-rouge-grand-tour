import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/colors';
import {
  calculateYellowClassification,
  calculateMountainClassification,
  calculateSprintClassification,
  calculateTeamClassification,
  calculateOverallClassification,
  secondsToTime,
} from '@/lib/classifications';
import { createGameDraft } from '@/lib/createGameDraft';

const headerImages = {
  yellow: require('@/assets/images/header/yellow-header.png'),
  mountain: require('@/assets/images/header/mountain-header.png'),
  sprint: require('@/assets/images/header/sprint-header.png'),
  team: require('@/assets/images/header/team-header.png'),
};

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};

function formatStandingName(name: string) {
  return name
    .replace(' - Sprinteur', ' - S')
    .replace(' - Rouleur', ' - R');
}
export default function StandingsScreen() {

  const { width } = useWindowDimensions();
const isTablet = width >= 700;

  const [, setRefreshVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshVersion((version) => version + 1);
    }, [])
  );

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
  function getRiderImageFromName(name?: string) {
  if (!name) return riderImages.Blue;

  const playerName = 'riderName' in activeClassification[0]
    ? name.replace(' - Sprinteur', '').replace(' - Rouleur', '')
    : name;

  const playerIndex = createGameDraft.playerNames.findIndex(
    (player) => player === playerName
  );

  if (playerIndex === -1) return riderImages.Blue;

  return riderImages[createGameDraft.playerColors[playerIndex]];
}

  return (

  <View style={styles.screen}>

 <ImageBackground
  source={
    activeTab === 'overall'
      ? headerImages.yellow
      : headerImages[activeTab]
  }
  style={[
  styles.headerBackground,
  isTablet && styles.tabletHeaderBackground,
]}
  resizeMode="cover"
/>  

      <View style={styles.tabs}>
 <Pressable
  style={[
    styles.tabButton,
    activeTab === 'yellow' && styles.activeTabButton,
  ]}
  onPress={() => setActiveTab('yellow')}
>
  <Image
    source={require('@/assets/images/jerseys/yellow-jersey.png')}
    style={styles.tabJersey}
  />

  <Text style={styles.tabText}>
    Yellow
  </Text>
</Pressable>

<Pressable
  style={[
    styles.tabButton,
    activeTab === 'mountain' && styles.activeTabButton,
  ]}
  onPress={() => setActiveTab('mountain')}
>
  <Image
    source={require('@/assets/images/jerseys/mountain-jersey.png')}
    style={styles.tabJersey}
  />

  <Text style={styles.tabText}>Mountain</Text>
</Pressable>

<Pressable
  style={[
    styles.tabButton,
    activeTab === 'sprint' && styles.activeTabButton,
  ]}
  onPress={() => setActiveTab('sprint')}
>
  <Image
    source={require('@/assets/images/jerseys/sprint-jersey.png')}
    style={styles.tabJersey}
  />

  <Text style={styles.tabText}>Sprint</Text>
</Pressable>

<Pressable
  style={[
    styles.tabButton,
    styles.lastTabButton,
    activeTab === 'team' && styles.activeTabButton,
  ]}
  onPress={() => setActiveTab('team')}
>
  <Image
    source={require('@/assets/images/jerseys/team-jersey.png')}
    style={styles.tabJersey}
  />

  <Text style={styles.tabText}>Team</Text>
</Pressable>


</View>

<ScrollView
  style={styles.listContainer}
  contentContainerStyle={styles.listContent}
>
      <View style={styles.card}>
  

{activeClassification.map((rider, index) => (
  <View key={index} style={styles.resultRow}>
    <Text style={styles.position}>{index + 1}</Text>
    <Image
  source={getRiderImageFromName(
    'riderName' in rider ? rider.riderName : rider.playerName
  )}
  style={styles.riderAvatar}
/>

<Text style={styles.riderName}>
  {formatStandingName(
    'riderName' in rider ? rider.riderName : rider.playerName
  )}
</Text>

<Text style={styles.time}>
  {activeTab === 'yellow' || activeTab === 'team'
    ? index === 0
      ? secondsToTime(rider.totalTime)
      : `+${secondsToTime(
          rider.totalTime - activeClassification[0].totalTime
        )}`
    : `${rider.points} pts`}
</Text>
  </View>
))}
</View>
    </ScrollView>
   </View> 
  );
}

const styles = StyleSheet.create({
 screen: {
  flex: 1,
  backgroundColor: '#f4e8c8',
  paddingTop: 56,
},

content: {
  paddingHorizontal: 20,
  paddingBottom: 40,
},
  title: {
  fontFamily: 'BebasNeue',
  fontSize: 38,
  color: '#2A241C',
  textAlign: 'center',
  letterSpacing: 1.5,
  marginBottom: 18,
},
tabs: {
  flexDirection: 'row',
  borderWidth: 1,
  borderColor: '#c8a96a',
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 20,
  marginHorizontal: 10,
},

tabButton: {
  flex: 1,
  borderRightWidth: 1,
  borderRightColor: '#c8a96a',
},
lastTabButton: {
  borderRightWidth: 0,
},
  card: {
  backgroundColor: 'transparent',
  borderRadius: 0,
  padding: 0,
  borderWidth: 0,
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
headerBackground: {
  height: 120,
  marginHorizontal: 10,
  paddingHorizontal: 80,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 14,
},

headerTitle: {
  fontFamily: 'BebasNeue',
  fontSize: 34,
  color: '#2A241C',
  textAlign: 'center',
  letterSpacing: 1.5,
},
riderAvatar: {
  width: 30,
  height: 30,
  marginRight: 8,
},
tabContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
},
tabJersey: {
  width: 22,
  height: 22,
},
tabButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  paddingVertical: 10,
  borderRightWidth: 1,
  borderRightColor: '#c8a96a',
  backgroundColor: 'rgba(250, 241, 222, 0.72)',
},

activeTabButton: {
  backgroundColor: '#D4A235',
},

tabText: {
  fontFamily: 'BebasNeue',
  fontSize: 16,
  color: '#2A241C',
  letterSpacing: 0.5,
},

tabJersey: {
  width: 20,
  height: 20,
},
lastTabButton: {
  borderRightWidth: 0,
},
listContainer: {
  flex: 1,
},

listContent: {
  paddingHorizontal: 20,
  paddingBottom: 40,
},
tabletHeaderBackground: {
    width: '100%',
    height: 200,
    maxWidth: 650,
    alignSelf: 'center',
}

});