import { ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';

import { Colors } from '@/constants/colors';

import {
  FolderOpen,
  Plus,
  Users,
} from 'lucide-react-native';


export default function StartScreen() {
  const { width } = useWindowDimensions();

const isTablet = width >= 700;
  return (
    <ImageBackground
      source={require('@/assets/images/tour-background.png')}
      style={styles.screen}
      resizeMode="cover"
    >
      <View
  style={[
    styles.overlay,
    isTablet && styles.tabletOverlay,
  ]}>
        <View style={styles.logoArea}>
          <Text style={styles.title}>FLAMME{'\n'}ROUGE</Text>
          <Text style={styles.subtitle}>GRAND TOUR</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Link href="/create-game" asChild>
            <Pressable style={styles.button}>
              <Plus
  size={34}
  color="#7A1D12"
  strokeWidth={2.5}
/>
              <Text style={styles.buttonText}>CREATE GAME</Text>
            </Pressable>
          </Link>

          <Link href="/my-games" asChild>
            <Pressable style={styles.button}>
              <FolderOpen
  size={30}
  color="#7A1D12"
  strokeWidth={2.2}
/>
              <Text style={styles.buttonText}>MY GAMES</Text>
            </Pressable>
          </Link>

          <Link href="/follow-game" asChild>
            <Pressable style={styles.button}>
              <Users
  size={30}
  color="#7A1D12"
  strokeWidth={2.2}
/>
              <Text style={styles.buttonText}>FOLLOW GAME</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 92,
    paddingBottom: 54,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 233, 208, 0.08)',
  },
  logoArea: {
    alignItems: 'center',
  },
 title: {
  fontFamily: 'BebasNeue',
  fontSize: 58,
  lineHeight: 58,
  color: '#7A1D12',
  textAlign: 'center',
  letterSpacing: 3,
},
  subtitle: {
    marginTop: -6,
    fontSize: 24,
    fontWeight: '900',
    color: '#1E232A',
    letterSpacing: 3,
  },
  buttonGroup: {
    gap: 10,
  },
  button: {
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#7A1D12',
    backgroundColor: 'rgba(243,231,209,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 4,
  },
  icon: {
    width: 58,
    fontSize: 38,
    color: '#7A1D12',
    fontWeight: '900',
  },
  buttonText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '900',
    color: '#1E232A',
    letterSpacing: 1,
  },
  
  tabletOverlay: {
  width: 430,
  alignSelf: 'center',
},

  
});