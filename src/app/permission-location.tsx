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

export default function PermissionLocationScreen() {
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
            <Icon name="my_location" color="#00f2ea" size={56} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Text style={styles.title}>Cấp quyền Vị trí</Text>
          <Text style={styles.subtitle}>
            HCMRainVision cần quyền truy cập vị trí của bạn để cảnh báo ngập lụt và đề xuất tuyến đường chính xác nhất theo thời gian thực.
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.infoBox}>
          <View style={styles.infoIconContainer}>
            <Icon name="privacy_tip" color="#849492" size={18} />
          </View>
          <Text style={styles.infoText}>Dữ liệu vị trí của bạn được mã hóa và không bao giờ chia sẻ cho bên thứ ba.</Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.footer}>
        <Pressable style={styles.denyButton} onPress={() => router.replace('/permission-notification')}>
          <Text style={styles.denyButtonText}>Lúc khác</Text>
        </Pressable>
        <AnimatedPressable
          style={[styles.allowButton, btnStyle]}
          onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
          onPress={() => router.push('/permission-notification')}
        >
          <Text style={styles.allowButtonText}>Cho phép</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  title: { fontSize: 30, fontWeight: '700', color: '#d4e4fa', textAlign: 'center', marginBottom: 16, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, color: '#b9cac8', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8, marginBottom: 32 },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'flex-start',
    gap: 14,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 20, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 13, color: '#849492', lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 24 },
  denyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  denyButtonText: { color: '#d4e4fa', fontSize: 16, fontWeight: '600' },
  allowButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#00f2ea',
    alignItems: 'center',
  },
  allowButtonText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
