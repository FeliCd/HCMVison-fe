import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function SystemHealthScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Sức khỏe Hệ thống</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="dns" color="#00f2ea" size={24} />
            <Text style={styles.cardTitle}>Máy chủ Chính (API)</Text>
            <View style={styles.statusDotGreen} />
          </View>
          <Text style={styles.cardDesc}>Tải: 24% • RAM: 16GB/32GB</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="smart_toy" color="#00f2ea" size={24} />
            <Text style={styles.cardTitle}>Cụm AI Phân tích</Text>
            <View style={styles.statusDotGreen} />
          </View>
          <Text style={styles.cardDesc}>Đang xử lý 1,200 luồng stream / giây.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="warning" color="#ffb4ab" size={24} />
            <Text style={styles.cardTitle}>Node Quận 7 (Mất kết nối)</Text>
            <View style={styles.statusDotRed} />
          </View>
          <Text style={styles.cardDesc}>Lỗi mạng cục bộ. Đã thông báo bộ phận kỹ thuật.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', flex: 1 },
  statusDotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00f2ea' },
  statusDotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffb4ab' },
  cardDesc: { fontSize: 14, color: '#b9cac8', marginLeft: 36 },
});
