import { router } from 'expo-router';
import { Image, Alert, Pressable, Share, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { deleteActiveSavedGame, unfollowActiveGame } from '@/lib/storage';
import { createRemoteGame } from '@/lib/remoteGames';
import BackgroundWatermark from '@/components/BackgroundWatermark';

import { useEffect, useState } from 'react';
import {
  openSavedGame,
  getActiveSavedGame,
  refreshFollowedGame,
  updateActiveSavedGameMeta,
  importSavedGame,
} from '@/lib/storage';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

export default function MoreScreen() {

  const [activeGameRole, setActiveGameRole] = useState<
    string | undefined
  >();
  const [followCode, setFollowCode] = useState<string | undefined>();
  const [codeCopied, setCodeCopied] = useState(false);

useEffect(() => {
  async function loadRole() {
    const savedGame = await getActiveSavedGame();
    setActiveGameRole(savedGame?.role);
    setFollowCode(savedGame?.followCode);
  }

  loadRole();
}, []);

async function exportActiveGame() {
  const savedGame = await getActiveSavedGame();

  if (!savedGame) {
    Alert.alert('No game found', 'There is no active game to export.');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];

const safeName = savedGame.name
  .trim()
  .replace(/[<>:"/\\|?*]/g, '')
  .replace(/\s+/g, '_');

const fileUri =
  `${FileSystem.documentDirectory}${safeName}_${today}.json`;

   const exportObject = {
  formatVersion: 1,
  app: 'Flamme Rouge Companion',
  exportedAt: new Date().toISOString(),
  game: savedGame,
};

await FileSystem.writeAsStringAsync(
  fileUri,
  JSON.stringify(exportObject, null, 2)
);

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Game',
    });
  } catch {
    Alert.alert('Export failed', 'Unable to export the game.');
  }
}

async function importGame() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

const selectedFile = result.assets[0];

const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);

const parsedData = JSON.parse(fileContent);

if (
  parsedData.app !== 'Flamme Rouge Companion' ||
  parsedData.formatVersion !== 1 ||
  !parsedData.game
) {
  Alert.alert(
    'Invalid file',
    'This does not look like a Flamme Rouge Companion backup file.'
  );
  return;
}

await importSavedGame(parsedData.game);

Alert.alert(
  'Game imported',
  'The game has been imported and added to My Games.'
);
  } catch {
    Alert.alert('Import failed', 'Unable to import the selected file.');
  }
}

async function enableSharing() {
  const savedGame = await getActiveSavedGame();

  if (!savedGame) {
    Alert.alert('No game found', 'There is no active game to share.');
    return;
  }

  try {
    const remoteMeta = await createRemoteGame(savedGame);

    await updateActiveSavedGameMeta({
      role: 'admin',
      remoteId: remoteMeta.remoteId,
      followCode: remoteMeta.followCode,
      adminKey: remoteMeta.adminKey,
    });

    setActiveGameRole('admin');
    setFollowCode(remoteMeta.followCode);

    Alert.alert(
      'Sharing enabled',
      `Follow Code: ${remoteMeta.followCode}`
    );
  } catch {
    Alert.alert('Sharing failed', 'Unable to create a follow code.');
  }
}

  return (
    <View style={styles.screen}>
      
      <BackgroundWatermark />

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
       {/* 
<MoreButton
  title="Solo Test"
  onPress={() => router.push('/solo-test')}
/>

<MoreButton
  title="Special Rider Test"
  onPress={() => router.push('/special-rider-test')}
/>
*/}

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
        <Text style={styles.sectionTitle}>Sharing & Backup</Text>

        <MenuButton
  title="Export Game"
  onPress={exportActiveGame}
/>

<MenuButton
  title="Import Game"
  onPress={importGame}
/>

        {activeGameRole === 'admin' && followCode && (
  <>
    <View style={styles.followCodeBox}>
  <Text style={styles.followCodeLabel}>Follow Code</Text>
  <Text style={styles.followCodeValue}>{followCode}</Text>
</View>

<MenuButton
  title={codeCopied ? 'Copied ✓' : 'Copy Follow Code'}
  onPress={async () => {
   await Clipboard.setStringAsync(followCode);

setCodeCopied(true);

setTimeout(() => {
  setCodeCopied(false);
}, 2000);
  }}
/>
<MenuButton
  title="Share Follow Code"
  onPress={async () => {
    if (!followCode) {
      return;
    }

    await Share.share({
      message: `Follow my Flamme Rouge Grand Tour game with this code: ${followCode}`,
    });
  }}
/>
  </>
)}

{activeGameRole === 'admin' && !followCode && (
  <MenuButton
    title="Enable Sharing"
    onPress={enableSharing}
  />
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

      </View>
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Support</Text>

  <MenuButton
    title="Support Development"
    onPress={() => router.push('/support-development')}
  />
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

content: {
  padding: 24,
  paddingTop: 50,
  paddingBottom: 40,
},

followCodeBox: {
  marginBottom: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: '#7A1D12',
  backgroundColor: 'rgba(243,231,209,0.82)',
  alignItems: 'center',
},

followCodeLabel: {
  fontSize: 13,
  fontWeight: '800',
  color: '#7A1D12',
  letterSpacing: 1,
  textTransform: 'uppercase',
  marginBottom: 4,
},

followCodeValue: {
  fontSize: 28,
  fontWeight: '900',
  color: '#1E232A',
  letterSpacing: 2,
},
});