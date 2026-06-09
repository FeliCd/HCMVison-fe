import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function Onboarding3Screen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="notifications_active" color="#00f2ea" size={80} />
        </View>
        <Text style={styles.title}>Cảnh báo cá nhân</Text>
        <Text style={styles.subtitle}>
          Nhận thông báo ngay lập tức về tình hình mưa lụt và kẹt xe tại các khu vực mà bạn quan tâm.
        </Text>
        
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.nextButtonFull} onPress={() => router.push('/permission-location')}>
          <Text style={styles.nextButtonText}>Cấp quyền để bắt đầu</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(22, 37, 41, 0.8)', justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  title: { fontSize: 28, fontWeight: '700', color: '#d4e4fa', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#b9cac8', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 24, backgroundColor: '#00f2ea' },
  footer: { marginTop: 24 },
  nextButtonFull: { backgroundColor: '#00f2ea', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { color: '#003735', fontSize: 16, fontWeight: '600' },
});
