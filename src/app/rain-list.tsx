import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function RainListScreen() {
  const insets = useSafeAreaInsets();
  const { rainingCameras, loading, error, getRainingCameras } = useWeather();

  useEffect(() => {
    getRainingCameras(60);
  }, []);

  // Phân loại theo mức độ mưa
  const heavyRain = rainingCameras.filter(c => c.rainLevel === 'heavy');
  const moderateRain = rainingCameras.filter(c => c.rainLevel !== 'heavy');

  const getRainChipStyle = (level: string) => {
    if (level === 'heavy') return { chip: styles.chipRed, text: styles.chipRedText, label: 'Mưa lớn' };
    if (level === 'moderate') return { chip: styles.chipYellow, text: styles.chipYellowText, label: 'Mưa vừa' };
    return { chip: styles.chipBlue, text: styles.chipBlueText, label: 'Mưa nhẹ' };
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Điểm ngập lụt</Text>
        <Pressable style={styles.backButton} onPress={() => getRainingCameras(60)}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading && rainingCameras.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : rainingCameras.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check_circle" color="#22c55e" size={48} />
            <Text style={styles.emptyTitle}>Không có điểm ngập</Text>
            <Text style={styles.emptyDesc}>Không phát hiện mưa tại bất kỳ camera nào trong 60 phút qua.</Text>
          </View>
        ) : (
          <>
            {/* Stat Summary */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{rainingCameras.length}</Text>
                <Text style={styles.statLabel}>Tổng điểm mưa</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#ffb4ab' }]}>{heavyRain.length}</Text>
                <Text style={styles.statLabel}>Mưa lớn</Text>
              </View>
            </Animated.View>

            {/* Heavy rain section */}
            {heavyRain.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Đang mưa lớn</Text>
                {heavyRain.map((cam, idx) => {
                  const chipInfo = getRainChipStyle(cam.rainLevel);
                  return (
                    <Animated.View key={cam.cameraId} entering={FadeInUp.duration(600).delay(100 + idx * 80)}>
                      <Pressable
                        style={styles.itemCard}
                        onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.cameraId, name: cam.cameraName } })}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{cam.cameraName}</Text>
                          <View style={chipInfo.chip}>
                            <Text style={chipInfo.text}>{chipInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc}>
                          Giao thông: {cam.trafficLevel} • Độ tin cậy: {Math.round(cam.confidence * 100)}%
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </>
            )}

            {/* Moderate / light rain */}
            {moderateRain.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: heavyRain.length > 0 ? 24 : 0 }]}>Mưa vừa / nhẹ</Text>
                {moderateRain.map((cam, idx) => {
                  const chipInfo = getRainChipStyle(cam.rainLevel);
                  return (
                    <Animated.View key={cam.cameraId} entering={FadeInUp.duration(600).delay(200 + idx * 80)}>
                      <Pressable
                        style={styles.itemCard}
                        onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.cameraId, name: cam.cameraName } })}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{cam.cameraName}</Text>
                          <View style={chipInfo.chip}>
                            <Text style={chipInfo.text}>{chipInfo.label}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDesc}>
                          Giao thông: {cam.trafficLevel} • Độ tin cậy: {Math.round(cam.confidence * 100)}%
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
  statValue: { fontSize: 28, fontWeight: '800', color: '#00f2ea' },
  statLabel: { fontSize: 12, color: '#b9cac8' },
  itemCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', flex: 1, marginRight: 16 },
  chipRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipRedText: { color: '#ffb4ab', fontSize: 12, fontWeight: '600' },
  chipYellow: { backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipYellowText: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  chipBlue: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  chipBlueText: { color: '#93c5fd', fontSize: 12, fontWeight: '600' },
  itemDesc: { fontSize: 14, color: '#b9cac8', lineHeight: 20 },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#22c55e' },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
