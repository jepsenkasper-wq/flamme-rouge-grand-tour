import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createGameDraft } from '@/lib/createGameDraft';
import { Colors } from '@/constants/colors';

const PLAYER_COLORS = [
  { name: 'Blue', value: '#2f5fb3' },
  { name: 'White', value: '#f7f1df' },
  { name: 'Green', value: '#2f8a3e' },
  { name: 'Red', value: '#b7372f' },
  { name: 'Black', value: '#222222' },
  { name: 'Pink', value: '#d97aa7' },
];

export default function PlayersScreen() {
  const params = useLocalSearchParams();
  

 const playerCount = Number(createGameDraft.players || 4);

  const [playerNames, setPlayerNames] = useState(
    Array.from({ length: playerCount }, () => '')
  );

    const [playerColors, setPlayerColors] = useState(
  Array.from({ length: playerCount }, (_, index) => PLAYER_COLORS[index].name)
    );

  function updatePlayerName(index: number, value: string) {
    const nextNames = [...playerNames];
    nextNames[index] = value;
    setPlayerNames(nextNames);
  }

  function updatePlayerColor(index: number, colorName: string) {
  const nextColors = [...playerColors];
  nextColors[index] = colorName;
  setPlayerColors(nextColors);
}

  return (
    <View style={styles.screen}>
    <Image
      source={require('@/assets/images/background-blackwhite.png')}
      style={styles.watermark}
      resizeMode="cover"
    />
    <ScrollView contentContainerStyle={styles.content}>
     

      {playerNames.map((name, index) => (
        <View key={index} style={styles.playerCard}>
          <Text style={styles.playerTitle}>Player {index + 1}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(value) => updatePlayerName(index, value)}
            placeholder={`Player ${index + 1}`}
          />

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
  {PLAYER_COLORS.map((color) => {
    const isSelected = playerColors[index] === color.name;
    const isUsedByOtherPlayer = playerColors.some(
      (selectedColor, selectedIndex) =>
        selectedColor === color.name && selectedIndex !== index
    );

    return (
      <Pressable
        key={color.name}
        onPress={() => updatePlayerColor(index, color.name)}
        style={[
          styles.colorCircle,
          { backgroundColor: color.value },
          isSelected && styles.selectedColorCircle,
        ]}
      />
    );
  })}
</View>
        </View> 
      ))}

     <Pressable
  style={styles.button}
  onPress={() => {
    createGameDraft.playerNames = playerNames;
    createGameDraft.playerColors = playerColors;

    router.push('/rest-days');
  }}>
  <Text style={styles.buttonText}>Next</Text>
</Pressable>
      
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },
  playerCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  playerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 16,
  },
  colorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  colorText: {
    color: Colors.brown,
    fontWeight: '800',
  },
  button: {
  backgroundColor: Colors.red,
  padding: 18,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 12,
},

buttonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},
colorRow: {
  flexDirection: 'row',
  gap: 10,
  marginTop: 4,
},

colorCircle: {
  width: 34,
  height: 34,
  borderRadius: 17,
  borderWidth: 1,
  borderColor: Colors.border,
},

selectedColorCircle: {
  borderWidth: 4,
  borderColor: Colors.red,
},

disabledColorCircle: {
  opacity: 0.25,
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