import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor: '#8F2F23',
      tabBarInactiveTintColor: '#4A3328',

      headerShown: false,
      tabBarButton: HapticTab,

      tabBarStyle: {
        backgroundColor: '#FAF1DE',
        borderTopColor: '#C8A96A',
        borderTopWidth: 1,
        height: 100,
        paddingTop: 8,
        paddingBottom: 8,
      },

      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '800',
      },
    }}
  >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
  <MaterialCommunityIcons
    name="home"
    size={28}
    color={color}
  />
),
        }}
      />

      <Tabs.Screen
        name="standings"
        options={{
          title: 'Standings',
          tabBarIcon: ({ color }) => (
  <MaterialCommunityIcons
    name="trophy-outline"
    size={28}
    color={color}
  />
),
        }}
      />

      <Tabs.Screen
        name="stages"
        options={{
          title: 'Stages',
          tabBarIcon: ({ color }) => (
  <MaterialCommunityIcons
    name="flag-checkered"
    size={28}
    color={color}
  />
),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
         tabBarIcon: ({ color }) => (
  <MaterialCommunityIcons
    name="cog-outline"
    size={28}
    color={color}
  />
),
        }}
      />
    </Tabs>
  );
}



