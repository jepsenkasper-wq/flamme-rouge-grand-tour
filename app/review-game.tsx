import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { gameResults } from '@/lib/gameResults';
import { gameState } from '@/lib/gameState';
import { stageDraft } from '@/lib/stageDraft';
import { saveGame } from '@/lib/storage';
import { saveGameToLibrary } from '@/lib/storage';
import BackgroundWatermark from '@/components/BackgroundWatermark';

function formatSpecialRiderName(
  specialRiderId?: string
): string {
  if (!specialRiderId) {
    return 'Normal';
  }

  return specialRiderId
    .split('-')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

function formatTeamType(teamType: string): string {
  switch (teamType) {
    case 'human':
      return 'Human';

    case 'normal-ai':
      return 'Normal AI';

    case 'muscle':
      return 'Muscle Team';

    case 'peloton':
      return 'Peloton Team';

    default:
      return teamType;
  }
}
function formatDrawMode(drawMode?: string): string {
  switch (drawMode) {
    case 'app-draw':
      return 'App-assisted';

    case 'card-draw':
      return 'Card Draw';

    default:
      return '-';
  }
}

export default function ReviewGameScreen() {
  const playerNames = createGameDraft.playerNames;
  const playerColors = createGameDraft.playerColors;
  const restDayStages = createGameDraft.restDayStages;

  const isDummyGame = createGameDraft.companionMode === 'dummy';
const dummyTeams = createGameDraft.dummyTeams;

  return (
  <View style={styles.screen}>
      <BackgroundWatermark />
    <ScrollView
      contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review Game</Text>

      <Text style={styles.text}>Game name: {createGameDraft.gameName}</Text>
      <Text style={styles.text}>Stages: {createGameDraft.stages}</Text>
      <Text style={styles.text}>Rest days: {createGameDraft.restDays}</Text>

      <Text style={styles.sectionTitle}>
  {isDummyGame ? 'Teams' : 'Players'}
</Text>

{isDummyGame
  ? dummyTeams.map((team, index) => (
      <View key={team.id} style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>
          {index + 1}. {team.name || `Team ${index + 1}`}
        </Text>

        <Text style={styles.text}>Colour: {team.color}</Text>
        <Text style={styles.text}>Type: {formatTeamType(team.teamType)}</Text>

        {team.teamType === 'human' && (
          <Text style={styles.text}>
            Draw mode: {formatDrawMode(team.drawMode)}
          </Text>
        )}

        {(team.teamType === 'normal-ai' ||
          (team.teamType === 'human' &&
            team.drawMode === 'app-draw')) && (
          <>
            <Text style={styles.text}>
              Sprinteur deck: {formatSpecialRiderName(team.sprinteurSpecialRiderId)}
            </Text>

            <Text style={styles.text}>
              Rouleur deck: {formatSpecialRiderName(team.rouleurSpecialRiderId)}
            </Text>
          </>
        )}
      </View>
    ))
  : playerNames.map((name: string, index: number) => (
      <Text key={index} style={styles.text}>
        {index + 1}. {name || `Player ${index + 1}`} ({playerColors[index]})
      </Text>
    ))}

      <Text style={styles.sectionTitle}>Rest Days</Text>

      {restDayStages.map((stage: string, index: number) => (
        <Text key={index} style={styles.text}>
          Rest Day {index + 1}: After Stage {stage || '-'}
        </Text>
      ))}

    <Pressable
  style={styles.button}
onPress={async () => {
  gameResults.entries = [];

  gameState.currentStage = 1;
  gameState.currentEntryType = 'stage';

  stageDraft.initialize(createGameDraft.playerNames.length);

  await saveGameToLibrary();
  await saveGame();

  router.replace('/(tabs)');
}}>
  <Text style={styles.buttonText}>Create Game</Text>
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
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },
  text: {
    fontSize: 18,
    color: Colors.brown,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brown,
    marginTop: 24,
    marginBottom: 12,
  },
  button: {
  backgroundColor: Colors.red,
  padding: 18,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 32,
},

buttonText: {
  color: Colors.white,
  fontSize: 18,
  fontWeight: '900',
},
content: {
  padding: 24,
  paddingTop: 20,
  paddingBottom: 40,
},

reviewCard: {
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
},

reviewTitle: {
  fontSize: 18,
  fontWeight: '900',
  color: Colors.brown,
  marginBottom: 8,
},

});