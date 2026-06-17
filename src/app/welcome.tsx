import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
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

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(700).delay(100)} style={styles.imagePlaceholder}>
          <Icon name="location_on" color="#00f2ea" size={56} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Text style={styles.title}>Chào mừng đến với HCMRain<Text style={styles.titleHighlight}>Vision</Text></Text>
          <Text style={styles.subtitle}>
            Hệ thống giám sát giao thông và thời tiết thông minh nhất thành phố.
          </Text>
        </Animated.View>

        <View style={styles.featureList}>
          <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="rainy" color="#00f2ea" size={22} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Cảnh báo ngập lụt</Text>
              <Text style={styles.featureDesc}>Tránh các tuyến đường ngập sâu nhờ AI phân tích theo thời gian thực.</Text>
            </View>
          </Animated.View>
          <Animated.View entering={FadeInUp.duration(600).delay(650)} style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="traffic" color="#00f2ea" size={22} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Dữ liệu giao thông</Text>
              <Text style={styles.featureDesc}>Xem trực tiếp hàng trăm camera trên toàn thành phố.</Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500).delay(800)} style={styles.footer}>
        <AnimatedPressable
          style={[styles.primaryButton, btnStyle]}
          onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
          onPress={() => router.push('/onboarding-1')}
        >
          <Text style={styles.primaryButtonText}>Bắt đầu khám phá</Text>
          <Icon name="arrow_forward" color="#003735" size={20} />
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  imagePlaceholder: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#d4e4fa', textAlign: 'center', letterSpacing: -0.6 },
  titleHighlight: { color: '#00f2ea' },
  subtitle: { fontSize: 14, color: '#b9cac8', textAlign: 'center', marginTop: 12, lineHeight: 22, marginBottom: 36 },
  featureList: { gap: 14 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureTextContainer: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#b9cac8', lineHeight: 20 },
  footer: { marginTop: 24 },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#00f2ea',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: { color: '#003735', fontSize: 15, fontWeight: '700' },
});
