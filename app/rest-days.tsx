import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

export default function RestDaysScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Rest Days</Text>
      <Text style={styles.text}>
        Rest day placement will be configured here.
      </Text>
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
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.brown,
  },
});