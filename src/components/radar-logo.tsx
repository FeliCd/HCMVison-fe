/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

function PulsingRing({ delay, size }: { delay: number; size: number }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.2, {
          duration: 2400,
          easing: Easing.out(Easing.cubic),
        }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, {
          duration: 2400,
          easing: Easing.out(Easing.cubic),
        }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      width: size,
      height: size,
      borderRadius: size / 2,
    };
  });

  return <Animated.View style={[styles.ring, animatedStyle]} />;
}

export function RadarLogo() {
  const rotation = useSharedValue(0);
  const innerGlow = useSharedValue(0.2);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 3500,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    innerGlow.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: innerGlow.value,
    };
  });

  return (
    <View style={styles.container}>
      {/* Pulse effect rings — 3 staggered */}
      <PulsingRing delay={0} size={90} />
      <PulsingRing delay={800} size={90} />
      <PulsingRing delay={1600} size={90} />

      {/* Inner glow halo */}
      <Animated.View style={[styles.innerGlow, glowStyle]} />

      {/* Main Container */}
      <View style={styles.innerCircle}>
        {/* Rotating sweep line */}
        <Animated.View style={[styles.sweepContainer, sweepStyle]}>
          <View style={styles.sweepLine} />
          <View style={styles.sweepLineFade} />
        </Animated.View>

        {/* Radar concentric details */}
        <View style={styles.radarRing1} />
        <View style={styles.radarRing2} />

        {/* Center dot */}
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 234, 0.3)',
  },
  innerGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
  },
  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Glass Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  sweepContainer: {
    position: 'absolute',
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweepLine: {
    position: 'absolute',
    left: 44,
    width: 44,
    height: 2,
    backgroundColor: '#00f2ea',
    opacity: 0.6,
  },
  sweepLineFade: {
    position: 'absolute',
    left: 44,
    width: 30,
    height: 1,
    backgroundColor: '#00f2ea',
    opacity: 0.2,
    transform: [{ rotate: '-15deg' }, { translateX: 5 }],
  },
  radarRing1: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  radarRing2: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f2ea',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
