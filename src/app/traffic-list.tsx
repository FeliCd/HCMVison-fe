import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function TrafficListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Điểm kẹt xe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Đang kẹt xe nghiêm trọng</Text>
        <Pressable style={styles.itemCard} onPress={() => router.push('/camera-detail')}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Cộng Hòa, Bình Thạnh</Text>
            <View style={styles.chipRed}>
              <Text style={styles.chipRedText}>Kẹt cứng</Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>Hướng từ Lăng Cha Cả về vòng xoay. Kéo dài hơn 2km, tốc độ trung bình 2km/h.</Text>
        </Pressable>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ùn ứ cục bộ</Text>
        <Pressable style={styles.itemCard} onPress={() => router.push('/camera-detail')}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle}>Điện Biên Phủ, Quận 1</Text>
            <View style={styles.chipYellow}>
              <Text style={styles.chipYellowText}>Ùn ứ chậm</Text>
            </View>
          </View>
          <Text style={styles.itemDesc}>Đoạn qua Đại học Hutech di chuyển chậm. Các xe máy nối đuôi nhau.</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#849492', marginBottom: 8, marginTop: 8 },
  itemCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', flex: 1, marginRight: 16 },
  chipRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipRedText: { color: '#ffb4ab', fontSize: 12, fontWeight: '600' },
  chipYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipYellowText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  itemDesc: { fontSize: 14, color: '#b9cac8', lineHeight: 20 },
});
