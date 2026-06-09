import React from 'react';
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

      {/* Radial glow in center */}
      <View style={[styles.radialGlow, { left: width / 2 - 300, top: height / 2 - 300 }]} />

      {/* Vertical Lines */}
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[
            styles.line,
            styles.verticalLine,
            { left: i * step },
          ]}
        />
      ))}

      {/* Horizontal Lines */}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[
            styles.line,
            styles.horizontalLine,
            { top: i * step },
          ]}
        />
      ))}
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
    backgroundColor: '#00f2ea',
    opacity: 0.05,
    transform: [{ scale: 1.2 }],
  },
  line: {
    position: 'absolute',
    backgroundColor: '#00ddd6',
    opacity: 0.03,
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
