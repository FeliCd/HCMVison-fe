import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { router, useFocusEffect } from 'expo-router';

import { CameraImage } from '@/components/camera-image';
import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useCamera } from '@/hooks/useCamera';
import { getWards } from '@/services/location';
import { addFavorite, removeFavorite } from '@/services/misc';
import {
  CameraRainFilter,
  CameraStatusItem,
  CameraTrafficFilter,
  Ward,
} from '@/types/api';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

type CameraTab = 'all' | 'favorites' | 'area' | 'filters';
type SheetMode = 'area' | 'filters' | null;

const CAMERA_TABS: { key: CameraTab; label: string; icon: 'videocam' | 'favorite' | 'location_on' | 'tune' }[] = [
  { key: 'all', label: 'Tất cả', icon: 'videocam' },
  { key: 'favorites', label: 'Yêu thích', icon: 'favorite' },
  { key: 'area', label: 'Khu vực', icon: 'location_on' },
  { key: 'filters', label: 'Bộ lọc', icon: 'tune' },
];

const RAIN_FILTERS: { value: CameraRainFilter; label: string; icon: 'rainy' | 'check_circle' | 'water_damage' }[] = [
  { value: 'all', label: 'Tất cả', icon: 'water_damage' },
  { value: 'raining', label: 'Đang mưa', icon: 'rainy' },
  { value: 'not_raining', label: 'Không mưa', icon: 'check_circle' },
];

const TRAFFIC_FILTERS: { value: CameraTrafficFilter; label: string; icon: 'traffic' | 'check_circle' }[] = [
  { value: 'all', label: 'Tất cả', icon: 'traffic' },
  { value: 'jammed', label: 'Kẹt xe', icon: 'traffic' },
  { value: 'not_jammed', label: 'Không kẹt', icon: 'check_circle' },
];

const BOTTOM_TAB_HEIGHT = 64;
const BOTTOM_TAB_FALLBACK_MARGIN = 12;
const BOTTOM_TAB_EXTRA_SPACE = 32;

function cameraImageUrl(item: CameraStatusItem) {
  return (item.streamUrl || item.imageUrl || '').replace(/^http:\/\//i, 'https://');
}

function hasTrafficIssue(item: CameraStatusItem) {
  return item.trafficLevel === 'jam' || item.trafficLevel === 'slow' || item.isTrafficJammed;
}

function normalizeSearchText(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function getTrafficDisplay(item: CameraStatusItem) {
  if (!item.hasFreshWeatherData) {
    return { color: '#94a3b8', text: 'Chưa có dữ liệu' };
  }

  const level = (item.trafficLevel || '').toLowerCase();
  if (level === 'jam' || level === 'slow' || item.isTrafficJammed) {
    return {
      color: '#ffb4ab',
      text: level === 'jam' || level === 'slow' ? formatTrafficLevel(level) : 'Kẹt xe',
    };
  }

  if (level === 'clear') {
    return { color: '#22c55e', text: 'Không kẹt' };
  }

  return { color: '#94a3b8', text: 'Chưa xác định' };
}

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const {
    cameraStatusItems,
    cameraStatusTotal,
    loading,
    error,
    getCameraStatus,
  } = useCamera();

  const [activeTab, setActiveTab] = useState<CameraTab>('all');
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [searchText, setSearchText] = useState('');
  const [areaSearchText, setAreaSearchText] = useState('');
  const [selectedWardId, setSelectedWardId] = useState<string | undefined>();
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | undefined>();
  const [rainFilter, setRainFilter] = useState<CameraRainFilter>('all');
  const [trafficFilter, setTrafficFilter] = useState<CameraTrafficFilter>('all');
  const [wards, setWards] = useState<Ward[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [imageRefreshAt, setImageRefreshAt] = useState(() => Date.now());
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  const selectedWard = useMemo(
    () => wards.find((ward) => ward.id === selectedWardId),
    [selectedWardId, wards]
  );

  const areaLabel = selectedWard?.name || selectedDistrictName;
  const hasActiveFilters = Boolean(areaLabel) || rainFilter !== 'all' || trafficFilter !== 'all';
  const isFavoriteTab = activeTab === 'favorites';
  const bottomContentPadding = BOTTOM_TAB_HEIGHT + Math.max(insets.bottom, BOTTOM_TAB_FALLBACK_MARGIN) + BOTTOM_TAB_EXTRA_SPACE;

  const statusQuery = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      wardId: selectedWardId,
      districtName: selectedWardId ? undefined : selectedDistrictName,
      rain: rainFilter,
      traffic: trafficFilter,
      favoriteOnly: isFavoriteTab,
    }),
    [isFavoriteTab, rainFilter, selectedDistrictName, selectedWardId, trafficFilter]
  );

  const refreshStatus = useCallback(async () => {
    if (isFavoriteTab && !isAuthenticated) {
      return;
    }

    await getCameraStatus(statusQuery);
    setImageRefreshAt(Date.now());
  }, [getCameraStatus, isAuthenticated, isFavoriteTab, statusQuery]);

  useFocusEffect(
    useCallback(() => {
      void refreshStatus().catch(() => {});
      const interval = setInterval(() => void refreshStatus().catch(() => {}), 15_000);
      return () => clearInterval(interval);
    }, [refreshStatus])
  );

  useEffect(() => {
    let mounted = true;
    setWardsLoading(true);

    getWards()
      .then((response) => {
        if (mounted) {
          setWards(response.data);
        }
      })
      .catch(() => {
        if (mounted) {
          setWards([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setWardsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) {
      return cameraStatusItems;
    }

    const query = normalizeSearchText(searchText.trim());
    return cameraStatusItems.filter((item) => {
      const haystack = [
        item.cameraId,
        item.cameraName,
        item.wardName,
        item.districtName,
        item.rainLevel,
        item.trafficLevel,
      ]
        .filter(Boolean)
        .join(' ')
        .concat(' ', formatTrafficLevel(item.trafficLevel), ' ', formatRainLevel(item.rainLevel))
        .toLowerCase();

      return normalizeSearchText(haystack).includes(query);
    });
  }, [cameraStatusItems, searchText]);

  const rainingCount = useMemo(
    () => cameraStatusItems.filter((item) => item.isRaining).length,
    [cameraStatusItems]
  );
  const trafficIssueCount = useMemo(
    () => cameraStatusItems.filter(hasTrafficIssue).length,
    [cameraStatusItems]
  );

  const districtNames = useMemo(() => {
    const names = new Set<string>();
    wards.forEach((ward) => {
      if (ward.districtName) {
        names.add(ward.districtName);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [wards]);

  const visibleWards = useMemo(() => {
    const query = normalizeSearchText(areaSearchText.trim());
    if (!query) {
      return wards.slice(0, 80);
    }

    return wards
      .filter((ward) => normalizeSearchText(`${ward.name} ${ward.districtName}`).includes(query))
      .slice(0, 80);
  }, [areaSearchText, wards]);

  const resetFilters = useCallback(() => {
    setSelectedWardId(undefined);
    setSelectedDistrictName(undefined);
    setRainFilter('all');
    setTrafficFilter('all');
    setAreaSearchText('');
  }, []);

  const handleSelectDistrict = useCallback((districtName: string) => {
    setSelectedDistrictName(districtName);
    setSelectedWardId(undefined);
    setSheetMode(null);
    setActiveTab('area');
  }, []);

  const handleSelectWard = useCallback((ward: Ward) => {
    setSelectedWardId(ward.id);
    setSelectedDistrictName(undefined);
    setSheetMode(null);
    setActiveTab('area');
  }, []);

  const handleToggleFavorite = useCallback(
    async (item: CameraStatusItem) => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        setFavoriteBusyId(item.cameraId);
        if (item.isFavorite) {
          await removeFavorite(item.cameraId);
        } else {
          await addFavorite(item.cameraId);
        }
        await refreshStatus();
      } catch (favoriteError) {
        console.warn('Failed to update favorite camera', favoriteError);
      } finally {
        setFavoriteBusyId(null);
      }
    },
    [isAuthenticated, refreshStatus]
  );

  const emptyTitle = useMemo(() => {
    if (isFavoriteTab && !isAuthenticated) return 'Đăng nhập để xem camera yêu thích';
    if (isFavoriteTab) return 'Chưa có camera yêu thích';
    if (activeTab === 'area' && areaLabel) return 'Khu vực này chưa có camera phù hợp';
    if (hasActiveFilters) return 'Không có camera khớp bộ lọc';
    return 'Chưa có dữ liệu camera';
  }, [activeTab, areaLabel, hasActiveFilters, isAuthenticated, isFavoriteTab]);

  const emptyDescription = useMemo(() => {
    if (isFavoriteTab && !isAuthenticated) return 'Lưu các camera thường xem để mở nhanh hơn trên điện thoại.';
    if (isFavoriteTab) return 'Bấm biểu tượng tim trên camera để đưa vào danh sách này.';
    if (hasActiveFilters) return 'Thử xóa bớt điều kiện lọc hoặc chọn khu vực khác.';
    return 'Kéo để làm mới hoặc thử lại sau ít phút.';
  }, [hasActiveFilters, isAuthenticated, isFavoriteTab]);

  const renderCameraCard = (item: CameraStatusItem, index: number) => {
    const hasFreshData = item.hasFreshWeatherData;
    const rainColor = !hasFreshData ? '#94a3b8' : item.isRaining ? '#38bdf8' : '#22c55e';
    const trafficDisplay = getTrafficDisplay(item);
    const imageUrl = cameraImageUrl(item);

    return (
      <Animated.View
        key={item.cameraId}
        entering={FadeInUp.duration(420).delay(Math.min(index, 8) * 35)}
      >
        <Pressable
          style={styles.cameraCard}
          onPress={() => router.push({ pathname: '/camera-detail', params: { id: item.cameraId, name: item.cameraName } })}
        >
          <View style={styles.cameraImageFrame}>
            <CameraImage
              sources={{ weatherImageUrl: imageUrl }}
              refreshKey={imageRefreshAt}
              style={styles.cameraImage}
              accessibilityLabel={`Ảnh camera ${item.cameraName}`}
              fallback={
                <View style={styles.imageFallback}>
                  <Icon name="videocam" color="#64748b" size={28} />
                </View>
              }
            />
            <View style={styles.freshBadge}>
              <View style={[styles.liveDot, { backgroundColor: hasFreshData ? '#22c55e' : '#94a3b8' }]} />
              <Text style={styles.freshBadgeText}>{item.timeAgo || 'Chưa có dữ liệu'}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardTitleCopy}>
                <Text style={styles.cameraTitle} numberOfLines={2}>{item.cameraName}</Text>
                <Text style={styles.cameraArea} numberOfLines={1}>
                  {item.wardName || item.districtName || 'Khu vực chưa xác định'}
                </Text>
              </View>
              <Pressable
                style={styles.favoriteButton}
                onPress={(event) => {
                  event.stopPropagation();
                  void handleToggleFavorite(item);
                }}
              >
                {favoriteBusyId === item.cameraId ? (
                  <ActivityIndicator color="#ffb4ab" size="small" />
                ) : (
                  <Icon
                    name={item.isFavorite ? 'favorite' : 'favorite_border'}
                    color={item.isFavorite ? '#ffb4ab' : '#94a3b8'}
                    size={20}
                  />
                )}
              </Pressable>
            </View>

            <View style={styles.badgeRow}>
              <StatusBadge
                icon="rainy"
                color={rainColor}
                text={!hasFreshData ? 'Chưa có dữ liệu' : item.isRaining ? formatRainLevel(item.rainLevel) : 'Không mưa'}
              />
              <StatusBadge
                icon="traffic"
                color={trafficDisplay.color}
                text={trafficDisplay.text}
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 14) }]}>
      <Animated.View entering={FadeInUp.duration(420)} style={styles.header}>
        <Text style={styles.headerEyebrow}>HCMVision</Text>
        <Text style={styles.headerTitle}>Camera</Text>
      </Animated.View>

      <View style={styles.tabBar}>
        {CAMERA_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === 'area') setSheetMode('area');
                if (tab.key === 'filters') setSheetMode('filters');
              }}
            >
              <Icon name={tab.icon} color={isActive ? '#003735' : '#b9cac8'} size={16} />
              <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.quickStatsRow}>
        <MetricPill icon="videocam" label="Camera" value={cameraStatusTotal} color="#00f2ea" />
        <MetricPill icon="rainy" label="Đang mưa" value={rainingCount} color="#38bdf8" />
        <MetricPill icon="traffic" label="Kẹt xe" value={trafficIssueCount} color="#ffb4ab" />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm camera, phường hoặc khu vực"
          placeholderTextColor="#64748b"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
        />
        {searchText ? (
          <Pressable onPress={() => setSearchText('')} style={styles.iconButton}>
            <Icon name="close" color="#94a3b8" size={18} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filterSummary}>
        {areaLabel ? <SummaryChip icon="location_on" label={areaLabel} /> : null}
        {rainFilter !== 'all' ? (
          <SummaryChip icon="rainy" label={rainFilter === 'raining' ? 'Đang mưa' : 'Không mưa'} />
        ) : null}
        {trafficFilter !== 'all' ? (
          <SummaryChip icon="traffic" label={trafficFilter === 'jammed' ? 'Kẹt xe' : 'Không kẹt'} />
        ) : null}
        {hasActiveFilters ? (
          <Pressable style={styles.resetChip} onPress={resetFilters}>
            <Icon name="refresh" color="#00f2ea" size={13} />
            <Text style={styles.resetChipText}>Xóa lọc</Text>
          </Pressable>
        ) : (
          <Text style={styles.noFilterText}>Dữ liệu 30 phút gần nhất</Text>
        )}
      </View>

      {activeTab === 'area' && (
        <Pressable style={styles.inlineAction} onPress={() => setSheetMode('area')}>
          <Icon name="location_on" color="#00f2ea" size={17} />
          <Text style={styles.inlineActionText}>{areaLabel ? 'Đổi khu vực' : 'Chọn khu vực'}</Text>
          <Icon name="chevron_right" color="#00f2ea" size={16} />
        </Pressable>
      )}

      {activeTab === 'filters' && (
        <Pressable style={styles.inlineAction} onPress={() => setSheetMode('filters')}>
          <Icon name="tune" color="#00f2ea" size={17} />
          <Text style={styles.inlineActionText}>Mở bộ lọc mưa và giao thông</Text>
          <Icon name="chevron_right" color="#00f2ea" size={16} />
        </Pressable>
      )}

      {isFavoriteTab && !isAuthenticated ? (
        <LoginPrompt bottomPadding={bottomContentPadding} />
      ) : error ? (
        <StateBox
          icon="warning"
          title="Không tải được camera"
          description={error}
          actionText="Thử lại"
          onAction={() => void refreshStatus().catch(() => {})}
          style={{ paddingBottom: bottomContentPadding }}
        />
      ) : loading && filteredItems.length === 0 ? (
        <View style={[styles.loadingBox, { paddingBottom: bottomContentPadding }]}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Đang tải camera...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <StateBox
          icon={isFavoriteTab ? 'favorite_border' : 'videocam'}
          title={emptyTitle}
          description={emptyDescription}
          actionText={hasActiveFilters ? 'Xóa lọc' : undefined}
          onAction={hasActiveFilters ? resetFilters : undefined}
          style={{ paddingBottom: bottomContentPadding }}
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomContentPadding }]}
          scrollIndicatorInsets={{ bottom: bottomContentPadding }}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map(renderCameraCard)}
        </ScrollView>
      )}

      <Modal transparent animationType="slide" visible={sheetMode !== null} onRequestClose={() => setSheetMode(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSheetMode(null)} />
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHandle} />
            {sheetMode === 'area' ? (
              <AreaSheet
                areaSearchText={areaSearchText}
                districtNames={districtNames}
                onAreaSearchTextChange={setAreaSearchText}
                onSelectDistrict={handleSelectDistrict}
                onSelectWard={handleSelectWard}
                selectedDistrictName={selectedDistrictName}
                selectedWardId={selectedWardId}
                visibleWards={visibleWards}
                wardsLoading={wardsLoading}
              />
            ) : (
              <FilterSheet
                rainFilter={rainFilter}
                trafficFilter={trafficFilter}
                onRainFilterChange={setRainFilter}
                onTrafficFilterChange={setTrafficFilter}
                onApply={() => setSheetMode(null)}
                onReset={resetFilters}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatusBadge({ icon, color, text }: { icon: 'rainy' | 'traffic'; color: string; text: string }) {
  return (
    <View style={[styles.statusBadge, { borderColor: `${color}55`, backgroundColor: `${color}14` }]}>
      <Icon name={icon} color={color} size={13} />
      <Text style={[styles.statusBadgeText, { color }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function MetricPill({ icon, label, value, color }: { icon: 'videocam' | 'rainy' | 'traffic'; label: string; value: number; color: string }) {
  return (
    <View style={styles.metricPill}>
      <Icon name={icon} color={color} size={15} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function SummaryChip({ icon, label }: { icon: 'location_on' | 'rainy' | 'traffic'; label: string }) {
  return (
    <View style={styles.summaryChip}>
      <Icon name={icon} color="#00f2ea" size={13} />
      <Text style={styles.summaryChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function LoginPrompt({ bottomPadding }: { bottomPadding: number }) {
  return (
    <StateBox
      icon="favorite_border"
      title="Đăng nhập để xem camera yêu thích"
      description="Lưu camera thường xem và mở nhanh khi cần kiểm tra đường đi."
      actionText="Đăng nhập"
      onAction={() => router.push('/login')}
      style={{ paddingBottom: bottomPadding }}
    />
  );
}

function StateBox({
  icon,
  title,
  description,
  actionText,
  onAction,
  style,
}: {
  icon: 'warning' | 'videocam' | 'favorite_border';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.stateBox, style]}>
      <View style={styles.stateIcon}>
        <Icon name={icon} color="#94a3b8" size={30} />
      </View>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateDescription}>{description}</Text>
      {actionText && onAction ? (
        <Pressable style={styles.stateButton} onPress={onAction}>
          <Text style={styles.stateButtonText}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AreaSheet({
  areaSearchText,
  districtNames,
  onAreaSearchTextChange,
  onSelectDistrict,
  onSelectWard,
  selectedDistrictName,
  selectedWardId,
  visibleWards,
  wardsLoading,
}: {
  areaSearchText: string;
  districtNames: string[];
  onAreaSearchTextChange: (text: string) => void;
  onSelectDistrict: (districtName: string) => void;
  onSelectWard: (ward: Ward) => void;
  selectedDistrictName?: string;
  selectedWardId?: string;
  visibleWards: Ward[];
  wardsLoading: boolean;
}) {
  return (
    <>
      <Text style={styles.sheetTitle}>Chọn khu vực</Text>
      <View style={styles.sheetSearch}>
        <Icon name="search" color="#94a3b8" size={17} />
        <TextInput
          style={styles.sheetSearchInput}
          placeholder="Tìm phường hoặc quận"
          placeholderTextColor="#64748b"
          value={areaSearchText}
          onChangeText={onAreaSearchTextChange}
        />
      </View>

      <Text style={styles.sheetSectionLabel}>Quận / khu vực</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
        {districtNames.map((districtName) => {
          const active = selectedDistrictName === districtName;
          return (
            <Pressable
              key={districtName}
              style={[styles.optionChip, active && styles.optionChipActive]}
              onPress={() => onSelectDistrict(districtName)}
            >
              <Text style={[styles.optionChipText, active && styles.optionChipTextActive]} numberOfLines={1}>
                {districtName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sheetSectionLabel}>Phường</Text>
      {wardsLoading ? (
        <ActivityIndicator color="#00f2ea" style={styles.sheetLoading} />
      ) : (
        <ScrollView style={styles.wardList} showsVerticalScrollIndicator={false}>
          {visibleWards.map((ward) => {
            const active = selectedWardId === ward.id;
            return (
              <Pressable
                key={ward.id}
                style={[styles.wardRow, active && styles.wardRowActive]}
                onPress={() => onSelectWard(ward)}
              >
                <View style={styles.wardTextGroup}>
                  <Text style={styles.wardName}>{ward.name}</Text>
                  <Text style={styles.wardDistrict}>{ward.districtName || 'TP.HCM'}</Text>
                </View>
                {active ? <Icon name="check_circle" color="#00f2ea" size={18} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </>
  );
}

function FilterSheet({
  rainFilter,
  trafficFilter,
  onRainFilterChange,
  onTrafficFilterChange,
  onApply,
  onReset,
}: {
  rainFilter: CameraRainFilter;
  trafficFilter: CameraTrafficFilter;
  onRainFilterChange: (filter: CameraRainFilter) => void;
  onTrafficFilterChange: (filter: CameraTrafficFilter) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <>
      <Text style={styles.sheetTitle}>Bộ lọc camera</Text>
      <Text style={styles.sheetSectionLabel}>Mưa</Text>
      <View style={styles.filterGrid}>
        {RAIN_FILTERS.map((filter) => {
          const active = rainFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={[styles.filterOption, active && styles.filterOptionActive]}
              onPress={() => onRainFilterChange(filter.value)}
            >
              <Icon name={filter.icon} color={active ? '#003735' : '#b9cac8'} size={16} />
              <Text style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sheetSectionLabel}>Giao thông</Text>
      <View style={styles.filterGrid}>
        {TRAFFIC_FILTERS.map((filter) => {
          const active = trafficFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              style={[styles.filterOption, active && styles.filterOptionActive]}
              onPress={() => onTrafficFilterChange(filter.value)}
            >
              <Icon name={filter.icon} color={active ? '#003735' : '#b9cac8'} size={16} />
              <Text style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sheetActions}>
        <Pressable style={styles.secondarySheetButton} onPress={onReset}>
          <Text style={styles.secondarySheetButtonText}>Xóa lọc</Text>
        </Pressable>
        <Pressable style={styles.primarySheetButton} onPress={onApply}>
          <Text style={styles.primarySheetButtonText}>Áp dụng</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  header: { marginBottom: 12 },
  headerEyebrow: { color: '#00f2ea', fontSize: 12, fontWeight: '800', letterSpacing: 0 },
  headerTitle: { color: '#d4e4fa', fontSize: 28, fontWeight: '900', letterSpacing: 0 },
  tabBar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(25, 30, 40, 0.66)',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  tabButtonActive: { backgroundColor: '#00f2ea' },
  tabButtonText: { color: '#b9cac8', fontSize: 11, fontWeight: '800' },
  tabButtonTextActive: { color: '#003735' },
  quickStatsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metricPill: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(25, 30, 40, 0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metricValue: { color: '#d4e4fa', fontSize: 15, fontWeight: '900' },
  metricLabel: { color: '#849492', fontSize: 10, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#d4e4fa', fontSize: 14, marginLeft: 8, paddingVertical: 0 },
  iconButton: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  filterSummary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 30, marginBottom: 8 },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
    borderRadius: 7,
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.24)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  summaryChipText: { color: '#d4e4fa', fontSize: 11, fontWeight: '800', maxWidth: 220 },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  resetChipText: { color: '#00f2ea', fontSize: 11, fontWeight: '800' },
  noFilterText: { color: '#849492', fontSize: 12, fontWeight: '600' },
  inlineAction: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.22)',
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  inlineActionText: { flex: 1, color: '#d4e4fa', fontSize: 13, fontWeight: '800' },
  list: { flex: 1 },
  listContent: { gap: 10 },
  cameraCard: {
    flexDirection: 'row',
    height: 148,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cameraImageFrame: { width: 126, height: '100%', backgroundColor: '#e2e8f0', position: 'relative' },
  cameraImage: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' },
  freshBadge: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  freshBadgeText: { flex: 1, color: '#ffffff', fontSize: 9, fontWeight: '800' },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  cardTitleCopy: { flex: 1, minWidth: 0 },
  cameraTitle: { color: '#0f172a', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  cameraArea: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 3, fontWeight: '600' },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeRow: { gap: 6 },
  statusBadge: {
    minHeight: 30,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  statusBadgeText: { flex: 1, fontSize: 11, fontWeight: '900' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#849492', fontSize: 14, fontWeight: '700' },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  stateIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: 'rgba(25, 30, 40, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { color: '#d4e4fa', textAlign: 'center', fontSize: 17, lineHeight: 23, fontWeight: '900' },
  stateDescription: { color: '#849492', textAlign: 'center', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  stateButton: { marginTop: 4, minHeight: 44, borderRadius: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00f2ea' },
  stateButtonText: { color: '#003735', fontSize: 13, fontWeight: '900' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.48)' },
  bottomSheet: {
    maxHeight: '78%',
    backgroundColor: '#0b1f2f',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#64748b', marginBottom: 12 },
  sheetTitle: { color: '#d4e4fa', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  sheetSearch: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sheetSearchInput: { flex: 1, color: '#d4e4fa', fontSize: 14, marginLeft: 8, paddingVertical: 0 },
  sheetSectionLabel: { color: '#849492', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0, marginBottom: 8, marginTop: 4 },
  horizontalChips: { gap: 8, paddingRight: 12, paddingBottom: 12 },
  optionChip: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipActive: { backgroundColor: '#00f2ea', borderColor: '#00f2ea' },
  optionChipText: { color: '#b9cac8', fontSize: 12, fontWeight: '800', maxWidth: 140 },
  optionChipTextActive: { color: '#003735' },
  sheetLoading: { paddingVertical: 30 },
  wardList: { maxHeight: 300 },
  wardRow: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.035)',
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wardRowActive: { borderColor: 'rgba(0, 242, 234, 0.65)', backgroundColor: 'rgba(0, 242, 234, 0.1)' },
  wardTextGroup: { flex: 1, minWidth: 0 },
  wardName: { color: '#d4e4fa', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  wardDistrict: { color: '#849492', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  filterGrid: { gap: 8, marginBottom: 12 },
  filterOption: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  filterOptionActive: { backgroundColor: '#00f2ea', borderColor: '#00f2ea' },
  filterOptionText: { color: '#b9cac8', fontSize: 13, fontWeight: '900' },
  filterOptionTextActive: { color: '#003735' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondarySheetButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondarySheetButtonText: { color: '#00f2ea', fontSize: 13, fontWeight: '900' },
  primarySheetButton: { flex: 1, minHeight: 46, borderRadius: 8, backgroundColor: '#00f2ea', alignItems: 'center', justifyContent: 'center' },
  primarySheetButtonText: { color: '#003735', fontSize: 13, fontWeight: '900' },
});
