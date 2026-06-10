import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { loadGame } from '@/lib/storage';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  useEffect(() => {
  loadGame();
}, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-game" options={{ title: 'Create Game' }} />
        <Stack.Screen name="players" options={{ title: 'Players' }} />
        <Stack.Screen name="rest-days" options={{ title: 'Rest Days' }} />
        <Stack.Screen name="review-game" options={{ title: 'Review Game' }} />
        <Stack.Screen name="enter-stage" options={{ title: 'Enter Stage' }} />
        <Stack.Screen name="player-entry" options={{ title: 'Player Entry' }} />
        <Stack.Screen name="stage-detail" options={{ title: 'Stage Details' }} />
        <Stack.Screen name="my-games" options={{ title: 'My Games' }} />
        <Stack.Screen name="follow-game" options={{ title: 'Follow Game' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}