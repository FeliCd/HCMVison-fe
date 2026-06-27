import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import { useCamera } from '@/hooks/useCamera';
import { useAuth } from '@/hooks/useAuth';
import { getFavorites, removeFavorite } from '@/services/misc';
import { Camera } from '@/types/api';
import { router, useFocusEffect } from 'expo-router';
import { CameraImage } from '@/components/camera-image';
import { mergeCamerasWithWeather } from '@/utils/camera-weather';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { rainingCameras, logs, loading, error, getRainingCameras, getWeatherLogs } = useWeather();
  const { cameras, getCameras, loading: camerasLoading } = useCamera();
  const { isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [imageRefreshAt, setImageRefreshAt] = useState(() => Date.now());
  const [rawFavorites, setRawFavorites] = useState<Camera[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');
  const [weatherFilter, setWeatherFilter] = useState<'all' | 'rain' | 'dry'>('all');
  const [trafficFilter, setTrafficFilter] = useState<'all' | 'jam' | 'fluid'>('all');

  const numColumns = width >= 768 ? 4 : 1;
  const gap = 16;
  const cardWidth = width >= 768 ? Math.floor((width - 64 - (numColumns - 1) * gap) / numColumns) : '100%';

  const refreshLiveData = useCallback(async () => {
    const promises: Promise<any>[] = [
      getRainingCameras(30),
      getWeatherLogs(180, 500, false),
      getCameras(undefined, 1, 1000),
    ];

    if (isAuthenticated) {
      promises.push(getFavorites().catch(() => null));
    }

    const results = await Promise.allSettled(promises);

    if (isAuthenticated) {
      const favResult = results[3];
      if (favResult && favResult.status === 'fulfilled' && favResult.value) {
        const rawFavs = favResult.value.data?.items || [];
        setRawFavorites(rawFavs.map((f: any) => f.camera).filter(Boolean));
      } else if (favResult && favResult.status === 'rejected') {
        setRawFavorites([]);
      }
    } else {
      setRawFavorites([]);
    }

    if (results.some((result) => result.status === 'fulfilled')) {
      setImageRefreshAt(Date.now());
    }
  }, [getCameras, getRainingCameras, getWeatherLogs, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void refreshLiveData();
      const interval = setInterval(() => void refreshLiveData(), 15_000);

      return () => clearInterval(interval);
    }, [refreshLiveData])
  );

  // Đếm điểm kẹt xe từ weather logs
  const congestedCount = logs.filter(
    (l) => l.trafficLevel === 'jam' || l.trafficLevel === 'slow'
  ).length;

  const rainingCount = rainingCameras.length;

  const favoriteCards = useMemo(
    () => mergeCamerasWithWeather(rawFavorites, logs),
    [rawFavorites, logs]
  );

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      setRawFavorites((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.warn('Failed to remove favorite', err);
    }
  };

  const districts = useMemo(() => {
    const list = new Set<string>();
    cameras.forEach((cam) => {
      if (cam.districtName) {
        list.add(cam.districtName.trim());
      }
    });
    return ['Tất cả', ...Array.from(list).sort()];
  }, [cameras]);

  // Lọc camera không phân biệt chữ hoa / chữ thường
  const cameraCards = useMemo(
    () => mergeCamerasWithWeather(cameras, logs),
    [cameras, logs]
  );

  const filteredCameras = useMemo(() => {
    return cameraCards.filter((cam) => {
      // 1. Text Search Filter
      if (searchText) {
        const query = searchText.toLowerCase();
        const nameMatch = cam.name ? cam.name.toLowerCase().includes(query) : false;
        const wardMatch = cam.wardName ? cam.wardName.toLowerCase().includes(query) : false;
        const idMatch = cam.id ? cam.id.toLowerCase().includes(query) : false;
        if (!nameMatch && !wardMatch && !idMatch) return false;
      }

      // 2. District Filter
      if (selectedDistrict !== 'Tất cả') {
        if (!cam.districtName || cam.districtName.trim() !== selectedDistrict) {
          return false;
        }
      }

      // 3. Weather Filter
      if (weatherFilter === 'rain' && !cam.isRaining) return false;
      if (weatherFilter === 'dry' && cam.isRaining) return false;

      // 4. Traffic Filter
      const isJam = cam.trafficLevel === 'jam' || cam.trafficLevel === 'slow';
      if (trafficFilter === 'jam' && !isJam) return false;
      if (trafficFilter === 'fluid' && isJam) return false;

      return true;
    });
  }, [cameraCards, searchText, selectedDistrict, weatherFilter, trafficFilter]);

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

        {/* Favorite Cameras Section */}
        {isAuthenticated ? (
          favoriteCards.length > 0 && (
            <Animated.View entering={FadeInUp.duration(500).delay(120)} style={styles.favSection}>
              <View style={styles.favSectionHeader}>
                <View style={styles.favSectionHeaderLeft}>
                  <Icon name="favorite" color="#ffb4ab" size={16} />
                  <Text style={styles.favSectionTitle}>Camera yêu thích</Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScrollContent}>
                {favoriteCards.map((cam) => {
                  const isOnline = cam.status === 'Active';
                  const isRaining = cam.isRaining;
                  const rainText = formatRainLevel(cam.rainLevel);
                  const trafficText = formatTrafficLevel(cam.trafficLevel);
                  const hasImage = !!cam.imageSources?.weatherImageUrl;

                  let statusColor = '#00f2ea';
                  if (cam.trafficLevel === 'jam') {
                    statusColor = '#ffb4ab';
                  } else if (cam.trafficLevel === 'slow') {
                    statusColor = '#f59e0b';
                  }
                  if (isRaining && cam.trafficLevel !== 'jam') {
                    statusColor = '#0ea5e9';
                  }

                  return (
                    <Pressable
                      key={`fav-${cam.id}`}
                      style={styles.favCameraCard}
                      onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.id, name: cam.name } })}
                    >
                      <View style={styles.favCameraImageContainer}>
                        <CameraImage
                          sources={cam.imageSources}
                          refreshKey={imageRefreshAt}
                          style={styles.favCameraImage}
                          accessibilityLabel={`Ảnh camera ${cam.name}`}
                          fallback={
                            <View style={styles.favImagePlaceholder}>
                              <Icon name="image" color="#64748b" size={24} />
                            </View>
                          }
                        />
                        
                        <View style={styles.onlineBadgeMini}>
                          <View style={[styles.statusDotMini, { backgroundColor: isOnline ? '#22c55e' : '#f43f5e' }]} />
                        </View>
                        
                        <Pressable style={styles.favHeartBtn} onPress={(e) => { e.stopPropagation(); handleRemoveFavorite(cam.id); }}>
                          <Icon name="favorite" color="#f87171" size={14} />
                        </Pressable>
                      </View>
                      
                      <View style={styles.favCameraInfo}>
                        <Text style={styles.favCameraTitle} numberOfLines={1}>{cam.name}</Text>
                        <View style={styles.favStatusRow}>
                          <Icon name={isRaining ? 'rainy' : 'traffic'} color={statusColor} size={10} />
                          <Text style={[styles.favStatusText, { color: statusColor }]} numberOfLines={1}>
                            {isRaining ? rainText : trafficText}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )
        ) : (
          <Animated.View entering={FadeInUp.duration(500).delay(120)} style={styles.favSectionEmpty}>
            <View style={styles.favEmptyCard}>
              <View style={styles.favEmptyLeft}>
                <View style={styles.favEmptyIconBg}>
                  <Icon name="favorite_border" color="#849492" size={18} />
                </View>
                <View style={styles.favEmptyTextContainer}>
                  <Text style={styles.favEmptyTitle}>Camera yêu thích</Text>
                  <Text style={styles.favEmptySubtitle}>Đăng nhập để lưu camera thường dùng</Text>
                </View>
              </View>
              <Pressable style={styles.favLoginBtn} onPress={() => router.push('/login')}>
                <Text style={styles.favLoginBtnText}>Đăng nhập</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Search Bar */}
        <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.searchContainer}>
          <Icon name="search" color="#94a3b8" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm camera theo tên, tuyến đường..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText('')} style={styles.clearSearchBtn}>
              <Icon name="close" color="#94a3b8" size={18} />
            </Pressable>
          ) : null}
          <View style={[styles.searchDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <Pressable onPress={() => setShowFilters(!showFilters)} style={styles.filterToggleBtn}>
            <Icon name="tune" color={showFilters ? '#00f2ea' : '#94a3b8'} size={20} />
          </Pressable>
        </Animated.View>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.filtersPanel}>
            {/* 1. Districts Horizontal List */}
            <Text style={styles.filterLabel}>Khu vực (Quận / Huyện)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.districtChipsRow}>
              {districts.map((district) => {
                const isActive = selectedDistrict === district;
                return (
                  <Pressable
                    key={district}
                    style={[styles.districtChip, isActive && styles.districtChipActive]}
                    onPress={() => setSelectedDistrict(district)}
                  >
                    <Text style={[styles.districtChipText, isActive && styles.districtChipTextActive]}>
                      {district}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.filterRowsContainer}>
              {/* 2. Weather filter */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Thời tiết</Text>
                <View style={styles.filterGroup}>
                  {(['all', 'rain', 'dry'] as const).map((mode) => {
                    const isActive = weatherFilter === mode;
                    let label = 'Tất cả';
                    if (mode === 'rain') label = 'Có mưa';
                    if (mode === 'dry') label = 'Không mưa';

                    return (
                      <Pressable
                        key={`weather-${mode}`}
                        style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                        onPress={() => setWeatherFilter(mode)}
                      >
                        <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 3. Traffic filter */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Giao thông</Text>
                <View style={styles.filterGroup}>
                  {(['all', 'jam', 'fluid'] as const).map((mode) => {
                    const isActive = trafficFilter === mode;
                    let label = 'Tất cả';
                    if (mode === 'jam') label = 'Kẹt xe';
                    if (mode === 'fluid') label = 'Thông thoáng';

                    return (
                      <Pressable
                        key={`traffic-${mode}`}
                        style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                        onPress={() => setTrafficFilter(mode)}
                      >
                        <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Clear Filters Indicator */}
            {(selectedDistrict !== 'Tất cả' || weatherFilter !== 'all' || trafficFilter !== 'all') && (
              <Pressable
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setSelectedDistrict('Tất cả');
                  setWeatherFilter('all');
                  setTrafficFilter('all');
                }}
              >
                <Icon name="refresh" color="#00f2ea" size={14} />
                <Text style={styles.clearFiltersBtnText}>Đặt lại bộ lọc</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Camera đang theo dõi ({filteredCameras.length})
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
        ) : filteredCameras.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="videocam" color="#64748b" size={40} />
            <Text style={styles.emptyText}>Không tìm thấy camera phù hợp</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {filteredCameras.map((cam, idx) => {
              const isOnline = cam.status === 'Active';
              
              return (
                <Animated.View key={cam.id} entering={FadeInUp.duration(600).delay(300 + Math.min(idx, 10) * 50)} style={{ width: viewMode === 'grid' ? cardWidth : '100%' }}>
                  <Pressable
                    style={viewMode === 'grid' ? styles.newCameraCard : styles.listCameraCard}
                    onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.id, name: cam.name } })}
                  >
                    <View style={viewMode === 'grid' ? styles.newCameraImageContainer : styles.listCameraImageContainer}>
                      <CameraImage
                        sources={cam.imageSources}
                        refreshKey={imageRefreshAt}
                        style={styles.newCameraImage}
                        accessibilityLabel={`Ảnh camera ${cam.name}`}
                        fallback={
                          <View style={styles.newImagePlaceholder}>
                            <Icon name="image" color="#cbd5e1" size={viewMode === 'grid' ? 48 : 32} />
                            {viewMode === 'grid' && <Text style={styles.newImagePlaceholderText}>Chưa có ảnh</Text>}
                          </View>
                        }
                      />
                      
                      
                      <View style={styles.onlineBadge}>
                        <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#f43f5e' }]} />
                        <Text style={styles.onlineText}>{isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</Text>
                      </View>
                      
                      <View style={styles.timestampBadge}>
                        <Text style={styles.timestampText}>{cam.timeAgo || 'Đang theo dõi'}</Text>
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
                      <Text style={styles.newCameraIdText}>
                        {cam.rainLevel
                          ? `Mưa: ${formatRainLevel(cam.rainLevel)} • Giao thông: ${formatTrafficLevel(cam.trafficLevel)}`
                          : `ID: ${cam.id}`}
                      </Text>
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
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 20, letterSpacing: 0 },
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
  newCameraImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#d4e4fa',
    fontSize: 14,
    marginLeft: 10,
    height: '100%',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  favSection: {
    marginBottom: 24,
  },
  favSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  favSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d4e4fa',
    letterSpacing: 0.2,
  },
  favScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  favCameraCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    backgroundColor: 'rgba(25, 30, 40, 0.45)',
  },
  favCameraImageContainer: {
    height: 90,
    backgroundColor: '#1e293b',
    position: 'relative',
  },
  favCameraImage: {
    width: '100%',
    height: '100%',
  },
  favImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeMini: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 3,
    borderRadius: 8,
  },
  statusDotMini: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  favHeartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 12,
  },
  favCameraInfo: {
    padding: 8,
    gap: 4,
  },
  favCameraTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4e4fa',
  },
  favStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favStatusText: {
    fontSize: 9,
    fontWeight: '700',
    flex: 1,
  },
  favSectionEmpty: {
    marginBottom: 24,
  },
  favEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(25, 30, 40, 0.45)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  favEmptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  favEmptyIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favEmptyTextContainer: {
    flex: 1,
  },
  favEmptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4e4fa',
    marginBottom: 2,
  },
  favEmptySubtitle: {
    fontSize: 11,
    color: '#849492',
    lineHeight: 15,
  },
  favLoginBtn: {
    backgroundColor: '#00f2ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  favLoginBtnText: {
    color: '#003735',
    fontSize: 11,
    fontWeight: '700',
  },
  searchDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 12,
  },
  filterToggleBtn: {
    padding: 6,
  },
  filtersPanel: {
    backgroundColor: 'rgba(25, 30, 40, 0.4)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#849492',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  districtChipsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  districtChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  districtChipActive: {
    backgroundColor: '#00f2ea',
    borderColor: '#00f2ea',
  },
  districtChipText: {
    color: '#849492',
    fontSize: 12,
    fontWeight: '600',
  },
  districtChipTextActive: {
    color: '#003735',
    fontWeight: '700',
  },
  filterRowsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  filterCol: {
    flex: 1,
    gap: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(0, 242, 234, 0.15)',
    borderWidth: 1,
    borderColor: '#00f2ea',
  },
  filterBtnText: {
    color: '#849492',
    fontSize: 11,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#00f2ea',
    fontWeight: '700',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)',
    marginTop: 8,
  },
  clearFiltersBtnText: {
    color: '#00f2ea',
    fontSize: 12,
    fontWeight: '700',
  },
});
