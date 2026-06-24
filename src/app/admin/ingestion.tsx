import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { apiClient } from '@/services/api';
import { formatIngestionStatus } from '@/utils/admin-display';

export default function IngestionJobsScreen() {
  const insets = useSafeAreaInsets();
  const statsQuery = useQuery({
    queryKey: ['admin', 'ingestion-stats', 7],
    queryFn: async () => (await apiClient.getIngestionStats(7)).data,
  });
  const jobsQuery = useQuery({
    queryKey: ['admin', 'ingestion-jobs', 1, 20],
    queryFn: async () => (await apiClient.getIngestionJobs(1, 20)).data,
  });

  const isLoading = statsQuery.isLoading || jobsQuery.isLoading;
  const isError = statsQuery.isError || jobsQuery.isError;
  const stats = statsQuery.data;
  const jobs = jobsQuery.data?.items ?? [];

  const refresh = async () => {
    await Promise.all([statsQuery.refetch(), jobsQuery.refetch()]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Đồng bộ dữ liệu</Text>
        <Pressable onPress={refresh} style={styles.headerButton}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      {isLoading && !stats ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.stateText}>Đang tải dữ liệu đồng bộ...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {isError ? (
            <Pressable style={styles.errorBox} onPress={refresh}>
              <Icon name="warning" color="#fca5a5" size={20} />
              <Text style={styles.errorText}>Không tải đủ dữ liệu. Chạm để thử lại.</Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionTitle}>Tổng quan 7 ngày</Text>
          <View style={styles.metricGrid}>
            <Metric label="Phiên đồng bộ" value={stats?.jobs.total ?? 0} color="#93c5fd" />
            <Metric label="Hoàn tất" value={stats?.jobs.completed ?? 0} color="#86efac" />
            <Metric label="Thất bại" value={stats?.jobs.failed ?? 0} color="#fca5a5" />
            <Metric label="Tỷ lệ thành công" value={`${Math.round(stats?.jobs.successRate ?? 0)}%`} color="#67e8f9" />
          </View>

          <View style={styles.attemptSummary}>
            <Text style={styles.attemptTitle}>Lần thử lấy dữ liệu</Text>
            <Text style={styles.attemptCopy}>
              Thành công: {stats?.attempts.successful ?? 0} • Thất bại: {stats?.attempts.failed ?? 0}
            </Text>
            <Text style={styles.attemptCopy}>
              Độ trễ trung bình: {Math.round(stats?.attempts.averageLatency ?? 0)} ms
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Các phiên gần đây</Text>
          {jobs.length ? (
            jobs.map((job) => (
              <View key={job.jobId} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <Text style={styles.jobId} numberOfLines={1}>
                    {job.jobType || 'Đồng bộ camera'}
                  </Text>
                  <StatusBadge status={job.status} />
                </View>
                <Text style={styles.jobMeta}>Mã phiên: {job.jobId}</Text>
                <Text style={styles.jobMeta}>Bắt đầu: {formatDate(job.startedAt || job.createdAt)}</Text>
                {job.endedAt ? <Text style={styles.jobMeta}>Kết thúc: {formatDate(job.endedAt)}</Text> : null}
                <Text style={styles.jobMeta}>
                  Lần thử: {job.successfulAttempts ?? 0} thành công / {job.failedAttempts ?? 0} thất bại
                </Text>
                {job.errorMessage ? <Text style={styles.errorMessage}>{job.errorMessage}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có phiên đồng bộ nào trong khoảng thời gian này.</Text>
          )}

          <Text style={styles.sectionTitle}>Camera có tỷ lệ lỗi cao</Text>
          {stats?.problematicCameras.length ? (
            stats.problematicCameras.map((camera) => (
              <View key={camera.cameraId} style={styles.problemRow}>
                <View>
                  <Text style={styles.problemId}>{camera.cameraId}</Text>
                  <Text style={styles.problemCopy}>
                    {camera.failedAttempts}/{camera.totalAttempts} lần thất bại
                  </Text>
                </View>
                <Text style={styles.problemRate}>{Math.round(camera.errorRate)}%</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có camera nào cần chú ý.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Completed' ? '#86efac' : status === 'Failed' ? '#fca5a5' : '#93c5fd';

  return (
    <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.statusText, { color }]}>{formatIngestionStatus(status)}</Text>
    </View>
  );
}

function formatDate(value?: string): string {
  if (!value) return 'Chưa có dữ liệu';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa có dữ liệu' : date.toLocaleString('vi-VN');
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
  errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 14, borderRadius: 8, backgroundColor: 'rgba(248,113,113,0.1)' },
  errorText: { flex: 1, color: '#fecaca', fontSize: 13 },
  sectionTitle: { marginTop: 10, color: '#d4e4fa', fontSize: 14, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48.5%', minHeight: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(22,37,41,0.6)' },
  metricValue: { fontSize: 21, fontWeight: '800' },
  metricLabel: { marginTop: 5, color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  attemptSummary: { marginTop: 6, padding: 14, borderRadius: 8, backgroundColor: 'rgba(147,197,253,0.08)', borderWidth: 1, borderColor: 'rgba(147,197,253,0.16)', gap: 4 },
  attemptTitle: { color: '#dbeafe', fontSize: 13, fontWeight: '800' },
  attemptCopy: { color: '#94a3b8', fontSize: 12 },
  jobCard: { padding: 14, borderRadius: 8, backgroundColor: 'rgba(22,37,41,0.6)', gap: 6 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  jobId: { flex: 1, color: '#d4e4fa', fontSize: 14, fontWeight: '800' },
  jobMeta: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  errorMessage: { color: '#fca5a5', fontSize: 12, lineHeight: 17 },
  problemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 8, backgroundColor: 'rgba(248,113,113,0.08)' },
  problemId: { color: '#fecaca', fontSize: 13, fontWeight: '800' },
  problemCopy: { marginTop: 3, color: '#fca5a5', fontSize: 12 },
  problemRate: { color: '#fca5a5', fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#94a3b8', fontSize: 13, paddingVertical: 10 },
});
