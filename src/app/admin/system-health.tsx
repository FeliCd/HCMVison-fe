import { checkCameraHealth, getFailedCameras } from '@/services/admin';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';

import { formatCameraStatus } from '@/utils/admin-display';

export default function SystemHealthScreen() {
  const insets = useSafeAreaInsets();
  const healthQuery = useQuery({
    queryKey: ['admin', 'camera-health'],
    queryFn: async () => (await checkCameraHealth()).data,
  });
  const failedQuery = useQuery({
    queryKey: ['admin', 'failed-cameras'],
    queryFn: async () => (await getFailedCameras()).data,
  });

  const isLoading = healthQuery.isLoading || failedQuery.isLoading;
  const summary = healthQuery.data?.summary;
  const cameras = healthQuery.data?.details ?? [];
  const failedCameras = failedQuery.data?.items ?? [];
  const hasError = healthQuery.isError || failedQuery.isError;
  const total = summary?.totalCameras ?? 0;
  const active = summary?.active ?? 0;
  const uptime = total > 0 ? Math.round((active / total) * 100) : 0;

  const refresh = async () => {
    await Promise.all([healthQuery.refetch(), failedQuery.refetch()]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Sức khỏe hệ thống</Text>
        <Pressable onPress={refresh} style={styles.headerButton}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      {isLoading && !summary ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.stateText}>Đang kiểm tra hệ thống...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {hasError ? (
            <Pressable style={styles.errorBox} onPress={refresh}>
              <Icon name="warning" color="#fca5a5" size={20} />
              <Text style={styles.errorText}>Không tải đủ dữ liệu. Chạm để thử lại.</Text>
            </Pressable>
          ) : null}

          <View style={styles.summaryGrid}>
            <SummaryItem label="Hoạt động" value={active} color="#00f2ea" />
            <SummaryItem label="Ngoại tuyến" value={summary?.offline ?? 0} color="#ffb4ab" />
            <SummaryItem label="Bảo trì" value={summary?.maintenance ?? 0} color="#fbbf24" />
            <SummaryItem label="Khả dụng" value={`${uptime}%`} color="#86efac" />
          </View>

          <Text style={styles.sectionTitle}>Trạng thái camera</Text>
          {cameras.length ? (
            cameras.map((camera) => (
              <View key={camera.cameraId} style={styles.cameraRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(camera.status) }]} />
                <View style={styles.cameraCopy}>
                  <Text style={styles.cameraName}>{camera.cameraName}</Text>
                  <Text style={styles.cameraMeta}>
                    {formatCameraStatus(camera.status)}
                    {camera.lastSeen ? ` • Kiểm tra: ${new Date(camera.lastSeen).toLocaleString('vi-VN')}` : ''}
                  </Text>
                  {camera.reason ? <Text style={styles.cameraReason}>{camera.reason}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có dữ liệu camera chi tiết.</Text>
          )}

          <Text style={[styles.sectionTitle, styles.failedTitle]}>Camera cần chú ý</Text>
          {failedCameras.length ? (
            failedCameras.map((camera) => (
              <View key={camera.cameraId} style={[styles.cameraRow, styles.failedRow]}>
                <Icon name="warning" color="#fca5a5" size={18} />
                <View style={styles.cameraCopy}>
                  <Text style={styles.cameraName}>{camera.cameraName}</Text>
                  <Text style={styles.cameraMeta}>
                    Chưa nhận dữ liệu gần đây • {camera.failureCount} lần
                  </Text>
                  {camera.lastError ? <Text style={styles.cameraReason}>{camera.lastError}</Text> : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Không có camera lỗi trong lần kiểm tra này.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function statusColor(status: string): string {
  if (status === 'Active') return '#00f2ea';
  if (status === 'Maintenance') return '#fbbf24';
  return '#ffb4ab';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#d4e4fa', fontSize: 18, fontWeight: '800' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateText: { color: '#94a3b8', fontSize: 14 },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
  },
  errorText: { flex: 1, color: '#fecaca', fontSize: 13 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: {
    width: '48.5%',
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(22,37,41,0.6)',
  },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { marginTop: 5, color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  sectionTitle: { marginTop: 16, color: '#d4e4fa', fontSize: 14, fontWeight: '800' },
  failedTitle: { color: '#fca5a5' },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(22,37,41,0.6)',
  },
  failedRow: { borderWidth: 1, borderColor: 'rgba(248,113,113,0.16)' },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  cameraCopy: { flex: 1, gap: 4 },
  cameraName: { color: '#d4e4fa', fontSize: 14, fontWeight: '800' },
  cameraMeta: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  cameraReason: { color: '#fbbf24', fontSize: 12, lineHeight: 17 },
  emptyText: { color: '#94a3b8', fontSize: 13, paddingVertical: 10 },
});
