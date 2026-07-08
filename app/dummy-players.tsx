import { router } from 'expo-router';
import {
  Pressable,
  Alert, 
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BackgroundWatermark from '@/components/BackgroundWatermark';
import { Colors } from '@/constants/colors';
import { createGameDraft } from '@/lib/createGameDraft';
import { useState } from 'react';
import type { SpecialRiderId } from '@/lib/solo/specialRiders';

const PLAYER_COLORS = [
  { name: 'Blue', value: '#2f5fb3' },
  { name: 'White', value: '#f7f1df' },
  { name: 'Green', value: '#2f8a3e' },
  { name: 'Red', value: '#b7372f' },
  { name: 'Black', value: '#222222' },
  { name: 'Pink', value: '#d97aa7' },
];

const SPRINTEUR_DECKS: {
  label: string;
  value: SpecialRiderId | undefined;
}[] = [
  { label: 'Normal', value: undefined },
  { label: 'Descender', value: 'descender' },
  { label: 'Mountaineer', value: 'mountaineer' },
  { label: 'Polyvalent', value: 'polyvalent' },
  { label: 'Squirrel', value: 'squirrel' },
  { label: 'Super Sprinteur', value: 'super-sprinteur' },
  { label: 'Flahute', value: 'flahute' },
];

const ROULEUR_DECKS: {
  label: string;
  value: SpecialRiderId | undefined;
}[] = [
  { label: 'Normal', value: undefined },
  { label: 'Baroudeur', value: 'baroudeur' },
  { label: 'Flandrien', value: 'flandrien' },
  { label: 'Grimpeur', value: 'grimpeur' },
  { label: 'Domestique', value: 'domestique' },
  { label: 'Super Rouleur', value: 'super-rouleur' },
  { label: 'Puncheur', value: 'puncheur' },
];

export default function DummyPlayersScreen() {

const teamCount = Number(createGameDraft.players) || 1;

if (createGameDraft.dummyTeams.length !== teamCount) {
  createGameDraft.dummyTeams = Array.from({ length: teamCount }).map(
    (_, index) => ({
      id: `team-${index + 1}`,
      name: `Team ${index + 1}`,
      color: PLAYER_COLORS[index]?.name ?? '',
      teamType: 'human',
      drawMode: 'card-draw',
    })
  );
}

const [teams, setTeams] = useState(createGameDraft.dummyTeams);
const [expandedTeam, setExpandedTeam] = useState<number | null>(0);

return (
  <View style={styles.screen}>
    <BackgroundWatermark />

    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Teams</Text>

      {teams.map((team, index) => (
        <Pressable
          key={team.id}
          style={styles.card}
          onPress={() =>
            setExpandedTeam(
              expandedTeam === index ? null : index
            )
          }>

          <View style={styles.cardHeader}>
  <View style={styles.cardInfo}>
    <Text style={styles.cardTitle}>
      {team.name}
    </Text>

    <Text style={styles.cardSubtitle}>
      Tap to configure
    </Text>
  </View>

  <Text style={styles.arrow}>
    {expandedTeam === index ? '▲' : '▼'}
  </Text>
</View>

          {expandedTeam === index && (
            <View style={styles.expanded}>
              <Text style={styles.label}>Player Name</Text>

<TextInput
  style={styles.input}
  value={team.name}
  onChangeText={(text) => {
    const nextTeams = [...teams];

    nextTeams[index] = {
      ...nextTeams[index],
      name: text,
    };

    setTeams(nextTeams);
    createGameDraft.dummyTeams = nextTeams;
  }}
/>

<Text style={styles.label}>Team Colour</Text>

<View style={styles.colorRow}>
  {PLAYER_COLORS.map((color) => {
    const isSelected = team.color === color.name;

    return (
      <Pressable
        key={color.name}
        onPress={() => {
          const nextTeams = [...teams];

          nextTeams[index] = {
            ...nextTeams[index],
            color: color.name,
          };

          setTeams(nextTeams);
          createGameDraft.dummyTeams = nextTeams;
        }}
        style={[
          styles.colorCircle,
          { backgroundColor: color.value },
          isSelected && styles.selectedColorCircle,
        ]}
      />
    );
  })}
</View>

<View style={styles.labelRow}>
  <Text style={styles.label}>Team Type</Text>

  <Pressable
    onPress={() =>
      Alert.alert(
        'Team Types',
        'Human\nA human player controls the team. Supports both physical card draw and app-assisted card draw\n\n' +
          'Normal AI\nPlays with the same deck mechanics as a human player, including fatigue cards, Special Riders and tactical card choices, creating an experience that closely resembles playing against another person.\n\n' +
          'Muscle Team\nUses the Muscle Team rules from the Flamme Rouge Peloton expansion.\n\n' +
          'Peloton Team\nUses the Peloton Team rules from the Flamme Rouge Peloton expansion.'
      )
    }>
    <Text style={styles.help}>?</Text>
  </Pressable>
</View>

<View style={styles.optionRow}>
  {[
    { label: 'Human', value: 'human' },
    { label: 'Normal AI', value: 'normal-ai' },
    { label: 'Muscle', value: 'muscle' },
    { label: 'Peloton', value: 'peloton' },
  ].map((option) => (
    <Pressable
      key={option.value}
      style={[
        styles.optionButton,
        team.teamType === option.value && styles.optionButtonActive,
      ]}
      onPress={() => {
        const nextTeams = [...teams];

        nextTeams[index] = {
          ...nextTeams[index],
          teamType: option.value as typeof team.teamType,
        };

        setTeams(nextTeams);
        createGameDraft.dummyTeams = nextTeams;
      }}>
      <Text
        style={[
          styles.optionText,
          team.teamType === option.value && styles.optionTextActive,
        ]}>
        {option.label}
      </Text>
    </Pressable>
  ))}
</View>

{team.teamType === 'human' && (
  <>
    <View style={styles.labelRow}>
      <Text style={styles.label}>Draw Mode</Text>

      <Pressable
        onPress={() =>
          Alert.alert(
            'Draw Mode',
            'Card Draw\nDraw and play physical cards as in the original board game.\n\n' +
              'App-assisted Draw\nThe app manages the rider\'s deck, fatigue cards and reshuffling. You choose which of the four drawn cards to play.'
          )
        }>
        <Text style={styles.help}>?</Text>
      </Pressable>
    </View>

    <View style={styles.optionRow}>
      {[
        { label: 'Card Draw', value: 'card-draw' },
        { label: 'App-assisted', value: 'app-draw' },
      ].map((option) => (
        <Pressable
          key={option.value}
          style={[
            styles.optionButton,
            team.drawMode === option.value &&
              styles.optionButtonActive,
          ]}
          onPress={() => {
            const nextTeams = [...teams];

            nextTeams[index] = {
              ...nextTeams[index],
              drawMode:
                option.value as typeof team.drawMode,
            };

            setTeams(nextTeams);
            createGameDraft.dummyTeams = nextTeams;
          }}>
          <Text
            style={[
              styles.optionText,
              team.drawMode === option.value &&
                styles.optionTextActive,
            ]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </>
)}

{(team.teamType === 'normal-ai' ||
  (team.teamType === 'human' &&
    team.drawMode === 'app-draw')) && (
  <>
    <Text style={styles.label}>Sprinteur Deck</Text>

    <View style={styles.optionRow}>
      {SPRINTEUR_DECKS.map((deck) => (
        <Pressable
          key={deck.label}
          style={[
            styles.optionButton,
            team.sprinteurSpecialRiderId === deck.value &&
              styles.optionButtonActive,
          ]}
          onPress={() => {
            const nextTeams = [...teams];

            nextTeams[index] = {
              ...nextTeams[index],
              sprinteurSpecialRiderId: deck.value,
            };

            setTeams(nextTeams);
            createGameDraft.dummyTeams = nextTeams;
          }}>
          <Text
            style={[
              styles.optionText,
              team.sprinteurSpecialRiderId === deck.value &&
                styles.optionTextActive,
            ]}>
            {deck.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </>
)}

{(team.teamType === 'normal-ai' ||
  (team.teamType === 'human' &&
    team.drawMode === 'app-draw')) && (
  <>
    <Text style={styles.label}>Rouleur Deck</Text>

    <View style={styles.optionRow}>
      {ROULEUR_DECKS.map((deck) => (
        <Pressable
          key={deck.label}
          style={[
            styles.optionButton,
            team.rouleurSpecialRiderId === deck.value &&
              styles.optionButtonActive,
          ]}
          onPress={() => {
            const nextTeams = [...teams];

            nextTeams[index] = {
              ...nextTeams[index],
              rouleurSpecialRiderId: deck.value,
            };

            setTeams(nextTeams);
            createGameDraft.dummyTeams = nextTeams;
          }}>
          <Text
            style={[
              styles.optionText,
              team.rouleurSpecialRiderId === deck.value &&
                styles.optionTextActive,
            ]}>
            {deck.label}
          </Text>
        </Pressable>
      ))}
    </View>
  </>
)}

            </View>
          )}

        </Pressable>
      ))}

      <Pressable
  style={styles.button}
  onPress={() => {
    createGameDraft.companionMode = 'dummy';
    createGameDraft.dummyTeams = teams;

    createGameDraft.playerNames = teams.map((team) => team.name);
    createGameDraft.playerColors = teams.map((team) => team.color);

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
    padding: 24,
    paddingTop: 50,
  },
  
  content: {
  paddingBottom: 40,
},

  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brown,
    marginBottom: 8,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.brown,
    marginBottom: 16,
  },

  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.brown,
    marginBottom: 16,
  },

  placeholder: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brown,
    marginBottom: 4,
  },

  button: {
    backgroundColor: Colors.red,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },

  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900',
  },

  expanded: {
  marginTop: 16,
},
optionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 16,
},

optionButton: {
  backgroundColor: Colors.paper,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 12,
},

optionButtonActive: {
  backgroundColor: Colors.red,
  borderColor: Colors.red,
},

optionText: {
  fontSize: 14,
  fontWeight: '800',
  color: Colors.brown,
},

optionTextActive: {
  color: Colors.white,
},
labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

help: {
  marginLeft: 8,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: Colors.red,
  color: Colors.white,
  textAlign: 'center',
  fontSize: 14,
  fontWeight: '900',
  overflow: 'hidden',
},

colorRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 18,
},

colorCircle: {
  width: 30,
  height: 30,
  borderRadius: 15,
  borderWidth: 1,
  borderColor: Colors.border,
},

selectedColorCircle: {
  borderWidth: 3,
  borderColor: Colors.red,
},

cardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
},

cardInfo: {
  flex: 1,
},

cardSubtitle: {
  fontSize: 13,
  color: Colors.brown,
  opacity: 0.7,
  marginTop: 2,
},

arrow: {
  fontSize: 22,
  fontWeight: '900',
  color: Colors.red,
},

});