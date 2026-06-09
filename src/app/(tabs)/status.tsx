import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Icon } from '@/components/icons';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.headerTitle}>Tình trạng hiện tại</Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Điểm ngập/mưa lớn</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValueWarning}>8</Text>
            <Text style={styles.statLabel}>Điểm kẹt xe</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Camera đang theo dõi</Text>

        {/* Camera Card 1 */}
        <Pressable style={styles.cameraCard}>
          <Image 
            source="https://lh3.googleusercontent.com/aida-public/AB6AXuCsTtxj8qIjQMWl24Whd7WSvQs7RCXJqmi5N5XSjvmazXbnB7IwSZAfYliMapnn80YnD1UWeaIFWgGcD1XG0Zo1KcyqinVSvDMwUxWvxbhRZ4mTXZ68SBER6N7nJf-nHmW1HzgG_TVUPHqLiXppNA39BdxoSGUWvsP0OH0PmuYGiuntlOqKQjURn307m6JZq4uAINCdUKoKxAXHo3U-OOmKibi-BwHp7KOYZxMs9vabq34PstUX2OZiSsJzfeo7TPpQXG34ifjqfpHw" 
            style={styles.cameraImage} 
            contentFit="cover" 
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.badge}>
              <Icon name="videocam" color="#00f2ea" size={12} />
              <Text style={styles.badgeText}>Dữ liệu mới</Text>
            </View>
          </View>
          <View style={styles.cameraInfo}>
            <Text style={styles.cameraTitle}>Ngã 4 Hàng Xanh</Text>
            <View style={styles.cameraStatusRow}>
              <View style={styles.statusChipRed}>
                <Icon name="traffic" color="#ffb4ab" size={12} />
                <Text style={styles.statusChipRedText}>Kẹt xe</Text>
              </View>
              <Text style={styles.timeText}>Cập nhật 2 phút trước</Text>
            </View>
          </View>
        </Pressable>

        {/* Camera Card 2 */}
        <Pressable style={styles.cameraCard}>
          <Image 
            source="https://lh3.googleusercontent.com/aida-public/AB6AXuCsTtxj8qIjQMWl24Whd7WSvQs7RCXJqmi5N5XSjvmazXbnB7IwSZAfYliMapnn80YnD1UWeaIFWgGcD1XG0Zo1KcyqinVSvDMwUxWvxbhRZ4mTXZ68SBER6N7nJf-nHmW1HzgG_TVUPHqLiXppNA39BdxoSGUWvsP0OH0PmuYGiuntlOqKQjURn307m6JZq4uAINCdUKoKxAXHo3U-OOmKibi-BwHp7KOYZxMs9vabq34PstUX2OZiSsJzfeo7TPpQXG34ifjqfpHw" 
            style={styles.cameraImage} 
            contentFit="cover" 
          />
          <View style={styles.cameraInfo}>
            <Text style={styles.cameraTitle}>Vòng xoay Lăng Cha Cả</Text>
            <View style={styles.cameraStatusRow}>
              <View style={styles.statusChipAmber}>
                <Icon name="rainy" color="#f59e0b" size={12} />
                <Text style={styles.statusChipAmberText}>Mưa vừa</Text>
              </View>
              <Text style={styles.timeText}>Cập nhật 5 phút trước</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d4e4fa',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(22, 37, 41, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00f2ea',
    marginBottom: 4,
  },
  statValueWarning: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffb4ab',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#b9cac8',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d4e4fa',
    marginBottom: 16,
  },
  cameraCard: {
    backgroundColor: 'rgba(22, 37, 41, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cameraImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#122131',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 20, 36, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: '#00f2ea',
    fontSize: 11,
    fontWeight: '600',
  },
  cameraInfo: {
    padding: 16,
  },
  cameraTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4e4fa',
    marginBottom: 8,
  },
  cameraStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#b9cac8',
  },
  statusChipRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipRedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffb4ab',
  },
  statusChipAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipAmberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
  },
});
