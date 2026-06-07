import { StyleSheet, Text, View } from 'react-native';

export default function StagesScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Stages</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stage List</Text>
        <Text style={styles.cardText}>
          Completed and upcoming stages will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4e8c8',
    padding: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#3a261f',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff6dc',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#c8a96a',
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#3a261f',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#5c4a3f',
  },
});