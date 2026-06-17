import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import { Icon } from '@/components/icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Onboarding2Screen() {
  const insets = useSafeAreaInsets();
  const btnScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(700).delay(100)} style={styles.iconArea}>
          <View style={styles.iconContainer}>
            <Icon name="route" color="#00f2ea" size={64} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Text style={styles.title}>Tuyến đường an toàn</Text>
          <Text style={styles.subtitle}>
            Hệ thống liên tục phân tích và đề xuất các tuyến đường an toàn nhất, giúp bạn tránh xa điểm ngập và kẹt xe.
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>2 / 3</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.footer}>
        <Pressable style={styles.skipButton} onPress={() => router.replace('/permission-location')}>
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </Pressable>
        <AnimatedPressable
          style={[styles.nextButton, btnStyle]}
          onPressIn={() => { btnScale.value = withSpring(0.93, { damping: 12 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
          onPress={() => router.push('/onboarding-3')}
        >
          <Text style={styles.nextButtonText}>Tiếp theo</Text>
          <Icon name="arrow_forward" color="#003735" size={16} />
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconArea: { justifyContent: 'center', alignItems: 'center', marginBottom: 36 },
  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#d4e4fa', textAlign: 'center', marginBottom: 14, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: '#b9cac8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  progressContainer: { marginTop: 36, alignItems: 'center', gap: 8, width: '50%' },
  progressTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#00f2ea',
  },
  progressText: { fontSize: 11, color: '#849492', fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  skipButton: { paddingVertical: 12, paddingHorizontal: 16 },
  skipButtonText: { color: '#849492', fontSize: 15, fontWeight: '600' },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#00f2ea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButtonText: { color: '#003735', fontSize: 15, fontWeight: '700' },
});
