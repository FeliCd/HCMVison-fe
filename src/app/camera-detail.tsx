import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { apiClient } from '@/services/api';
import { Camera, WeatherLog } from '@/types/api';

export default function CameraDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const [camera, setCamera] = useState<Camera | null>(null);
  const [latestLog, setLatestLog] = useState<WeatherLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Tải danh sách cameras để tìm camera này
        const camRes = await apiClient.getCameras(undefined, undefined, 1, 100).catch(() => null);
        if (camRes?.data) {
          const list: Camera[] = Array.isArray(camRes.data)
            ? camRes.data
            : camRes.data.data || camRes.data.items || [];
          const found = list.find((c) => c.id === id);
          if (found) setCamera(found);
        }

        // Tải weather log mới nhất cho camera này
        const logRes = await apiClient.getWeatherLogs(180, 5).catch(() => null);
        if (logRes?.data) {
          const allLogs: WeatherLog[] = Array.isArray(logRes.data)
            ? logRes.data
            : logRes.data.data || [];
          const camLog = allLogs.find((l) => l.cameraId === id);
          if (camLog) setLatestLog(camLog);
        }

        // Kiểm tra favorites
        const favRes = await apiClient.getFavorites().catch(() => null);
        if (favRes?.data) {
          const favs = favRes.data.items || favRes.data || [];
          setIsFavorite(Array.isArray(favs) && favs.some((f: any) => f.cameraId === id));
        }
      } catch (e) {
        console.error('CameraDetail fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await apiClient.removeFavorite(id!);
      } else {
        await apiClient.addFavorite(id!);
      }
      setIsFavorite(!isFavorite);
    } catch {
      // ignore
    }
  };

  const displayName = camera?.name || name || 'Camera';
  const trafficLabel = latestLog?.trafficLevel ?? '—';
  const rainLabel = latestLog
    ? (latestLog.isRaining ? `Mưa ${latestLog.rainLevel || ''}` : 'Không mưa')
    : '—';
  const rainColor = latestLog?.isRaining ? '#ffb4ab' : '#00f2ea';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết Camera</Text>
        <Pressable style={styles.favoriteButton} onPress={toggleFavorite}>
          <Icon name="favorite_border" color={isFavorite ? '#f87171' : '#d4e4fa'} size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <>
            {/* Camera Feed */}
            <View style={styles.cameraFrame}>
              {camera?.demoImageUrl ? (
                <Image source={{ uri: camera.demoImageUrl }} style={styles.cameraImage} />
              ) : (
                <View style={styles.noImageBox}>
                  <Icon name="videocam" color="#334155" size={48} />
                  <Text style={styles.noImageText}>Không có hình ảnh</Text>
                </View>
              )}
              <View style={styles.liveTag}>
                <View style={[styles.liveDot, { backgroundColor: camera?.status === 'Active' ? '#22c55e' : '#f87171' }]} />
                <Text style={styles.liveText}>{camera?.status === 'Active' ? 'TRỰC TIẾP' : 'NGOẠI TUYẾN'}</Text>
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.infoCard}>
              <Text style={styles.locationTitle}>{displayName}</Text>
              <Text style={styles.locationSubtitle}>
                {camera?.wardName ? `${camera.wardName}` : `ID: ${id}`}
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Icon name="traffic" color="#00f2ea" size={24} />
                  <Text style={styles.statValue}>{trafficLabel}</Text>
                  <Text style={styles.statLabel}>Mật độ giao thông</Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="rainy" color={rainColor} size={24} />
                  <Text style={[styles.statValue, { color: rainColor }]}>{rainLabel}</Text>
                  <Text style={styles.statLabel}>Thời tiết hiện tại</Text>
                </View>
              </View>
            </View>

            {/* User Report Action */}
            <Pressable 
              style={styles.reportButton}
              onPress={() => router.push({
                pathname: '/report-weather' as any,
                params: { cameraId: id, cameraName: displayName }
              })}
            >
              <Icon name="warning" color="#003735" size={20} />
              <Text style={styles.reportButtonText}>Báo cáo thời tiết khu vực này</Text>
            </Pressable>

            {/* AI Analysis */}
            {latestLog && (
              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <Icon name="smart_toy" color="#00f2ea" size={20} />
                  <Text style={styles.aiTitle}>Phân tích AI</Text>
                  <Text style={styles.aiConfidence}>{Math.round((latestLog.confidence || 0) * 100)}% độ chính xác</Text>
                </View>
                {latestLog.aiReason ? (
                  <Text style={styles.aiDesc}>{latestLog.aiReason}</Text>
                ) : (
                  <Text style={styles.aiDesc}>
                    {latestLog.isRaining
                      ? `Phát hiện mưa mức "${latestLog.rainLevel}". Giao thông: ${latestLog.trafficLevel}.`
                      : `Không phát hiện mưa. Giao thông: ${latestLog.trafficLevel}.`}
                  </Text>
                )}
                <Text style={styles.aiTimestamp}>
                  Cập nhật: {latestLog.timeAgo}
                </Text>
              </View>
            )}

            {/* Camera info */}
            {camera && (
              <View style={styles.metaCard}>
                <Text style={styles.metaTitle}>Thông tin Camera</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>ID:</Text>
                  <Text style={styles.metaValue}>{camera.id}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Vĩ độ:</Text>
                  <Text style={styles.metaValue}>{camera.latitude?.toFixed(5)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Kinh độ:</Text>
                  <Text style={styles.metaValue}>{camera.longitude?.toFixed(5)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Trạng thái:</Text>
                  <Text style={[styles.metaValue, { color: camera.status === 'Active' ? '#00f2ea' : '#ffb4ab' }]}>
                    {camera.status}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#d4e4fa', textAlign: 'center' },
  favoriteButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  cameraFrame: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1c2b3c', position: 'relative' },
  cameraImage: { width: '100%', height: '100%' },
  noImageBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  noImageText: { color: '#334155', fontSize: 13 },
  liveTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(17,24,39,0.85)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  infoCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  locationTitle: { fontSize: 20, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  locationSubtitle: { fontSize: 14, color: '#b9cac8', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(5, 20, 36, 0.5)', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 15, fontWeight: '600', color: '#00f2ea', marginTop: 4, textTransform: 'capitalize' },
  statLabel: { fontSize: 11, color: '#849492', textAlign: 'center' },
  aiCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)', gap: 8 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#00f2ea' },
  aiConfidence: { fontSize: 12, color: '#64748b' },
  aiDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22 },
  aiTimestamp: { fontSize: 11, color: '#64748b' },
  metaCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 10 },
  metaTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: '#849492' },
  metaValue: { fontSize: 13, color: '#d4e4fa', fontWeight: '500' },
  reportButton: { backgroundColor: '#00f2ea', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  reportButtonText: { color: '#003735', fontSize: 15, fontWeight: '700' },
});
