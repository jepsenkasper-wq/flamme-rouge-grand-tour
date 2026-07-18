import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

import {
  calculateTourAwards,
  TourAwardId
} from '@/lib/tourReview/tourAwards';

import { createGameDraft } from '@/lib/createGameDraft';
import {
  calculateTourChampions,
} from '@/lib/tourChampions';

type TeamColor =
  | 'Blue'
  | 'Red'
  | 'Green'
  | 'White'
  | 'Pink'
  | 'Black';

type WinnerCardProps = {
  title: string;
  winnerName: string;
  result: string;
  image: number;
  hero?: boolean;
};

const riderImages: Record<string, any> = {
  Blue: require('@/assets/images/riders/rider-blue.png'),
  White: require('@/assets/images/riders/rider-white.png'),
  Green: require('@/assets/images/riders/rider-green.png'),
  Red: require('@/assets/images/riders/rider-red.png'),
  Black: require('@/assets/images/riders/rider-black.png'),
  Pink: require('@/assets/images/riders/rider-pink.png'),
};


function getTeamWinnerImage(color: TeamColor) {
  switch (color) {
    case 'Blue':
      return require('@/assets/images/tour-review/team-blue.png');

    case 'Red':
      return require('@/assets/images/tour-review/team-red.png');

    case 'Green':
      return require('@/assets/images/tour-review/team-green.png');

    case 'White':
      return require('@/assets/images/tour-review/team-white.png');

    case 'Pink':
      return require('@/assets/images/tour-review/team-pink.png');

    case 'Black':
      return require('@/assets/images/tour-review/team-black.png');

    default:
      return require('@/assets/images/tour-review/team-blue.png');
  }
}

function WinnerCard({
  title,
  winnerName,
  result,
  image,
  hero = false,
}: WinnerCardProps) {
  return (
    <View style={[styles.winnerCard, hero && styles.heroCard]}>
      <Image
  source={image}
  style={styles.winnerImage}
  resizeMode="contain"
/>

      <View
        style={[
          styles.winnerContent,
          hero && styles.heroContent,
        ]}>
        <Text
          style={[
            styles.winnerTitle,
            hero && styles.heroWinnerTitle,
          ]}>
          {title}
        </Text>

        <Text
          style={[
            styles.winnerName,
            hero && styles.heroWinnerName,
          ]}>
          {winnerName}
        </Text>

        <Text style={styles.winnerResult}>
          {result}
        </Text>
      </View>
    </View>
  );
}

export function TourReviewContent() {
  // Midlertidige dummydata.
  // Vi kobler rigtige vindere og farver på senere.
  const {
  overallWinner,
  yellowWinner,
  overallStandings,
  mountainWinner,
  sprintWinner,
  teamWinner,
} = calculateTourChampions();

  const playerNames = createGameDraft.playerNames;
const playerColors = createGameDraft.playerColors;

function getRiderImage(riderName?: string) {
  if (!riderName) {
    return riderImages.Blue;
  }

  const playerIndex = playerNames.findIndex((playerName) =>
    riderName.startsWith(playerName)
  );

  if (playerIndex === -1) {
    return riderImages.Blue;
  }

  const playerColor = playerColors[playerIndex];

  return riderImages[playerColor] ?? riderImages.Blue;
}

 const awards = calculateTourAwards();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          TOUR COMPLETE
        </Text>

        <Text style={styles.title}>
          Tour Review
        </Text>

        <Text style={styles.subtitle}>
          The champions and defining performances of the Tour
        </Text>
      </View>

      <View style={styles.overallWinner}>
  <Text style={styles.overallWinnerTitle}>
    Overall Winner
  </Text>

  <Image
    source={getTeamWinnerImage(overallWinner.color)}
    style={styles.overallWinnerImage}
    resizeMode="contain"
  />

  <Text style={styles.overallWinnerName}>
    {overallWinner.name}
  </Text>

  <Text style={styles.overallWinnerResult}>
    {overallWinner.result}
  </Text>
</View>


{overallStandings.slice(1).map((player, index) => (
  <View
    key={player.playerName}
    style={styles.standingRow}>
    <Text style={styles.standingPosition}>
      {index + 2}.
    </Text>

    <Text style={styles.standingName}>
      {player.playerName}
    </Text>

    <Text style={styles.standingPoints}>
      {player.points} pts
    </Text>
  </View>
))}

      <Text style={styles.sectionTitle}>
        Classification Champions
      </Text>

      <WinnerCard
        title="Yellow Jersey"
        winnerName={yellowWinner.name}
        result={yellowWinner.result}
        image={require('@/assets/images/tour-review/yellow-winner.png')}
      />

      <WinnerCard
        title="Mountain Classification"
        winnerName={mountainWinner.name}
        result={mountainWinner.result}
        image={require('@/assets/images/tour-review/mountain-winner.png')}
      />

      <WinnerCard
        title="Sprint Classification"
        winnerName={sprintWinner.name}
        result={sprintWinner.result}
        image={require('@/assets/images/tour-review/sprint-winner.png')}
      />

      <WinnerCard
        title="Team Classification"
        winnerName={teamWinner.name}
        result={teamWinner.result}
        image={getTeamWinnerImage(teamWinner.color)}
      />

      <Text style={styles.sectionTitle}>
  Tour Awards
</Text>

{awards.map((award) => (
  <View key={award.id} style={styles.awardCard}>
    <View style={styles.awardContent}>
      <View style={styles.awardHeader}>
        <View style={styles.awardTrophyPlaceholder}>
          <Image
            source={award.image}
            style={styles.awardTrophyImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.awardText}>
          <Text style={styles.awardTitle}>
            {award.title}
          </Text>

          <Text style={styles.awardDescription}>
            {award.description}
          </Text>
        </View>
      </View>

      <View style={styles.awardWinnerRow}>
        <Image
          source={getRiderImage(award.winnerName)}
          style={styles.awardAvatar}
          resizeMode="contain"
        />

        <View style={styles.awardWinnerInfo}>
          <Text style={styles.awardWinnerName}>
            {award.winnerName}
          </Text>
        </View>

        {award.value ? (
          <Text style={styles.awardValue}>
            {award.value}
          </Text>
        ) : null}
      </View>
    </View>
  </View>
))}
    </ScrollView>
  );
}

export default function TourReviewScreen() {
  return <TourReviewContent />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 52,
    gap: 18,
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    color: Colors.red,
  },

  title: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: '900',
    color: Colors.brown,
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 7,
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.brown,
    opacity: 0.75,
    textAlign: 'center',
  },

  sectionTitle: {
  marginTop: 8,
  marginBottom: 4,
  fontSize: 21,
  fontWeight: '900',
  color: Colors.brown,
  textAlign: 'center',
},

  winnerCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  heroCard: {
  borderWidth: 3,
  borderColor: Colors.border,
},

winnerImage: {
  width: '100%',
  height: 155,
  marginTop: 8,
  marginBottom: -4,
},

  winnerContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 16,
  },

  heroContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },

  winnerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: Colors.red,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  heroWinnerTitle: {
    fontSize: 13,
    letterSpacing: 1.4,
  },

  winnerName: {
    marginTop: 5,
    fontSize: 21,
    fontWeight: '900',
    color: Colors.brown,
    textAlign: 'center',
  },

  heroWinnerName: {
    fontSize: 26,
  },

  winnerResult: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brown,
    opacity: 0.72,
    textAlign: 'center',
  },
  overallWinner: {
  alignItems: 'center',
  marginTop: 2,
  marginBottom: 4,
},

overallWinnerTitle: {
  marginBottom: 10,
  fontSize: 20,
  fontWeight: '900',
  letterSpacing: 1.4,
  color: Colors.red,
  textTransform: 'uppercase',
  textAlign: 'center',
},

overallWinnerImage: {
  width: '100%',
  height: 190,
},

overallWinnerName: {
  marginTop: 12,
  fontSize: 27,
  fontWeight: '900',
  color: Colors.brown,
  textAlign: 'center',
},

overallWinnerResult: {
  marginTop: 4,
  fontSize: 15,
  fontWeight: '700',
  color: Colors.brown,
  opacity: 0.72,
  textAlign: 'center',
},


awardTrophy: {
  fontSize: 72,
},



awardTitle: {
  fontSize: 21,
  fontWeight: '900',
  color: Colors.brown,
  textAlign: 'center',
},

awardDescription: {
  marginTop: 7,
  fontSize: 14,
  lineHeight: 20,
  color: Colors.brown,
  opacity: 0.72,
  textAlign: 'center',
},

awardWinnerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 18,
  paddingTop: 14,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
},

awardWinnerInfo: {
  flex: 1,
  marginLeft: 11,
},

awardWinnerName: {
  fontSize: 17,
  fontWeight: '900',
  color: Colors.brown,
},

awardWinnerDetail: {
  marginTop: 2,
  fontSize: 12,
  color: Colors.brown,
  opacity: 0.65,
},

awardValue: {
  marginLeft: 10,
  fontSize: 18,
  fontWeight: '900',
  color: Colors.red,
},
awardContent: {
  padding: 18,
},

awardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
},

awardTrophyPlaceholder: {
  width: 145,
  height: 145,
  borderRadius: 14,
  backgroundColor: Colors.paper,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
},

awardText: {
  flex: 1,
  marginLeft: 16,
},
awardCard: {
  overflow: 'hidden',
  borderRadius: 18,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  marginBottom: 16,
},
awardTrophyImage: {
  width: '92%',
  height: '92%',
},
awardAvatar: {
  width: 48,
  height: 48,
  resizeMode: 'contain',
  transform: [{ scale: 2 }],
},

standingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 2,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},

standingPosition: {
  width: 24,
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},

standingName: {
  flex: 1,
  fontSize: 14,
  color: Colors.brown,
},

standingPoints: {
  fontSize: 14,
  fontWeight: '700',
  color: Colors.brown,
},
});