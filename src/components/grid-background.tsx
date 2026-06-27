import { StyleSheet, View, useWindowDimensions } from 'react-native';

export function GridBackground() {
  const { width, height } = useWindowDimensions();
  const step = 40;

  const cols = Math.ceil(width / step);
  const rows = Math.ceil(height / step);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Dark background */}
      <View style={styles.background} />

      {/* Primary radial glow in center — cyan */}
      <View style={[styles.radialGlow, { left: width / 2 - 300, top: height / 2 - 300 }]} />

      {/* Secondary warm glow — upper right for depth */}
      <View style={[styles.radialGlowWarm, { right: -100, top: -100 }]} />

      {/* Tertiary subtle glow — bottom left */}
      <View style={[styles.radialGlowDeep, { left: -80, bottom: -80 }]} />

      {/* Vertical Lines — variable opacity for depth */}
      {Array.from({ length: cols + 1 }).map((_, i) => {
        const distFromCenter = Math.abs(i - cols / 2) / (cols / 2);
        const opacity = 0.015 + (1 - distFromCenter) * 0.025;
        return (
          <View
            key={`v-${i}`}
            style={[
              styles.line,
              styles.verticalLine,
              { left: i * step, opacity },
            ]}
          />
        );
      })}

      {/* Horizontal Lines — variable opacity for depth */}
      {Array.from({ length: rows + 1 }).map((_, i) => {
        const distFromCenter = Math.abs(i - rows / 2) / (rows / 2);
        const opacity = 0.015 + (1 - distFromCenter) * 0.025;
        return (
          <View
            key={`h-${i}`}
            style={[
              styles.line,
              styles.horizontalLine,
              { top: i * step, opacity },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#051424',
  },
  radialGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: '#0a2e5c',
    opacity: 0.35,
    transform: [{ scale: 1.3 }],
  },
  radialGlowWarm: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#0b1f3c',
    opacity: 0.4,
    transform: [{ scale: 1.5 }],
  },
  radialGlowDeep: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#071629',
    opacity: 0.5,
    transform: [{ scale: 1.4 }],
  },
  line: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
});
