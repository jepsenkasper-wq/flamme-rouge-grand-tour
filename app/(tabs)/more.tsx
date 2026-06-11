import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { deleteActiveSavedGame } from '@/lib/storage';

export default function MoreScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>More</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game</Text>

        <MenuButton
          title="Create New Game"
          onPress={() => router.push('/create-game')}
        />

        <MenuButton
          title="My Games"
          onPress={() => router.push('/my-games')}
        />

        <MenuButton
  title="Edit Game"
  onPress={() => router.push('/edit-game')}
/>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sharing</Text>

        <MenuButton
          title="Create Follow Code"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
     

        <MenuButton
  title="Delete Game"
  danger
  onPress={() => {
    Alert.alert(
      'Delete game?',
      'This will permanently delete the current game.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const remainingGames = await deleteActiveSavedGame();

            if (remainingGames.length > 0) {
              router.replace('/my-games');
            } else {
              router.replace('/');
            }
          },
        },
      ]
    );
  }}
/>
      </View>
    </View>
  );
}

function MenuButton({
  title,
  onPress,
  danger = false,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.menuButton, danger && styles.dangerButton]}
      onPress={onPress}>
      <Text style={[styles.menuButtonText, danger && styles.dangerText]}>
        {title}
      </Text>
      <Text style={[styles.arrow, danger && styles.dangerText]}>›</Text>
    </Pressable>
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

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.red,
    marginBottom: 10,
  },

  menuButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButtonText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.brown,
  },

  arrow: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.red,
  },

  dangerButton: {
    borderColor: Colors.red,
  },

  dangerText: {
    color: Colors.red,
  },
});