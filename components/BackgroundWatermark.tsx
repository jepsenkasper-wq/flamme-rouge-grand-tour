import { Image, StyleSheet, useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 700;

export default function BackgroundWatermark() {
  const { width } = useWindowDimensions();

  if (width >= 700) {
    return null;
  }

  return (
    <Image
      source={require('@/assets/images/background-blackwhite.png')}
      style={styles.watermark}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  watermark: {
    position: 'absolute',
    width: 500,
    height: 700,
    right: -120,
    bottom: 0,
    opacity: 0.2,
  },
});