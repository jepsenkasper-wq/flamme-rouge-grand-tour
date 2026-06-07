import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

export function PodiumCard() {
  return (
    <View style={styles.card}>
      <View style={styles.podium}>
        <View style={styles.place2}>
          <Text style={styles.placeNumber}>2</Text>
          <Text>Jesper</Text>
        </View>

        <View style={styles.place1}>
          <Text style={styles.placeNumber}>1</Text>
          <Text>Kasper</Text>
        </View>

        <View style={styles.place3}>
          <Text style={styles.placeNumber}>3</Text>
          <Text>Kenneth</Text>
        </View>
      </View>

      <View style={styles.secondaryPlaces}>
        <Text style={styles.secondaryPlace}>4 Peter</Text>
        <Text style={styles.secondaryPlace}>5 Carsten</Text>
        <Text style={styles.secondaryPlace}>6 Casper</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },

  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 10,
  },

  place1: {
    width: 90,
    height: 90,
    backgroundColor: '#d9a441',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  place2: {
    width: 80,
    height: 70,
    backgroundColor: '#e8d2a1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  place3: {
    width: 80,
    height: 55,
    backgroundColor: '#d7b38c',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brown,
  },

  secondaryPlaces: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  secondaryPlace: {
    color: Colors.brown,
    fontWeight: '700',
  },
});