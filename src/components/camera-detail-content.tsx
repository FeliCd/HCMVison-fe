import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import { Camera, WeatherLog } from '@/types/api';
import { getCameraDisplayImage, mapLatestWeatherByCamera } from '@/utils/camera-weather';
import { formatRainLevel, formatTrafficLevel, formatWeatherAiReason } from '@/utils/weather-display';
import { formatCameraStatus } from '@/utils/admin-display';

interface CameraDetailContentProps {
  id: string;
  name?: string;
  onClose?: () => void;
}

export default function CameraDetailContent({ id, name, onClose }: CameraDetailContentProps) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [camera, setCamera] = useState<Camera | null>(null);
  const [latestLog, setLatestLog] = useState<WeatherLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [cameraResponse, weatherResponse] = await Promise.all([
          apiClient.getCameras(undefined, undefined, 1, 1000).catch(() => null),
          apiClient.getWeatherLogs(240, 500, true).catch(() => null),
        ]);

        if (cancelled) return;

        const foundCamera = cameraResponse?.data.data.find((item) => item.id === id) || null;
        const latestWeather = mapLatestWeatherByCamera(weatherResponse?.data.data || []).get(id) || null;
        setCamera(foundCamera);
        setLatestLog(latestWeather);

        if (isAuthenticated) {
          const favoriteResponse = await apiClient.getFavorites().catch(() => null);
          if (!cancelled) {
            const favorites = favoriteResponse?.data.items || [];
            setIsFavorite(favorites.some((favorite) => favorite.cameraId === id));
          }
        } else {
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('CameraDetail fetch error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  const displayImageUrl = useMemo(() => getCameraDisplayImage(camera, latestLog), [camera, latestLog]);

  const toggleFavorite = async () => {
    if (!isAuthenticated || favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await apiClient.removeFavorite(id);
      } else {
        await apiClient.addFavorite(id);
      }
      setIsFavorite((current) => !current);
    } catch (error) {
      console.warn('Favorite update failed', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const displayName = camera?.name || name || 'Camera';
  const trafficLabel = latestLog ? formatTrafficLevel(latestLog.trafficLevel) : 'Chưa có dữ liệu';
  const rainLabel = latestLog ? formatRainLevel(latestLog.rainLevel) : 'Chưa có dữ liệu';
  const rainColor = latestLog?.isRaining ? '#ffb4ab' : '#00f2ea';
  const isOnline = camera?.status === 'Active';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết camera
        </Text>
        {isAuthenticated ? (
          <Pressable style={styles.favoriteButton} onPress={toggleFavorite} disabled={favoriteLoading}>
            {favoriteLoading ? (
              <ActivityIndicator color="#f87171" size="small" />
            ) : (
              <Icon name="favorite_border" color={isFavorite ? '#f87171' : '#d4e4fa'} size={24} />
            )}
          </Pressable>
        ) : (
          <View style={styles.favoriteButton} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu camera...</Text>
          </View>
        ) : (
          <>
            <View style={styles.cameraFrame}>
              {displayImageUrl ? (
                <Image
                  source={{ uri: displayImageUrl }}
                  style={styles.cameraImage}
                  contentFit="cover"
                  transition={180}
                />
              ) : (
                <View style={styles.noImageBox}>
                  <Icon name="videocam" color="#334155" size={48} />
                  <Text style={styles.noImageText}>Chưa có hình ảnh</Text>
                </View>
              )}
              <View style={styles.liveTag}>
                <View style={[styles.liveDot, { backgroundColor: isOnline ? '#22c55e' : '#f87171' }]} />
                <Text style={styles.liveText}>{isOnline ? 'ĐANG HOẠT ĐỘNG' : 'NGOẠI TUYẾN'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.locationTitle}>{displayName}</Text>
              <Text style={styles.locationSubtitle}>{camera?.wardName || `ID: ${id}`}</Text>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Icon name="traffic" color="#00f2ea" size={24} />
                  <Text style={styles.statValue}>{trafficLabel}</Text>
                  <Text style={styles.statLabel}>Giao thông</Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="rainy" color={rainColor} size={24} />
                  <Text style={[styles.statValue, { color: rainColor }]}>{rainLabel}</Text>
                  <Text style={styles.statLabel}>Thời tiết</Text>
                </View>
              </View>
            </View>

            {isAuthenticated ? (
              <Pressable
                style={styles.reportButton}
                onPress={() =>
                  router.push({
                    pathname: '/report-weather' as any,
                    params: { cameraId: id, cameraName: displayName },
                  })
                }
              >
                <Icon name="warning" color="#003735" size={20} />
                <Text style={styles.reportButtonText}>Báo cáo tình trạng khu vực này</Text>
              </Pressable>
            ) : null}

            {latestLog && (
              <View style={styles.aiCard}>
                <View style={styles.aiHeader}>
                  <Icon name="smart_toy" color="#00f2ea" size={20} />
                  <Text style={styles.aiTitle}>Phân tích AI</Text>
                  <Text style={styles.aiConfidence}>{Math.round((latestLog.confidence || 0) * 100)}%</Text>
                </View>
                <Text style={styles.aiDesc}>{formatWeatherAiReason(latestLog)}</Text>
                <Text style={styles.aiTimestamp}>Cập nhật: {latestLog.timeAgo}</Text>
              </View>
            )}

            {camera && (
              <View style={styles.metaCard}>
                <Text style={styles.metaTitle}>Thông tin camera</Text>
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
                  <Text style={[styles.metaValue, { color: isOnline ? '#00f2ea' : '#ffb4ab' }]}>
                    {formatCameraStatus(camera.status)}
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
  noImageText: { color: '#64748b', fontSize: 13 },
  liveTag: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(17,24,39,0.85)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  infoCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  locationTitle: { fontSize: 20, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  locationSubtitle: { fontSize: 14, color: '#b9cac8', marginBottom: 20 },
  statsContainer: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: 'rgba(5, 20, 36, 0.5)', padding: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 15, fontWeight: '600', color: '#00f2ea', marginTop: 4, textTransform: 'capitalize', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#849492', textAlign: 'center' },
  reportButton: { backgroundColor: '#00f2ea', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  reportButtonText: { color: '#003735', fontSize: 15, fontWeight: '700' },
  aiCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)', gap: 8 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#00f2ea' },
  aiConfidence: { fontSize: 12, color: '#64748b' },
  aiDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22 },
  aiTimestamp: { fontSize: 11, color: '#64748b' },
  metaCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 10 },
  metaTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  metaLabel: { fontSize: 13, color: '#849492' },
  metaValue: { flex: 1, fontSize: 13, color: '#d4e4fa', fontWeight: '500', textAlign: 'right' },
});
