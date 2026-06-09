import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { GridBackground } from '@/components/grid-background';
import { RainEffect } from '@/components/rain-effect';
import { RadarLogo } from '@/components/radar-logo';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const scale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handleStart = () => {
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      {/* 1. Grid Background Map Lines */}
      <GridBackground />

      {/* 2. Ambient Rain Particle Effect */}
      <RainEffect />

      {/* 3. Main Content Canvas */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContent}>
          {/* Logo & Identity */}
          <View style={styles.identityContainer}>
            <RadarLogo />
            
            <Text style={styles.appTitle}>HCMRainVision</Text>
            
            <Text style={styles.appSubtitle}>
              Né mưa, tránh kẹt xe, đi an toàn hơn.
            </Text>
          </View>

          {/* Call to Action Button */}
          <View style={styles.actionContainer}>
            <AnimatedPressable
              onPress={handleStart}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[styles.startButton, buttonAnimatedStyle]}
            >
              <Text style={styles.startButtonText}>Bắt đầu</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="#003735"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </AnimatedPressable>
          </View>
        </View>

        {/* Footer Attribution */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Nguồn ảnh: Cổng thông tin giao thông TP.HCM
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
  },
  safeArea: {
    flex: 1,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  identityContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#29fcf3',
    letterSpacing: -0.6,
    marginTop: 12,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  appSubtitle: {
    fontSize: 16,
    color: '#b9cac8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
    lineHeight: 24,
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
    marginTop: 24,
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#00f2ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    // Glow effect
    shadowColor: '#00f2ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#003735',
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  footer: {
    width: '100%',
    paddingVertical: 24,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  footerText: {
    fontSize: 10,
    color: '#b9cac8',
    opacity: 0.6,
    textAlign: 'center',
  },
});
