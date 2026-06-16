import { router } from 'expo-router';
import { Image, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { deleteActiveSavedGame, unfollowActiveGame } from '@/lib/storage';
import { createRemoteGame } from '@/lib/remoteGames';

import { useEffect, useState } from 'react';
import {
  openSavedGame,
  getActiveSavedGame,
  refreshFollowedGame,
  updateActiveSavedGameMeta,
} from '@/lib/storage';
import * as Clipboard from 'expo-clipboard';

export default function MoreScreen() {

  const [activeGameRole, setActiveGameRole] = useState<
    string | undefined
  >();
  const [followCode, setFollowCode] = useState<string | undefined>();

useEffect(() => {
  async function loadRole() {
    const savedGame = await getActiveSavedGame();
    setActiveGameRole(savedGame?.role);
    setFollowCode(savedGame?.followCode);
  }

  loadRole();
}, []);

  return (
    <View style={styles.screen}>
      
      <Image
  source={require('@/assets/images/background-blackwhite.png')}
  style={styles.watermark}
  resizeMode="cover"
/>
<ScrollView
  contentContainerStyle={styles.content}
  showsVerticalScrollIndicator={false}
>
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

        {activeGameRole !== 'follower' && (
  <MenuButton
    title="Edit Game"
    onPress={() => router.push('/edit-game')}
  />
)}
<MenuButton
  title="Tour Points Overview"
  onPress={() => router.push('/tour-points-overview')}
/>

      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sharing</Text>

        {activeGameRole === 'admin' && followCode && (
  <>
    <Text style={styles.followCodeText}>
      Follow Code: {followCode}
    </Text>

    <MenuButton
      title="Copy Follow Code"
      onPress={async () => {
        await Clipboard.setStringAsync(followCode);
        Alert.alert('Copied', `Follow code ${followCode} copied.`);
      }}
    />
  </>
)}

        {activeGameRole === 'follower' && (
  <MenuButton
    title="Unfollow Game"
    danger
    onPress={() => {
      Alert.alert(
        'Unfollow game?',
        'This will remove the followed game from this device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: async () => {
              const remainingGames = await unfollowActiveGame();

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
)}

   {activeGameRole !== 'follower' && (
  <MenuButton
    title="Create Follow Code"
    onPress={async () => {
    try {
      const savedGame = await getActiveSavedGame();

      if (!savedGame) {
        Alert.alert('Error', 'No active game found.');
        return;
      }
      if (savedGame.followCode) {
  Alert.alert(
    'Follow Code',
    `Code: ${savedGame.followCode}`
  );
  return;
}

      const result = await createRemoteGame(savedGame);

      await updateActiveSavedGameMeta({
        role: 'admin',
        remoteId: result.remoteId,
        followCode: result.followCode,
        adminKey: result.adminKey,
      });

      setActiveGameRole('admin');
setFollowCode(result.followCode);

      Alert.alert(
        'Follow Code Created',
        `Code: ${result.followCode}`
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to create follow code.'
      );
    }
  }}
/>
   )}
      </View>

      <View style={styles.section}>
     
{activeGameRole !== 'follower' && (
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
)}
      </View>
      </ScrollView>
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
watermark: {
  position: 'absolute',
  width: 500,
  height: 700,

  right: -120,
  bottom: 0,

  opacity: 0.2,
},
content: {
  padding: 24,
  paddingTop: 50,
  paddingBottom: 40,
},
followCodeText: {
  marginBottom: 10,
  fontSize: 16,
  fontWeight: '800',
  color: '#1E232A',
  textAlign: 'center',
},
});