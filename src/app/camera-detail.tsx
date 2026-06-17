import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function CameraDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết Camera</Text>
        <Pressable style={styles.favoriteButton}>
          <Icon name="favorite_border" color="#d4e4fa" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Camera Feed placeholder */}
        <View style={styles.cameraFrame}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1517415174092-230eb1988a80?q=80&w=800&auto=format&fit=crop' }} 
            style={styles.cameraImage} 
          />
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TRỰC TIẾP</Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.infoCard}>
          <Text style={styles.locationTitle}>Ngã 4 Nguyễn Văn Linh - Nguyễn Hữu Thọ</Text>
          <Text style={styles.locationSubtitle}>Quận 7, TP.HCM</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Icon name="traffic" color="#00f2ea" size={24} />
              <Text style={styles.statValue}>Bình thường</Text>
              <Text style={styles.statLabel}>Mật độ giao thông</Text>
            </View>
            <View style={styles.statBox}>
              <Icon name="rainy" color="#ffb4ab" size={24} />
              <Text style={[styles.statValue, { color: '#ffb4ab' }]}>Mưa lớn</Text>
              <Text style={styles.statLabel}>Thời tiết hiện tại</Text>
            </View>
          </View>
        </View>

        {/* AI Analysis */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <Icon name="smart_toy" color="#00f2ea" size={20} />
            <Text style={styles.aiTitle}>Phân tích AI</Text>
          </View>
          <Text style={styles.aiDesc}>
            Dự báo ngập: Khả năng ngập sâu 20cm trong 30 phút tới. Khuyến cáo các phương tiện gầm thấp không nên di chuyển qua khu vực này.
          </Text>
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
  favoriteButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  cameraFrame: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1c2b3c', position: 'relative' },
  cameraImage: { width: '100%', height: '100%' },
  liveTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(239, 68, 68, 0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  infoCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  locationTitle: { fontSize: 20, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  locationSubtitle: { fontSize: 14, color: '#b9cac8', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(5, 20, 36, 0.5)', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 16, fontWeight: '600', color: '#00f2ea', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#849492' },
  aiCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiTitle: { fontSize: 16, fontWeight: '600', color: '#00f2ea' },
  aiDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22 },
});
