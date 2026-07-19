import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';

const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=DP53LNYFJMFMG';

export default function SupportDevelopmentScreen() {
  async function openPayPal() {
    if (!PAYPAL_URL) {
      Alert.alert(
        'PayPal is not ready yet',
        'The donation link will be added before the next release.'
      );
      return;
    }

    const canOpen = await Linking.canOpenURL(PAYPAL_URL);

    if (!canOpen) {
      Alert.alert(
        'Unable to open PayPal',
        'Please try again later.'
      );
      return;
    }

    await Linking.openURL(PAYPAL_URL);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color={Colors.brown}
        />

        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <View style={styles.card}>
        <Ionicons
          name="heart"
          size={58}
          color={Colors.red}
          style={styles.heart}
        />

        <Text style={styles.title}>
          Support Development
        </Text>

        <Text style={styles.text}>
          Flamme Rouge Grand Tour Companion is a passion project developed in my spare time. It is completely free to use and contains no advertisements.
        </Text>

        <Text style={styles.text}>
          If you enjoy using the app and would like to support future development, you can make a voluntary contribution via PayPal. Every donation, no matter the size, is greatly appreciated.
        </Text>

        <Text style={styles.smallText}>
          Your support helps cover development costs, Google Play/Apple Developer fees and future improvements. Thank you!
        </Text>

        <Pressable
          style={styles.payPalButton}
          onPress={openPayPal}
        >
          <Ionicons
            name="heart-outline"
            size={21}
            color={Colors.white}
          />

          <Text style={styles.payPalButtonText}>
            Donate with PayPal
          </Text>
        </Pressable>

        <Text style={styles.thankYou}>
          Thank you for supporting future updates!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },

  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 64,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 10,
    marginTop: -50,
  },

  backButtonText: {
    color: Colors.brown,
    fontSize: 16,
    fontWeight: '800',
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },

  heart: {
    marginBottom: 10,
  },

  title: {
    fontFamily: 'BebasNeue',
    fontSize: 34,
    color: Colors.brown,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 18,
  },

  text: {
    color: Colors.brown,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 14,
  },

  smallText: {
    color: Colors.brown,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    opacity: 0.75,
    marginTop: 2,
    marginBottom: 24,
  },

  payPalButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    backgroundColor: Colors.red,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  payPalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
  },

  thankYou: {
    color: Colors.brown,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});