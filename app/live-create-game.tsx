import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import {
  liveGameDraft,
  resetLiveGameDraft,
} from '@/lib/live/liveGameDraft';

export default function LiveCreateGameScreen() {
  const [gameName, setGameName] = useState('');
  const [players, setPlayers] = useState('4');
  const [stages, setStages] = useState('21');
  const [restDays, setRestDays] = useState('2');

  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    resetLiveGameDraft();
  }, []);

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <KeyboardAwareScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={120}
        keyboardShouldPersistTaps="handled"
      >
        <BackgroundWatermark />

        <Text style={styles.title}>Create Live Game</Text>

        <Text style={styles.label}>Game Name</Text>
        <TextInput
          style={styles.input}
          value={gameName}
          onChangeText={setGameName}
          placeholder="Grand Tour 2026"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />

        <Text style={styles.label}>Your Name</Text>
<TextInput
  style={styles.input}
  value={adminName}
  onChangeText={setAdminName}
  placeholder="Player name"
/>

        <Text style={styles.label}>Players</Text>
        <TextInput
          style={styles.input}
          value={players}
          onChangeText={setPlayers}
          keyboardType="number-pad"
          maxLength={1}
        />

        <Text style={styles.label}>Stages</Text>
        <TextInput
          style={styles.input}
          value={stages}
          onChangeText={setStages}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Rest Days</Text>
        <TextInput
          style={styles.input}
          value={restDays}
          onChangeText={setRestDays}
          keyboardType="number-pad"
        />

        <Pressable
          style={styles.button}
          onPress={() => {
            Keyboard.dismiss();

            const playerCount = Number(players);
            const stageCount = Number(stages);
            const restDayCount = Number(restDays);

            if (
              !playerCount ||
              playerCount < 2 ||
              playerCount > 6
            ) {
              Alert.alert(
                'Invalid number of players',
                'Please choose between 2 and 6 players.'
              );
              return;
            }

            if (!stageCount || stageCount < 1) {
              Alert.alert(
                'Invalid stages',
                'The game must have at least 1 stage.'
              );
              return;
            }

            if (restDayCount < 0) {
              Alert.alert(
                'Invalid rest days',
                'Rest days cannot be negative.'
              );
              return;
            }

            if (restDayCount > stageCount - 1) {
              Alert.alert(
                'Invalid rest days',
                'You cannot have more rest days than stages minus one.'
              );
              return;
            }

            liveGameDraft.gameName = gameName;
            liveGameDraft.players = players;
            liveGameDraft.stages = stages;
            liveGameDraft.restDays = restDays;
            liveGameDraft.adminName = adminName.trim();

            router.push('/live-rest-days');
          }}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </TouchableWithoutFeedback>
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
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },

  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 18,
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
});