import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imagePlaceholder}>
          <Icon name="location_on" color="#00f2ea" size={64} />
        </View>

        <Text style={styles.title}>Chào mừng đến với HCMRain<Text style={styles.titleHighlight}>Vision</Text></Text>
        <Text style={styles.subtitle}>
          Hệ thống giám sát giao thông và thời tiết thông minh nhất thành phố.
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Icon name="rainy" color="#00f2ea" size={24} />
            <View>
              <Text style={styles.featureTitle}>Cảnh báo ngập lụt</Text>
              <Text style={styles.featureDesc}>Tránh các tuyến đường ngập sâu nhờ AI phân tích theo thời gian thực.</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <Icon name="traffic" color="#00f2ea" size={24} />
            <View>
              <Text style={styles.featureTitle}>Dữ liệu giao thông</Text>
              <Text style={styles.featureDesc}>Xem trực tiếp hàng trăm camera trên toàn thành phố.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/onboarding-1')}>
          <Text style={styles.primaryButtonText}>Bắt đầu khám phá</Text>
          <Icon name="arrow_forward" color="#003735" size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 24 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  imagePlaceholder: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#d4e4fa', textAlign: 'center' },
  titleHighlight: { color: '#00f2ea' },
  subtitle: { fontSize: 15, color: '#b9cac8', textAlign: 'center', marginTop: 12, lineHeight: 22, marginBottom: 40 },
  featureList: { gap: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#b9cac8', lineHeight: 20, paddingRight: 24 },
  footer: { marginTop: 24 },
  primaryButton: { flexDirection: 'row', backgroundColor: '#00f2ea', borderRadius: 12, height: 52, justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4 },
  primaryButtonText: { color: '#003735', fontSize: 16, fontWeight: '600' },
});
