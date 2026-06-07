import { StyleSheet, Text, View } from 'react-native';

export default function StandingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Standings</Text>

      <View style={styles.tabs}>
        <Text style={styles.activeTab}>Yellow</Text>
        <Text style={styles.tab}>Mountain</Text>
        <Text style={styles.tab}>Sprint</Text>
        <Text style={styles.tab}>Team</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yellow Jersey</Text>
        <Text style={styles.cardText}>Classification rankings will appear here.</Text>
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  activeTab: {
    backgroundColor: '#d9a441',
    color: '#3a261f',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '800',
  },
  tab: {
    backgroundColor: '#fff6dc',
    color: '#5c4a3f',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#c8a96a',
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