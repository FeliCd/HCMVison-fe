import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import { useCamera } from '@/hooks/useCamera';
import { router } from 'expo-router';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { rainingCameras, logs, loading, error, getRainingCameras, getWeatherLogs } = useWeather();
  const { cameras, getCameras, loading: camerasLoading } = useCamera();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const numColumns = width >= 768 ? 4 : 1;
  const gap = 16;
  const cardWidth = width >= 768 ? Math.floor((width - 64 - (numColumns - 1) * gap) / numColumns) : '100%';

  useEffect(() => {
    getRainingCameras(30);
    getWeatherLogs(60, 20);
    getCameras(undefined, 1, 100);
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

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Camera đang theo dõi ({cameras.length})
          </Text>
          <View style={styles.viewModeToggle}>
            <Pressable 
              style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Icon name="grid_view" color={viewMode === 'grid' ? '#0f172a' : '#94a3b8'} size={20} />
            </Pressable>
            <Pressable 
              style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Icon name="view_list" color={viewMode === 'list' ? '#0f172a' : '#94a3b8'} size={20} />
            </Pressable>
          </View>
        </Animated.View>

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : camerasLoading && cameras.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu camera...</Text>
          </View>
        ) : cameras.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="videocam" color="#64748b" size={40} />
            <Text style={styles.emptyText}>Chưa có camera nào trong hệ thống</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {cameras.map((cam, idx) => {
              const isOnline = cam.status === 'Active';
              
              return (
                <Animated.View key={cam.id} entering={FadeInUp.duration(600).delay(300 + Math.min(idx, 10) * 50)} style={{ width: viewMode === 'grid' ? cardWidth : '100%' }}>
                  <Pressable
                    style={viewMode === 'grid' ? styles.newCameraCard : styles.listCameraCard}
                    onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.id, name: cam.name } })}
                  >
                    <View style={viewMode === 'grid' ? styles.newCameraImageContainer : styles.listCameraImageContainer}>
                      <View style={styles.newImagePlaceholder}>
                        <Icon name="image" color="#cbd5e1" size={viewMode === 'grid' ? 48 : 32} />
                        {viewMode === 'grid' && <Text style={styles.newImagePlaceholderText}>IMAGE NOT AVAILABLE</Text>}
                      </View>
                      
                      
                      <View style={styles.onlineBadge}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#f43f5e' }]} />
                        <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
                      </View>
                      
                      <View style={styles.timestampBadge}>
                        <Text style={styles.timestampText}>{new Date().toLocaleString('vi-VN')}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.newCameraInfo}>
                      <View style={styles.newCameraTitleRow}>
                        <Text style={styles.newCameraTitle} numberOfLines={1}>{cam.name}</Text>
                        <Icon name="wifi" color={isOnline ? '#22c55e' : '#64748b'} size={16} />
                      </View>
                      <View style={styles.newCameraLocationRow}>
                        <Icon name="location_on" color="#94a3b8" size={14} />
                        <Text style={styles.newCameraLocationText} numberOfLines={1}>{cam.wardName || 'Khu vực chưa xác định'}</Text>
                      </View>
                      <Text style={styles.newCameraIdText}>ID: {cam.id}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa', letterSpacing: 0.2 },
  viewModeToggle: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 8, padding: 2 },
  viewModeBtn: { padding: 6, borderRadius: 6 },
  viewModeBtnActive: { backgroundColor: '#ffffff' },
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
  newCameraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newCameraImageContainer: {
    height: 160,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listCameraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'row',
    height: 100,
  },
  listCameraImageContainer: {
    width: 140,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  newImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newImagePlaceholderText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  liveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  timestampBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  timestampText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  newCameraInfo: {
    padding: 12,
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
  },
  newCameraTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  newCameraTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  newCameraLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  newCameraLocationText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  newCameraIdText: {
    fontSize: 11,
    color: '#cbd5e1',
  },
});
