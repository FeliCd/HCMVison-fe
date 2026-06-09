import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

function PulsingRing({ delay }: { delay: number }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.8, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
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
    };
  });

  return <Animated.View style={[styles.ring, animatedStyle]} />;
}

export function RadarLogo() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Pulse effect rings */}
      <PulsingRing delay={0} />
      <PulsingRing delay={1000} />

      {/* Main Container */}
      <View style={styles.innerCircle}>
        {/* Rotating sweep line */}
        <Animated.View style={[styles.sweepContainer, sweepStyle]}>
          <View style={styles.sweepLine} />
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
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ring: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#00f2ea',
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(28, 43, 60, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Glow effect
    shadowColor: '#00f2ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  sweepContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweepLine: {
    position: 'absolute',
    left: 40,
    width: 40,
    height: 2,
    backgroundColor: '#00f2ea',
    opacity: 0.6,
  },
  radarRing1: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.2)',
    borderStyle: 'dashed',
  },
  radarRing2: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)',
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#29fcf3',
    shadowColor: '#29fcf3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
