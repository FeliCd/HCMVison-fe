import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useCamera } from '@/hooks/useCamera';
import { useFavorites } from '@/hooks/useFavorites';
import { useWeather } from '@/hooks/useWeather';
import { apiClient } from '@/services/api';
import { Favorite } from '@/types/api';
import { CameraWithWeather, mergeCamerasWithWeather } from '@/utils/camera-weather';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'all' | 'favorites' | 'raining' | 'congested';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: IconName;
  color: string;
}

const TABS: TabConfig[] = [
  { key: 'all', label: 'Tất cả', icon: 'videocam', color: '#00f2ea' },
  { key: 'favorites', label: 'Yêu thích', icon: 'favorite', color: '#f472b6' },
  { key: 'raining', label: 'Đang mưa', icon: 'rainy', color: '#38bdf8' },
  { key: 'congested', label: 'Kẹt xe', icon: 'traffic', color: '#ffb4ab' },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { rainingCameras, logs, loading, error, getRainingCameras, getWeatherLogs } = useWeather();
  const { cameras, getCameras, loading: camerasLoading } = useCamera();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [wardPickerVisible, setWardPickerVisible] = useState(false);

  // Favorites state from React Query
  const {
    favorites,
    favoriteIds,
    loading: favoritesLoading,
    togglingId,
    toggleFavorite,
  } = useFavorites();

  const numColumns = width >= 768 ? 4 : 1;
  const gap = 16;
  const cardWidth =
    width >= 768 ? Math.floor((width - 64 - (numColumns - 1) * gap) / numColumns) : ('100%' as any);

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    getRainingCameras(30);
    getWeatherLogs(180, 500, true);
    getCameras(undefined, 1, 1000);
  }, [getCameras, getRainingCameras, getWeatherLogs]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const congestedCount = logs.filter(
    (l) => l.trafficLevel === 'jam' || l.trafficLevel === 'slow'
  ).length;
  const rainingCount = rainingCameras.length;

  const cameraCards = useMemo(
    () => mergeCamerasWithWeather(cameras, logs),
    [cameras, logs]
  );

  // Collect distinct wards from cameras
  const wards = useMemo(() => {
    const wardSet = new Set<string>();
    cameraCards.forEach((cam) => {
      const ward = cam.wardName || '';
      if (ward) wardSet.add(ward);
    });
    return Array.from(wardSet).sort();
  }, [cameraCards]);

  // Filter cameras based on active tab, search text, and selected ward
  const filteredCameras = useMemo(() => {
    let result = cameraCards;

    // Tab filter
    if (activeTab === 'favorites') {
      result = result.filter((cam) => favoriteIds.has(cam.id));
    } else if (activeTab === 'raining') {
      result = result.filter((cam) => cam.isRaining === true);
    } else if (activeTab === 'congested') {
      result = result.filter(
        (cam) => cam.trafficLevel === 'jam' || cam.trafficLevel === 'slow'
      );
    }

    // Ward filter
    if (selectedWard) {
      result = result.filter((cam) => {
        const wardName = cam.wardName || '';
        return wardName === selectedWard || wardName.toLowerCase().includes(selectedWard.toLowerCase());
      });
    }

    // Search text filter
    if (searchText) {
      const query = searchText.toLowerCase();
      result = result.filter((cam) => {
        const nameMatch = cam.name ? cam.name.toLowerCase().includes(query) : false;
        const wardMatch = cam.wardName ? cam.wardName.toLowerCase().includes(query) : false;
        const idMatch = cam.id ? cam.id.toLowerCase().includes(query) : false;
        return nameMatch || wardMatch || idMatch;
      });
    }

    // Sort by name
    return [...result].sort((a, b) => {
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [cameraCards, activeTab, favoriteIds, selectedWard, searchText]);

  // Group filtered cameras by ward
  const groupedCameras = useMemo(() => {
    const groups: Record<string, CameraWithWeather[]> = {};
    filteredCameras.forEach(cam => {
      const ward = cam.wardName || 'Khu vực chưa xác định';
      if (!groups[ward]) groups[ward] = [];
      groups[ward].push(cam);
    });
    
    // Sort keys so regions appear in order
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === 'Khu vực chưa xác định') return 1;
      if (b === 'Khu vực chưa xác định') return -1;
      return a.localeCompare(b);
    });
    
    return sortedKeys.map(key => ({
      title: key,
      data: groups[key]
    }));
  }, [filteredCameras]);

  // ── Favorite toggle ───────────────────────────────────────────────────────

  const handleToggleFavorite = useCallback(
    async (cam: CameraWithWeather) => {
      if (!user) {
        router.push('/login');
        return;
      }
      await toggleFavorite(cam);
    },
    [user, toggleFavorite]
  );


  // ── Render helpers ────────────────────────────────────────────────────────

  const isLoading =
    (camerasLoading && cameras.length === 0) || (activeTab === 'favorites' && favoritesLoading);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>
        Tình trạng hiện tại
      </Animated.Text>

      {/* Stat Cards */}
      <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.statsRow}>
        <StatCard
          icon="rainy"
          iconColor="#00f2ea"
          iconBg="rgba(0,242,234,0.08)"
          value={rainingCount}
          label="Điểm ngập/mưa"
          loading={loading}
        />
        <StatCard
          icon="traffic"
          iconColor="#ffb4ab"
          iconBg="rgba(255,180,171,0.1)"
          value={congestedCount}
          label="Điểm kẹt xe"
          loading={loading}
          valueStyle={styles.statValueWarning}
        />
        <StatCard
          icon="favorite"
          iconColor="#f472b6"
          iconBg="rgba(244,114,182,0.08)"
          value={favorites.length}
          label="Yêu thích"
          loading={favoritesLoading}
          valueStyle={styles.statValuePink}
        />
      </Animated.View>

      {/* Tabs */}
      <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && { borderColor: tab.color, backgroundColor: `${tab.color}18` }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon name={tab.icon} color={activeTab === tab.key ? tab.color : '#64748b'} size={15} />
              <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Search row */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.filterRow}>
          <View style={styles.searchContainer}>
            <Icon name="search" color="#94a3b8" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo tên, tuyến đường..."
              placeholderTextColor="#64748b"
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
            />
            {searchText ? (
              <Pressable onPress={() => setSearchText('')} style={styles.clearSearchBtn}>
                <Icon name="close" color="#94a3b8" size={16} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={[styles.districtBtn, selectedWard ? styles.districtBtnActive : null]}
            onPress={() => setWardPickerVisible(true)}
          >
            <Icon name="location_on" color={selectedWard ? '#00f2ea' : '#94a3b8'} size={16} />
            <Text style={[styles.districtBtnText, selectedWard ? styles.districtBtnTextActive : null]} numberOfLines={1}>
              {selectedWard || 'Khu vực'}
            </Text>
            <Icon name="expand_more" color={selectedWard ? '#00f2ea' : '#64748b'} size={14} />
          </Pressable>
        </Animated.View>

        {/* Section header */}
        <Animated.View entering={FadeInUp.duration(500).delay(250)} style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {TABS.find((t) => t.key === activeTab)?.label} ({filteredCameras.length})
          </Text>
          <View style={styles.viewModeToggle}>
            <Pressable
              style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Icon name="grid_view" color={viewMode === 'grid' ? '#0f172a' : '#94a3b8'} size={18} />
            </Pressable>
            <Pressable
              style={[styles.viewModeBtn, viewMode === 'list' && styles.viewModeBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Icon name="view_list" color={viewMode === 'list' ? '#0f172a' : '#94a3b8'} size={18} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Camera list / states */}
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : activeTab === 'favorites' && !user ? (
          <EmptyState
            icon="lock"
            title="Chưa đăng nhập"
            subtitle="Đăng nhập để xem danh sách yêu thích của bạn"
            actionLabel="Đăng nhập"
            onAction={() => router.push('/login')}
          />
        ) : filteredCameras.length === 0 ? (
          <EmptyState
            icon={activeTab === 'favorites' ? 'favorite_border' : activeTab === 'raining' ? 'rainy' : activeTab === 'congested' ? 'traffic' : 'videocam'}
            title={
              activeTab === 'favorites'
                ? 'Chưa có yêu thích'
                : activeTab === 'raining'
                ? 'Không có điểm mưa'
                : activeTab === 'congested'
                ? 'Không có điểm kẹt xe'
                : 'Không tìm thấy camera'
            }
            subtitle={
              activeTab === 'favorites'
                ? 'Nhấn biểu tượng ❤️ trên camera để thêm vào yêu thích'
                : 'Không có dữ liệu phù hợp với bộ lọc hiện tại'
            }
          />
        ) : (
          <View style={{ gap: 24 }}>
            {groupedCameras.map((group, groupIdx) => (
              <Animated.View key={group.title} entering={FadeInDown.duration(500).delay(Math.min(groupIdx, 5) * 50)}>
                <View style={styles.groupHeader}>
                  <Icon name="place" color="#00f2ea" size={18} />
                  <Text style={styles.groupTitle}>{group.title} ({group.data.length})</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {group.data.map((cam, idx) => (
                    <View
                      key={cam.id}
                      style={{ width: viewMode === 'grid' ? cardWidth : '100%' }}
                    >
                      <CameraCard
                        cam={cam}
                        viewMode={viewMode}
                        isFavorite={favoriteIds.has(cam.id)}
                        isToggling={togglingId === cam.id}
                        onToggleFavorite={() => handleToggleFavorite(cam)}
                        onPress={() =>
                          router.push({ pathname: '/camera-detail', params: { id: cam.id, name: cam.name } })
                        }
                      />
                    </View>
                  ))}
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ward picker modal */}
      <WardPicker
        visible={wardPickerVisible}
        wards={wards}
        selected={selectedWard}
        onSelect={(d) => {
          setSelectedWard(d);
          setWardPickerVisible(false);
        }}
        onClose={() => setWardPickerVisible(false)}
      />

    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
  loading?: boolean;
  valueStyle?: any;
}

function StatCard({ icon, iconColor, iconBg, value, label, loading, valueStyle }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <Icon name={icon} color={iconColor} size={18} />
      </View>
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <Text style={[styles.statValue, valueStyle ?? { color: iconColor }]}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Camera card ────────────────────────────────────────────────────────────────

interface CameraCardProps {
  cam: CameraWithWeather;
  viewMode: 'grid' | 'list';
  isFavorite: boolean;
  isToggling: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
}

function CameraCard({ cam, viewMode, isFavorite, isToggling, onToggleFavorite, onPress }: CameraCardProps) {
  const isOnline = cam.status === 'Active';
  const isRaining = cam.isRaining === true;
  const isCongested = cam.trafficLevel === 'jam' || cam.trafficLevel === 'slow';

  return (
    <Pressable
      style={viewMode === 'grid' ? styles.newCameraCard : styles.listCameraCard}
      onPress={onPress}
    >
      {/* Image */}
      <View style={viewMode === 'grid' ? styles.newCameraImageContainer : styles.listCameraImageContainer}>
        {cam.displayImageUrl ? (
          <Image
            source={{ uri: cam.displayImageUrl }}
            style={styles.newCameraImage}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View style={styles.newImagePlaceholder}>
            <Icon name="image" color="#cbd5e1" size={viewMode === 'grid' ? 40 : 28} />
          </View>
        )}

        {/* Status badge */}
        <View style={styles.onlineBadge}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#f43f5e' }]} />
          <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>

        {/* Weather/traffic badges */}
        {isRaining && (
          <View style={[styles.weatherBadge, { left: 8 }]}>
            <Icon name="rainy" color="#38bdf8" size={11} />
            <Text style={[styles.weatherBadgeText, { color: '#38bdf8' }]}>
              {formatRainLevel(cam.rainLevel)}
            </Text>
          </View>
        )}
        {isCongested && (
          <View style={[styles.weatherBadge, { left: isRaining ? 85 : 8 }]}>
            <Icon name="traffic" color="#ffb4ab" size={11} />
            <Text style={[styles.weatherBadgeText, { color: '#ffb4ab' }]}>
              {formatTrafficLevel(cam.trafficLevel)}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        {cam.timeAgo && (
          <View style={styles.timestampBadge}>
            <Text style={styles.timestampText}>{cam.timeAgo}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.newCameraInfo}>
        <View style={styles.newCameraTitleRow}>
          <Text style={styles.newCameraTitle} numberOfLines={1}>{cam.name}</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onToggleFavorite(); }}
            style={styles.favBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isToggling ? (
              <ActivityIndicator size={14} color="#f472b6" />
            ) : (
              <Icon name={isFavorite ? 'favorite' : 'favorite_border'} color={isFavorite ? '#f472b6' : '#94a3b8'} size={16} />
            )}
          </Pressable>
        </View>
        <View style={styles.newCameraLocationRow}>
          <Icon name="location_on" color="#94a3b8" size={13} />
          <Text style={styles.newCameraLocationText} numberOfLines={1}>
            {cam.wardName || 'Chưa xác định'}
          </Text>
        </View>
        {cam.rainLevel && cam.rainLevel !== 'none' ? (
          <Text style={styles.newCameraIdText}>
            Mưa: {formatRainLevel(cam.rainLevel)} • GT: {formatTrafficLevel(cam.trafficLevel)}
          </Text>
        ) : (
          <Text style={[styles.newCameraIdText, { color: '#475569' }]}>ID: {cam.id}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.emptyBox}>
      <Icon name={icon} color="#334155" size={48} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptyText}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.emptyActionBtn} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}



// ── Ward picker ────────────────────────────────────────────────────────────

interface WardPickerProps {
  visible: boolean;
  wards: string[];
  selected: string;
  onSelect: (d: string) => void;
  onClose: () => void;
}

function WardPicker({ visible, wards, selected, onSelect, onClose }: WardPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Chọn khu vực</Text>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* All wards option */}
            <Pressable
              style={[styles.districtOption, !selected && styles.districtOptionActive]}
              onPress={() => onSelect('')}
            >
              <Icon name="public" color={!selected ? '#00f2ea' : '#64748b'} size={16} />
              <Text style={[styles.districtOptionText, !selected && styles.districtOptionTextActive]}>
                Tất cả khu vực
              </Text>
              {!selected && <Icon name="check" color="#00f2ea" size={16} />}
            </Pressable>

            {wards.length === 0 ? (
              <Text style={styles.noDistrictText}>Không có dữ liệu khu vực</Text>
            ) : (
              wards.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.districtOption, selected === d && styles.districtOptionActive]}
                  onPress={() => onSelect(d)}
                >
                  <Icon name="location_on" color={selected === d ? '#00f2ea' : '#64748b'} size={16} />
                  <Text style={[styles.districtOptionText, selected === d && styles.districtOptionTextActive]}>
                    {d}
                  </Text>
                  {selected === d && <Icon name="check" color="#00f2ea" size={16} />}
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 16, letterSpacing: 0 },
  content: { flex: 1 },

  // Stat cards
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: '#00f2ea' },
  statValueWarning: { fontSize: 24, fontWeight: '800', color: '#ffb4ab' },
  statValuePink: { fontSize: 24, fontWeight: '800', color: '#f472b6' },
  statLabel: { fontSize: 11, color: '#b9cac8', textAlign: 'center', fontWeight: '500' },

  // Tabs
  tabsContainer: { marginBottom: 16 },
  tabsScroll: { gap: 8, paddingRight: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(25,30,40,0.4)',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },

  // Search row
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25,30,40,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#d4e4fa',
    fontSize: 13,
    marginLeft: 8,
    height: '100%',
    padding: 0,
  },
  clearSearchBtn: { padding: 2 },
  districtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(25,30,40,0.55)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    height: 42,
    minWidth: 100,
    maxWidth: 130,
  },
  districtBtnActive: {
    borderColor: 'rgba(0,242,234,0.4)',
    backgroundColor: 'rgba(0,242,234,0.06)',
  },
  districtBtnText: { flex: 1, fontSize: 12, color: '#64748b', fontWeight: '500' },
  districtBtnTextActive: { color: '#00f2ea' },

  // Group styles
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: 4 },
  groupTitle: { fontSize: 16, fontWeight: '700', color: '#d4e4fa' },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#d4e4fa', letterSpacing: 0.2 },
  viewModeToggle: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 8, padding: 2 },
  viewModeBtn: { padding: 5, borderRadius: 6 },
  viewModeBtnActive: { backgroundColor: '#ffffff' },

  // States
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 14 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptyText: { color: '#334155', fontSize: 13, textAlign: 'center', maxWidth: 260 },
  emptyActionBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(0,242,234,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,242,234,0.3)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyActionText: { color: '#00f2ea', fontWeight: '700', fontSize: 14 },

  // Camera card (grid)
  newCameraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  newCameraImageContainer: {
    height: 150,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  // Camera card (list)
  listCameraCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    flexDirection: 'row',
    height: 96,
  },
  listCameraImageContainer: {
    width: 130,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  newCameraImage: { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  newImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Camera card badges
  onlineBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { color: '#334155', fontSize: 10, fontWeight: '600' },
  weatherBadge: {
    position: 'absolute',
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5,20,36,0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  weatherBadgeText: { fontSize: 10, fontWeight: '700' },
  timestampBadge: {
    position: 'absolute',
    bottom: 7,
    right: 7,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  timestampText: { color: '#ffffff', fontSize: 9, fontWeight: '600' },

  // Camera card info
  newCameraInfo: {
    padding: 10,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 6,
  },
  favBtn: { padding: 2 },
  newCameraLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },
  newCameraLocationText: { fontSize: 11, color: '#64748b', flex: 1 },
  newCameraIdText: { fontSize: 10, color: '#cbd5e1' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0d1f2d',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#d4e4fa',
    marginBottom: 14,
    textAlign: 'center',
  },
  districtOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  districtOptionActive: { backgroundColor: 'rgba(0,242,234,0.06)', borderRadius: 10 },
  districtOptionText: { flex: 1, fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  districtOptionTextActive: { color: '#00f2ea', fontWeight: '700' },
  noDistrictText: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
});
