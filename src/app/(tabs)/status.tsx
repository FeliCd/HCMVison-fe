import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>Tình trạng hiện tại</Animated.Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Stat Cards Row */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="rainy" color="#00f2ea" size={20} />
            </View>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Điểm ngập/mưa lớn</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 180, 171, 0.1)' }]}>
              <Icon name="traffic" color="#ffb4ab" size={20} />
            </View>
            <Text style={styles.statValueWarning}>8</Text>
            <Text style={styles.statLabel}>Điểm kẹt xe</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(500).delay(200)} style={styles.sectionTitle}>Camera đang theo dõi</Animated.Text>

        {/* Camera Card 1 */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Pressable style={styles.cameraCard}>
            <View style={styles.cameraImageContainer}>
              <Image 
                source="https://lh3.googleusercontent.com/aida-public/AB6AXuCsTtxj8qIjQMWl24Whd7WSvQs7RCXJqmi5N5XSjvmazXbnB7IwSZAfYliMapnn80YnD1UWeaIFWgGcD1XG0Zo1KcyqinVSvDMwUxWvxbhRZ4mTXZ68SBER6N7nJf-nHmW1HzgG_TVUPHqLiXppNA39BdxoSGUWvsP0OH0PmuYGiuntlOqKQjURn307m6JZq4uAINCdUKoKxAXHo3U-OOmKibi-BwHp7KOYZxMs9vabq34PstUX2OZiSsJzfeo7TPpQXG34ifjqfpHw" 
                style={styles.cameraImage} 
                contentFit="cover" 
              />
              <View style={styles.imageGradientOverlay} />
              <View style={styles.cameraOverlay}>
                <View style={styles.badge}>
                  <Icon name="videocam" color="#00f2ea" size={12} />
                  <Text style={styles.badgeText}>Dữ liệu mới</Text>
                </View>
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
        </Animated.View>

        {/* Camera Card 2 */}
        <Animated.View entering={FadeInUp.duration(600).delay(450)}>
          <Pressable style={styles.cameraCard}>
            <View style={styles.cameraImageContainer}>
              <Image 
                source="https://lh3.googleusercontent.com/aida-public/AB6AXuCsTtxj8qIjQMWl24Whd7WSvQs7RCXJqmi5N5XSjvmazXbnB7IwSZAfYliMapnn80YnD1UWeaIFWgGcD1XG0Zo1KcyqinVSvDMwUxWvxbhRZ4mTXZ68SBER6N7nJf-nHmW1HzgG_TVUPHqLiXppNA39BdxoSGUWvsP0OH0PmuYGiuntlOqKQjURn307m6JZq4uAINCdUKoKxAXHo3U-OOmKibi-BwHp7KOYZxMs9vabq34PstUX2OZiSsJzfeo7TPpQXG34ifjqfpHw" 
                style={styles.cameraImage} 
                contentFit="cover" 
              />
              <View style={styles.imageGradientOverlay} />
            </View>
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
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 20, letterSpacing: -0.6 },
  content: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00f2ea',
  },
  statValueWarning: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffb4ab',
  },
  statLabel: { fontSize: 13, color: '#b9cac8', textAlign: 'center', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa', marginBottom: 16, letterSpacing: 0.2 },
  cameraCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cameraImageContainer: { position: 'relative' },
  cameraImage: { width: '100%', height: 170, backgroundColor: '#122131' },
  imageGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(25, 30, 40, 0.6)',
  },
  cameraOverlay: { position: 'absolute', top: 12, left: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 40, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  badgeText: { color: '#00f2ea', fontSize: 11, fontWeight: '700' },
  cameraInfo: { padding: 16 },
  cameraTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa', marginBottom: 8 },
  cameraStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 12, color: '#b9cac8' },
  statusChipRed: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(255, 180, 171, 0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusChipRedText: { fontSize: 11, fontWeight: '700', color: '#ffb4ab' },
  statusChipAmber: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusChipAmberText: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
});
