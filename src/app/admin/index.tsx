import { checkCameraHealth, getAdminAuditLogs } from '@/services/admin';
import { getWeatherLogs } from '@/services/weather';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminBottomBar } from '@/components/admin-bottom-bar';
import { Icon, IconName } from '@/components/icons';

import { formatAdminAuditLog } from '@/utils/admin-display';

const numberFormatter = new Intl.NumberFormat('vi-VN');

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const healthQuery = useQuery({
    queryKey: ['admin', 'camera-health'],
    queryFn: async () => (await checkCameraHealth()).data,
  });
  const weatherQuery = useQuery({
    queryKey: ['weather', 'logs', 180, 10],
    queryFn: async () => (await getWeatherLogs(180, 10)).data,
  });
  const auditQuery = useQuery({
    queryKey: ['admin', 'audit-logs', 8],
    queryFn: async () => (await getAdminAuditLogs(8)).data,
  });

  const isLoading = healthQuery.isLoading || weatherQuery.isLoading || auditQuery.isLoading;
  const error = healthQuery.error || weatherQuery.error || auditQuery.error;
  const summary = healthQuery.data?.summary;
  const weatherLogs = weatherQuery.data?.data ?? [];
  const congestedCount = weatherLogs.filter(
    (log) => log.trafficLevel === 'jam' || log.trafficLevel === 'slow'
  ).length;
  const rainingCount = weatherLogs.filter((log) => log.isRaining).length;
  const uptime =
    summary && summary.totalCameras > 0
      ? Math.round((summary.active / summary.totalCameras) * 100)
      : 0;

  const refresh = async () => {
    await Promise.all([healthQuery.refetch(), weatherQuery.refetch(), auditQuery.refetch()]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <View>
          <Text style={styles.eyebrow}>HCMVISION</Text>
          <Text style={styles.headerTitle}>Tổng quan quản trị</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cập nhật dữ liệu"
          style={styles.refreshButton}
          onPress={refresh}
        >
          <Icon name="refresh" color="#d4e4fa" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading && !summary ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#34d399" />
            <Text style={styles.stateText}>Đang tải dữ liệu quản trị...</Text>
          </View>
        ) : (
          <>
            {error ? (
              <Pressable style={styles.errorState} onPress={refresh}>
                <Icon name="warning" color="#fca5a5" size={20} />
                <Text style={styles.errorText}>Không tải đủ dữ liệu. Chạm để thử lại.</Text>
              </Pressable>
            ) : null}

            <View style={styles.metricGrid}>
              <MetricCard
                icon="videocam"
                label="Camera hoạt động"
                value={`${summary?.active ?? 0}/${summary?.totalCameras ?? 0}`}
                tone="mint"
              />
              <MetricCard icon="wifi" label="Khả dụng" value={`${uptime}%`} tone="blue" />
              <MetricCard icon="water_damage" label="Có mưa" value={numberFormatter.format(rainingCount)} tone="cyan" />
              <MetricCard icon="traffic" label="Giao thông chậm" value={numberFormatter.format(congestedCount)} tone="coral" />
            </View>

            <SectionTitle title="Điều hành" />
            <View style={styles.actionGrid}>
              <ActionCard
                icon="person_outline"
                title="Tài khoản"
                subtitle="Quyền và trạng thái"
                onPress={() => router.push('/admin/manage-users' as never)}
              />
              <ActionCard
                icon="wifi"
                title="Sức khỏe hệ thống"
                subtitle="Camera và stream"
                onPress={() => router.push('/admin/system-health' as never)}
              />
              <ActionCard
                icon="update"
                title="Đồng bộ dữ liệu"
                subtitle="Lịch sử quét camera"
                onPress={() => router.push('/admin/ingestion' as never)}
              />
              <ActionCard
                icon="smart_toy"
                title="Kiểm tra AI"
                subtitle="Chạy phân tích thử"
                onPress={() => router.push('/admin/test-ai' as never)}
              />
            </View>

            <SectionTitle title="Hoạt động quản trị" />
            <View style={styles.activityList}>
              {auditQuery.data?.items.length ? (
                auditQuery.data.items.map((log) => (
                  <View key={log.id} style={styles.activityRow}>
                    <View style={styles.activityIcon}>
                      <Icon name="security" color="#93c5fd" size={18} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{formatAdminAuditLog(log)}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có thao tác quản trị nào được ghi nhận.</Text>
              )}
            </View>

            <SectionTitle title="Tình trạng camera" />
            <View style={styles.healthSummary}>
              <HealthRow label="Hoạt động" value={summary?.active ?? 0} color="#34d399" />
              <HealthRow label="Ngoại tuyến" value={summary?.offline ?? 0} color="#f87171" />
              <HealthRow label="Bảo trì" value={summary?.maintenance ?? 0} color="#fbbf24" />
              <HealthRow label="Chế độ thử nghiệm" value={summary?.testMode ?? 0} color="#93c5fd" />
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AdminBottomBar active="dashboard" />
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: 'mint' | 'blue' | 'cyan' | 'coral';
}) {
  return (
    <View style={[styles.metricCard, styles[`metric_${tone}`]]}>
      <Icon name={icon} color={styles[`metricIcon_${tone}`].color} size={20} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.actionCard} onPress={onPress}>
      <Icon name={icon} color="#93c5fd" size={22} />
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function HealthRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.healthRow}>
      <View style={styles.healthLabel}>
        <View style={[styles.healthDot, { backgroundColor: color }]} />
        <Text style={styles.healthText}>{label}</Text>
      </View>
      <Text style={[styles.healthValue, { color }]}>{numberFormatter.format(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  eyebrow: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    marginTop: 2,
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '800',
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    padding: 16,
  },
  centerState: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
  },
  errorText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    minHeight: 118,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  metric_mint: {
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderColor: 'rgba(52,211,153,0.22)',
  },
  metric_blue: {
    backgroundColor: 'rgba(147,197,253,0.08)',
    borderColor: 'rgba(147,197,253,0.22)',
  },
  metric_cyan: {
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderColor: 'rgba(34,211,238,0.22)',
  },
  metric_coral: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.22)',
  },
  metricIcon_mint: { color: '#34d399' },
  metricIcon_blue: { color: '#93c5fd' },
  metricIcon_cyan: { color: '#22d3ee' },
  metricIcon_coral: { color: '#f87171' },
  metricValue: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48.5%',
    minHeight: 120,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#131c2c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 7,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  activityList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#131c2c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  activityIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(147,197,253,0.1)',
  },
  activityContent: {
    flex: 1,
    gap: 5,
  },
  activityTitle: {
    color: '#d4e4fa',
    fontSize: 13,
    lineHeight: 19,
  },
  activityTime: {
    color: '#64748b',
    fontSize: 11,
  },
  emptyText: {
    color: '#94a3b8',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#131c2c',
    fontSize: 13,
  },
  healthSummary: {
    gap: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#131c2c',
  },
  healthLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  healthValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 96,
  },
});
