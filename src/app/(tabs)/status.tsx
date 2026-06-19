import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import { router } from 'expo-router';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { rainingCameras, logs, loading, error, getRainingCameras, getWeatherLogs } = useWeather();

  useEffect(() => {
    getRainingCameras(30);
    getWeatherLogs(60, 20);
  }, []);

  // Đếm điểm kẹt xe từ weather logs
  const congestedCount = logs.filter(
    (l) => l.trafficLevel === 'jam' || l.trafficLevel === 'slow'
  ).length;

  const rainingCount = rainingCameras.length;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>
        Tình trạng hiện tại
      </Animated.Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Stat Cards Row */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="rainy" color="#00f2ea" size={20} />
            </View>
            {loading ? (
              <ActivityIndicator color="#00f2ea" />
            ) : (
              <Text style={styles.statValue}>{rainingCount}</Text>
            )}
            <Text style={styles.statLabel}>Điểm ngập/mưa lớn</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 180, 171, 0.1)' }]}>
              <Icon name="traffic" color="#ffb4ab" size={20} />
            </View>
            {loading ? (
              <ActivityIndicator color="#ffb4ab" />
            ) : (
              <Text style={styles.statValueWarning}>{congestedCount}</Text>
            )}
            <Text style={styles.statLabel}>Điểm kẹt xe</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(500).delay(200)} style={styles.sectionTitle}>
          Camera đang theo dõi
        </Animated.Text>

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : loading && rainingCameras.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : rainingCameras.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check_circle" color="#22c55e" size={40} />
            <Text style={styles.emptyText}>Không có camera mưa nào trong 30 phút qua</Text>
          </View>
        ) : (
          rainingCameras.map((cam, idx) => (
            <Animated.View key={cam.cameraId} entering={FadeInUp.duration(600).delay(300 + idx * 100)}>
              <Pressable
                style={styles.cameraCard}
                onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.cameraId, name: cam.cameraName } })}
              >
                <View style={styles.cameraImageContainer}>
                  {cam.imageUrl ? (
                    <Image source={cam.imageUrl} style={styles.cameraImage} contentFit="cover" />
                  ) : (
                    <View style={[styles.cameraImage, styles.noImagePlaceholder]}>
                      <Icon name="videocam" color="#334155" size={36} />
                    </View>
                  )}
                  <View style={styles.imageGradientOverlay} />
                  <View style={styles.cameraOverlay}>
                    <View style={styles.badge}>
                      <Icon name="rainy" color="#ffb4ab" size={12} />
                      <Text style={styles.badgeText}>Đang mưa</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cameraInfo}>
                  <Text style={styles.cameraTitle}>{cam.cameraName}</Text>
                  <View style={styles.cameraStatusRow}>
                    <View style={styles.statusChipRed}>
                      <Icon name="rainy" color="#ffb4ab" size={12} />
                      <Text style={styles.statusChipRedText}>
                        {cam.rainLevel || 'Mưa'} • {cam.trafficLevel || ''}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>{cam.imageExpiresAtUtc ? 'Ảnh mới nhất' : 'Live'}</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}
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
  statValue: { fontSize: 32, fontWeight: '800', color: '#00f2ea' },
  statValueWarning: { fontSize: 32, fontWeight: '800', color: '#ffb4ab' },
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
  noImagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  imageGradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
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
  badgeText: { color: '#ffb4ab', fontSize: 11, fontWeight: '700' },
  cameraInfo: { padding: 16 },
  cameraTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa', marginBottom: 8 },
  cameraStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontSize: 12, color: '#b9cac8' },
  statusChipRed: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(255, 180, 171, 0.2)', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusChipRedText: { fontSize: 11, fontWeight: '700', color: '#ffb4ab' },
  loadingBox: { paddingTop: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12, marginTop: 8 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
});
