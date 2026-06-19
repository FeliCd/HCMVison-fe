import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';
import { FailedCamera } from '@/types/api';

interface HealthData {
  summary?: {
    TotalCameras?: number;
    Active?: number;
    Inactive?: number;
    Offline?: number;
  };
  cameras?: Array<{
    cameraId: string;
    cameraName: string;
    status: string;
    uptime?: number;
    lastSeen?: string;
  }>;
}

export default function SystemHealthScreen() {
  const insets = useSafeAreaInsets();
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [failedCameras, setFailedCameras] = useState<FailedCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, failedRes] = await Promise.allSettled([
        apiClient.checkCameraHealth(),
        apiClient.getFailedCameras(),
      ]);

      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value.data);
      }
      if (failedRes.status === 'fulfilled') {
        const data = failedRes.value.data;
        const list: FailedCamera[] = Array.isArray(data) ? data : data.items || data.data || [];
        setFailedCameras(list);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error('SystemHealth fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const summary = healthData?.summary;
  const total = summary?.TotalCameras ?? 0;
  const active = summary?.Active ?? 0;
  const inactive = summary?.Inactive ?? 0;
  const offline = summary?.Offline ?? 0;
  const uptime = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0';

  const getHealthDotColor = (status: string) => {
    if (status?.toLowerCase().includes('active') || status?.toLowerCase().includes('healthy')) return '#00f2ea';
    if (status?.toLowerCase().includes('warning') || status?.toLowerCase().includes('inactive')) return '#f59e0b';
    return '#ffb4ab';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Sức khỏe Hệ thống</Text>
        <Pressable style={styles.backButton} onPress={fetchData}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Đang kiểm tra hệ thống...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{active}</Text>
              <Text style={styles.summaryLabel}>Hoạt động</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>{inactive}</Text>
              <Text style={styles.summaryLabel}>Không hoạt động</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#ffb4ab' }]}>{offline}</Text>
              <Text style={styles.summaryLabel}>Ngoại tuyến</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: '#22c55e', fontSize: 18 }]}>{uptime}%</Text>
              <Text style={styles.summaryLabel}>Uptime</Text>
            </View>
          </View>

          {/* Camera Health List */}
          {healthData?.cameras && healthData.cameras.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Trạng thái Camera</Text>
              {healthData.cameras.map((cam) => (
                <View key={cam.cameraId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Icon name="videocam" color="#00f2ea" size={20} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{cam.cameraName}</Text>
                    <View style={[styles.healthDot, { backgroundColor: getHealthDotColor(cam.status) }]} />
                  </View>
                  <Text style={styles.cardDesc}>
                    ID: {cam.cameraId} • Status: {cam.status}
                    {cam.uptime !== undefined ? ` • Uptime: ${cam.uptime?.toFixed(1)}%` : ''}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Failed Cameras */}
          {failedCameras.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: '#ffb4ab' }]}>
                Camera lỗi ({failedCameras.length})
              </Text>
              {failedCameras.map((cam) => (
                <View key={cam.cameraId} style={[styles.card, styles.cardError]}>
                  <View style={styles.cardHeader}>
                    <Icon name="warning" color="#ffb4ab" size={20} />
                    <Text style={styles.cardTitle} numberOfLines={1}>{cam.cameraName}</Text>
                    <View style={[styles.healthDot, { backgroundColor: '#ffb4ab' }]} />
                  </View>
                  <Text style={styles.cardDesc}>
                    Lỗi: {cam.failureCount} lần • {cam.lastError}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Empty state */}
          {!healthData?.cameras?.length && failedCameras.length === 0 && (
            <View style={styles.emptyBox}>
              <Icon name="check_circle" color="#22c55e" size={48} />
              <Text style={styles.emptyText}>Không có dữ liệu chi tiết</Text>
              <Text style={styles.emptySubText}>
                Tổng camera: {total} | Đang hoạt động: {active}
              </Text>
            </View>
          )}

          {lastUpdated && (
            <Text style={styles.updatedText}>
              Cập nhật lúc: {lastUpdated.toLocaleTimeString()}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  scrollContent: { padding: 16, gap: 16 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#00f2ea' },
  summaryLabel: { fontSize: 10, color: '#849492', textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#d4e4fa', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  card: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardError: { borderColor: 'rgba(255,180,171,0.2)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#d4e4fa', flex: 1 },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  cardDesc: { fontSize: 12, color: '#b9cac8', marginLeft: 30 },
  emptyBox: { paddingTop: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: '#22c55e', fontSize: 16, fontWeight: '700' },
  emptySubText: { color: '#64748b', fontSize: 13 },
  updatedText: { color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
