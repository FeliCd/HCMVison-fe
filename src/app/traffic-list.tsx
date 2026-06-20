import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function TrafficListScreen() {
  const insets = useSafeAreaInsets();
  const { logs, loading, error, getWeatherLogs } = useWeather();

  useEffect(() => {
    getWeatherLogs(60, 200);
  }, [getWeatherLogs]);

  // Lọc unique camera (lấy log mới nhất cho mỗi camera) và chỉ lấy kẹt xe
  const latestPerCamera = new Map<string, typeof logs[0]>();
  logs.forEach(log => {
    if (!latestPerCamera.has(log.cameraId)) {
      latestPerCamera.set(log.cameraId, log);
    }
  });

  const jamItems = Array.from(latestPerCamera.values()).filter(l => l.trafficLevel === 'jam');
  const slowItems = Array.from(latestPerCamera.values()).filter(l => l.trafficLevel === 'slow');

  const getTrafficChipStyle = (level: string) => {
    if (level === 'jam') return { chip: styles.chipRed, text: styles.chipRedText, label: 'Kẹt cứng' };
    return { chip: styles.chipYellow, text: styles.chipYellowText, label: 'Ùn ứ chậm' };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Điểm kẹt xe</Text>
        <Pressable style={styles.backButton} onPress={() => getWeatherLogs(60, 200)}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && logs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : jamItems.length === 0 && slowItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check_circle" color="#22c55e" size={48} />
            <Text style={styles.emptyTitle}>Giao thông thông thoáng</Text>
            <Text style={styles.emptyDesc}>Không phát hiện kẹt xe hoặc ùn ứ tại bất kỳ camera nào trong 60 phút qua.</Text>
          </View>
        ) : (
          <>
            {/* Stat Summary */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#ffb4ab' }]}>{jamItems.length}</Text>
                <Text style={styles.statLabel}>Kẹt cứng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>{slowItems.length}</Text>
                <Text style={styles.statLabel}>Ùn ứ chậm</Text>
              </View>
            </Animated.View>

            {/* Jam section */}
            {jamItems.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Đang kẹt xe nghiêm trọng</Text>
                {jamItems.map((item, idx) => {
                  const chipInfo = getTrafficChipStyle(item.trafficLevel);
                  return (
                    <Animated.View key={item.cameraId} entering={FadeInUp.duration(600).delay(100 + idx * 80)}>
                      <Pressable
                        style={styles.itemCard}
                        onPress={() => router.push({ pathname: '/camera-detail', params: { id: item.cameraId, name: item.cameraName } })}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{item.cameraName || item.cameraId}</Text>
                          <View style={chipInfo.chip}>
                            <Text style={chipInfo.text}>{chipInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc}>
                          {item.wardName ? `${item.wardName} • ` : ''}{item.isRaining ? `Mưa ${item.rainLevel} • ` : ''}Cập nhật: {item.timeAgo}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </>
            )}

            {/* Slow section */}
            {slowItems.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: jamItems.length > 0 ? 24 : 0 }]}>Ùn ứ cục bộ</Text>
                {slowItems.map((item, idx) => {
                  const chipInfo = getTrafficChipStyle(item.trafficLevel);
                  return (
                    <Animated.View key={item.cameraId} entering={FadeInUp.duration(600).delay(200 + idx * 80)}>
                      <Pressable
                        style={styles.itemCard}
                        onPress={() => router.push({ pathname: '/camera-detail', params: { id: item.cameraId, name: item.cameraName } })}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{item.cameraName || item.cameraId}</Text>
                          <View style={chipInfo.chip}>
                            <Text style={chipInfo.text}>{chipInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc}>
                          {item.wardName ? `${item.wardName} • ` : ''}{item.isRaining ? `Mưa ${item.rainLevel} • ` : ''}Cập nhật: {item.timeAgo}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#849492', marginBottom: 8, marginTop: 8 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(25, 30, 40, 0.55)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#b9cac8' },
  itemCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', flex: 1, marginRight: 16 },
  chipRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipRedText: { color: '#ffb4ab', fontSize: 12, fontWeight: '600' },
  chipYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipYellowText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  itemDesc: { fontSize: 14, color: '#b9cac8', lineHeight: 20 },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#22c55e' },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
