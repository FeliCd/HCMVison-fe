import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeInUp,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { GridBackground } from '@/components/grid-background';
import { RainEffect } from '@/components/rain-effect';
import { RadarLogo } from '@/components/radar-logo';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const scale = useSharedValue(1);
  const glowPulse = useSharedValue(0.3);

  useEffect(() => {
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowPulse.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 12, stiffness: 200 });
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
          {/* Glassmorphism Console Panel */}
          <Animated.View
            entering={FadeInUp.duration(900).delay(200)}
            style={styles.glassConsole}
          >
            {/* Logo & Identity */}
            <View style={styles.identityContainer}>
              <RadarLogo />
              <Text style={styles.appTitle}>
                HCMRain<Text style={styles.appTitleHighlight}>Vision</Text>
              </Text>
              <Text style={styles.appSubtitle}>
                Dự báo mưa ngập bằng AI, tránh kẹt xe và đi lại an toàn hơn.
              </Text>
            </View>

            {/* Call to Action Button */}
            <View style={styles.actionContainer}>
              <AnimatedPressable
                onPress={handleStart}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.startButton, buttonAnimatedStyle, glowStyle]}
              >
                <Text style={styles.startButtonText}>Bắt đầu trải nghiệm</Text>
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
          </Animated.View>
        </View>

        {/* Footer Attribution */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(900)}
          style={styles.footer}
        >
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            Nguồn ảnh: Cổng thông tin giao thông TP.HCM
          </Text>
        </Animated.View>
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
    paddingHorizontal: 20,
    width: '100%',
  },
  glassConsole: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  identityContainer: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#d4e4fa',
    letterSpacing: -0.8,
    marginTop: 20,
    textAlign: 'center',
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  appTitleHighlight: {
    color: '#00f2ea',
  },
  appSubtitle: {
    fontSize: 14,
    color: '#b9cac8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#00f2ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#003735',
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        fontFamily: 'Inter',
      },
    }),
  },
  footer: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    gap: 10,
  },
  footerDivider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(0, 242, 234, 0.15)',
  },
  footerText: {
    fontSize: 10,
    color: '#b9cac8',
    opacity: 0.5,
    textAlign: 'center',
  },
});
