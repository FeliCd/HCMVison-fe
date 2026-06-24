import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useWeather } from '@/hooks/useWeather';
import { WeatherLog } from '@/types/api';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

function WarningCard({ item, urgent }: { item: WeatherLog; urgent?: boolean }) {
  const isTraffic = item.trafficLevel === 'jam' || item.trafficLevel === 'slow';
  const title = isTraffic
    ? item.trafficLevel === 'jam'
      ? 'Kẹt xe nghiêm trọng'
      : 'Giao thông chậm'
    : item.rainLevel === 'heavy'
      ? 'Mưa lớn'
      : 'Có mưa';

  return (
    <Pressable
      style={[styles.warningCard, urgent ? styles.urgentCard : item.isRaining ? styles.warningCardAmber : styles.warningCardRed]}
      onPress={() =>
        router.push({
          pathname: '/camera-detail' as any,
          params: { id: item.cameraId, name: item.cameraName || item.cameraId },
        })
      }
    >
      <View style={styles.warningCardHeader}>
        <View style={[styles.warningIconContainer, urgent && styles.urgentIconContainer]}>
          <Icon name={isTraffic ? 'traffic' : 'rainy'} color={urgent ? '#ffdad6' : item.isRaining ? '#f59e0b' : '#ffb4ab'} size={urgent ? 24 : 18} />
        </View>
        <View style={styles.warningCardTextContainer}>
          <Text style={urgent ? styles.urgentTitle : item.isRaining ? styles.warningCardTitleAmber : styles.warningCardTitle}>
            {title}
          </Text>
          <Text style={urgent ? styles.urgentTime : styles.warningCardTime}>
            {item.timeAgo || 'Vừa xong'} • {item.cameraName || item.cameraId}
          </Text>
        </View>
      </View>
      <Text style={urgent ? styles.urgentDesc : styles.warningCardDesc}>
        {item.aiReason || `Mưa: ${formatRainLevel(item.rainLevel)} • Giao thông: ${formatTrafficLevel(item.trafficLevel)}.`}
      </Text>
      {!!item.wardName && (
        <View style={styles.urgentMeta}>
          <Icon name="location_on" color={urgent ? '#ffb4ab' : '#94a3b8'} size={14} />
          <Text style={urgent ? styles.urgentMetaText : styles.warningMetaText}>{item.wardName}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function WarningScreen() {
  const insets = useSafeAreaInsets();
  const { logs, loading, error, getWeatherLogs } = useWeather();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    getWeatherLogs(180, 100, true);
  }, [getWeatherLogs]);

  const urgentItems = logs.filter((item) => item.rainLevel === 'heavy' || item.trafficLevel === 'jam');
  const warningItems = logs
    .filter((item) => !urgentItems.includes(item) && ((item.isRaining && item.rainLevel !== 'none') || item.trafficLevel === 'slow'))
    .slice(0, 12);

  const handleSubscribe = () => {
    if (isAuthenticated) {
      router.push('/profile/subscriptions' as any);
    } else {
      router.push('/login');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>
        Cảnh báo
      </Animated.Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View entering={FadeInUp.duration(500).delay(80)} style={styles.subscribeCard}>
          <View style={styles.subscribeText}>
            <Text style={styles.subscribeTitle}>Nhận cảnh báo theo khu vực</Text>
            <Text style={styles.subscribeDesc}>Chọn phường muốn theo dõi để nhận thông báo khi có mưa.</Text>
          </View>
          <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
            <Icon name="notifications" color="#003735" size={18} />
            <Text style={styles.subscribeButtonText}>Đăng ký</Text>
          </Pressable>
        </Animated.View>

        {loading && logs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ffb4ab" />
            <Text style={styles.loadingText}>Đang tải cảnh báo...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : urgentItems.length === 0 && warningItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check_circle" color="#22c55e" size={48} />
            <Text style={styles.emptyTitle}>Không có cảnh báo</Text>
            <Text style={styles.emptyDesc}>Tình trạng giao thông và thời tiết bình thường trong 3 giờ qua.</Text>
          </View>
        ) : (
          <>
            {urgentItems.slice(0, 5).map((item, idx) => (
              <Animated.View key={`urgent-${item.id}-${item.cameraId}`} entering={FadeInUp.duration(700).delay(100 + idx * 80)}>
                <WarningCard item={item} urgent />
              </Animated.View>
            ))}

            {warningItems.length > 0 && (
              <Animated.Text entering={FadeInUp.duration(500).delay(250)} style={styles.sectionTitle}>
                Các cảnh báo khác
              </Animated.Text>
            )}

            {warningItems.map((item, idx) => (
              <Animated.View key={`warning-${item.id}-${item.cameraId}`} entering={FadeInUp.duration(600).delay(350 + idx * 60)}>
                <WarningCard item={item} />
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 20 },
  content: { flex: 1 },
  subscribeCard: {
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.24)',
    padding: 14,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscribeText: { flex: 1 },
  subscribeTitle: { color: '#d4e4fa', fontSize: 15, fontWeight: '800' },
  subscribeDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4, lineHeight: 18 },
  subscribeButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#00f2ea',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscribeButtonText: { color: '#003735', fontSize: 13, fontWeight: '800' },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#22c55e' },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#b9cac8', marginBottom: 14, marginTop: 4 },
  urgentCard: {
    backgroundColor: 'rgba(147, 0, 10, 0.35)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.25)',
    gap: 12,
  },
  urgentIconContainer: {
    backgroundColor: 'rgba(255, 180, 171, 0.22)',
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  urgentTitle: { fontSize: 17, fontWeight: '800', color: '#ffdad6' },
  urgentTime: { fontSize: 12, color: '#ffb4ab', marginTop: 4, fontWeight: '500' },
  urgentDesc: { fontSize: 14, lineHeight: 22, color: '#ffdad6' },
  urgentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  urgentMetaText: { fontSize: 12, color: '#ffb4ab' },
  warningCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
  },
  warningCardRed: { borderColor: 'rgba(255, 180, 171, 0.25)' },
  warningCardAmber: { borderColor: 'rgba(245, 158, 11, 0.25)' },
  warningCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  warningIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  warningCardTextContainer: { flex: 1 },
  warningCardTitle: { fontSize: 16, fontWeight: '700', color: '#ffb4ab' },
  warningCardTitleAmber: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  warningCardTime: { fontSize: 12, color: '#b9cac8', marginTop: 2 },
  warningCardDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22 },
  warningMetaText: { fontSize: 12, color: '#94a3b8' },
});
