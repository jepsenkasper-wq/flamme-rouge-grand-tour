import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { saveGame, updateActiveSavedGame } from '@/lib/storage';

export default function AddPlayerScreen() {
  const [name, setName] = useState('');
  const [color, setColor] = useState('Blue');

  return (
    <View style={styles.screen}>
      
      <Image
  source={require('@/assets/images/background-blackwhite.png')}
  style={styles.watermark}
  resizeMode="cover"
/>
      <Text style={styles.title}>Add Player</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>

        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Player name"
        />

        <Text style={styles.label}>Color</Text>

        <View style={styles.colorGrid}>
          {['Blue', 'White', 'Green', 'Red', 'Black', 'Pink'].map(
            (colorOption) => (
              <Pressable
                key={colorOption}
                style={[
                  styles.colorOption,
                  color === colorOption && styles.activeColorOption,
                ]}
                onPress={() => setColor(colorOption)}>
                <Text style={styles.colorOptionText}>{colorOption}</Text>
              </Pressable>
            )
          )}
        </View>

        <Pressable
          style={styles.button}
          onPress={() => {
            if (createGameDraft.playerNames.length >= 6) {
              return;
            }

            createGameDraft.playerNames.push(
              name || `Player ${createGameDraft.playerNames.length + 1}`
            );
            createGameDraft.playerColors.push(color);

            saveGame();
            updateActiveSavedGame();

            router.back();
          }}>
          <Text style={styles.buttonText}>Add Player</Text>
        </Pressable>
      </View>
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

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.red,
    marginBottom: 6,
  },

  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 18,
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  colorOption: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  activeColorOption: {
    borderColor: Colors.red,
    borderWidth: 2,
  },

  colorOptionText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
    watermark: {
  position: 'absolute',
  width: 500,
  height: 700,

  right: -120,
  bottom: 0,

  opacity: 0.2,
},
});