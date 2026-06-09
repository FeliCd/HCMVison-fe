import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface RainParticleProps {
  left: number;
  delay: number;
  duration: number;
  screenHeight: number;
  opacity: number;
}

function RainParticle({ left, delay, duration, screenHeight, opacity }: RainParticleProps) {
  const translateY = useSharedValue(-80);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(screenHeight + 80, {
          duration: duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
  }, [screenHeight, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateY.value * Math.tan((15 * Math.PI) / 180) },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${left}%`,
          opacity: opacity,
        },
        animatedStyle,
      ]}
    />
  );
}

export function RainEffect() {
  const { height } = useWindowDimensions();
  const particleCount = 30;

  // Create stable configuration for particles
  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      left: Math.random() * 110 - 5, // Allow slightly off-screen left/right
      delay: Math.random() * 2000, // up to 2 seconds delay
      duration: 800 + Math.random() * 600, // 800ms to 1400ms speed
      opacity: 0.15 + Math.random() * 0.35, // opacity range
    }));
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <RainParticle
          key={p.id}
          left={p.left}
          delay={p.delay}
          duration={p.duration}
          screenHeight={height}
          opacity={p.opacity}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    width: 1.2,
    height: 45,
    backgroundColor: '#00f2ea',
    borderRadius: 1,
  },
});
