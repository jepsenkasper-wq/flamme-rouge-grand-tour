import { Colors } from '@/constants/colors';
import { PodiumCard } from '@/components/PodiumCard';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>FLAMME ROUGE</Text>
      <Text style={styles.subtitle}>Grand Tour</Text>

      <View style={styles.stageBar}>
  <Text style={styles.stageText}>Stage 7 of 21</Text>
</View>

      {/* Podium */}
    <PodiumCard />

      {/* Jerseys */}
      <View style={styles.jerseyGrid}>
        <View style={styles.jerseyCard}>
          <Text style={styles.jerseyTitle}>Yellow</Text>
          <Text>Kasper</Text>
        </View>

        <View style={styles.jerseyCard}>
          <Text style={styles.jerseyTitle}>Mountain</Text>
          <Text>Jesper</Text>
        </View>

        <View style={styles.jerseyCard}>
          <Text style={styles.jerseyTitle}>Sprint</Text>
          <Text>Kenneth</Text>
        </View>

        <View style={styles.jerseyCard}>
          <Text style={styles.jerseyTitle}>Team</Text>
          <Text>Peter</Text>
        </View>
      </View>

      {/* Main button */}
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Enter Stage 8</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#3a261f',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 20,
    color: '#8b2f20',
    textAlign: 'center',
    marginBottom: 24,
  },

  podiumCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.brown,
  },

 

  jerseyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },

  jerseyCard: {
    width: '48%',
    backgroundColor: '#fff6dc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c8a96a',
  },

  jerseyTitle: {
    fontWeight: '800',
    marginBottom: 6,
    color: '#3a261f',
  },

  button: {
    backgroundColor: '#8b2f20',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },

  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  stageBar: {
  backgroundColor: '#3a261f',
  borderRadius: 999,
  paddingVertical: 8,
  paddingHorizontal: 16,
  alignSelf: 'center',
  marginBottom: 16,
},

stageText: {
  color: '#fff6dc',
  fontWeight: '800',
  fontSize: 14,
  letterSpacing: 0.5,
},



});