import { getAuditData } from '@/services/admin';
import { AdminAiAuditReport } from '@/types/api';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';

type ReportFilter = 'all' | 'mismatch' | 'withImage';

const filterOptions: { key: ReportFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'mismatch', label: 'Sai lệch' },
  { key: 'withImage', label: 'Có ảnh' },
];

export default function AdminAiReportsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<ReportFilter>('all');
  const reportsQuery = useQuery({
    queryKey: ['admin', 'ai-audit-reports'],
    queryFn: async () => (await getAuditData()).data,
  });

  const reports = useMemo(() => reportsQuery.data?.items ?? [], [reportsQuery.data?.items]);
  const filteredReports = useMemo(
    () =>
      reports.filter((report) => {
        if (filter === 'mismatch') {
          return isMismatch(report);
        }

        if (filter === 'withImage') {
          return Boolean(report.imageUrl);
        }

        return true;
      }),
    [filter, reports]
  );
  const summary = useMemo(
    () => ({
      mismatchCount: reports.filter(isMismatch).length,
      withImageCount: reports.filter((report) => Boolean(report.imageUrl)).length,
    }),
    [reports]
  );

  const refresh = async () => {
    await reportsQuery.refetch();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Báo cáo AI sai</Text>
          <Text style={styles.headerSubtitle}>User feedback cần admin kiểm tra</Text>
        </View>
        <Pressable onPress={refresh} style={styles.headerButton}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      {reportsQuery.isLoading && !reports.length ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.stateText}>Đang tải báo cáo...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {reportsQuery.isError ? (
            <Pressable style={styles.errorBox} onPress={refresh}>
              <Icon name="warning" color="#fca5a5" size={20} />
              <Text style={styles.errorText}>Không tải được báo cáo. Chạm để thử lại.</Text>
            </Pressable>
          ) : null}

          <View style={styles.summaryGrid}>
            <SummaryItem label="Tổng báo cáo" value={reports.length} color="#93c5fd" />
            <SummaryItem label="Sai lệch" value={summary.mismatchCount} color="#fca5a5" />
            <SummaryItem label="Có ảnh AI" value={summary.withImageCount} color="#34d399" />
          </View>

          <View style={styles.filterRow}>
            {filterOptions.map((option) => {
              const isActive = filter === option.key;

              return (
                <Pressable
                  key={option.key}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => setFilter(option.key)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {filteredReports.length ? (
            filteredReports.map((report) => (
              <ReportCard key={`${report.reportId}-${report.cameraId}`} report={report} />
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Icon name="check_circle" color="#34d399" size={24} />
              <Text style={styles.emptyTitle}>Chưa có báo cáo phù hợp</Text>
              <Text style={styles.emptyText}>Thử đổi bộ lọc hoặc tải lại dữ liệu.</Text>
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ReportCard({ report }: { report: AdminAiAuditReport }) {
  const mismatch = isMismatch(report);
  const title = report.cameraName || report.cameraId;

  return (
    <Pressable
      style={[styles.reportCard, mismatch && styles.reportCardMismatch]}
      onPress={() =>
        router.push({
          pathname: '/camera-detail',
          params: { id: report.cameraId, name: title },
        })
      }
    >
      <View style={styles.reportTopRow}>
        {report.imageUrl ? (
          <Image source={{ uri: report.imageUrl }} style={styles.reportImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="image" color="#64748b" size={24} />
          </View>
        )}

        <View style={styles.reportMain}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusBadge, mismatch ? styles.statusBadgeMismatch : styles.statusBadgeMatch]}>
              <Icon name={mismatch ? 'warning' : 'check_circle'} color={mismatch ? '#fca5a5' : '#86efac'} size={14} />
              <Text style={[styles.statusText, mismatch ? styles.statusTextMismatch : styles.statusTextMatch]}>
                {mismatch ? 'Cần kiểm tra' : 'Trùng khớp'}
              </Text>
            </View>
            <Text style={styles.reportTime}>{formatDateTime(report.reportTime)}</Text>
          </View>
          <Text style={styles.cameraName} numberOfLines={2}>{title}</Text>
          <Text style={styles.cameraId} numberOfLines={1}>{report.cameraId}</Text>
        </View>
      </View>

      <View style={styles.claimGrid}>
        <ClaimBox label="User báo" value={formatClaim(report.userSaid)} tone="user" />
        <ClaimBox label="AI nhận định" value={formatClaim(report.aiSaid)} tone="ai" />
      </View>

      <View style={styles.aiMetaRow}>
        <MetaPill label="Mưa" value={formatRainLevel(report.aiRainLevel)} />
        <MetaPill label="Giao thông" value={formatTrafficLevel(report.aiTrafficLevel)} />
        <MetaPill label="Tin cậy" value={formatConfidence(report.aiConfidence)} />
      </View>

      {report.note?.trim() ? (
        <Text style={styles.note} numberOfLines={3}>{report.note.trim()}</Text>
      ) : null}
    </Pressable>
  );
}

function ClaimBox({ label, value, tone }: { label: string; value: string; tone: 'user' | 'ai' }) {
  return (
    <View style={[styles.claimBox, tone === 'user' ? styles.claimUser : styles.claimAi]}>
      <Text style={styles.claimLabel}>{label}</Text>
      <Text style={styles.claimValue}>{value}</Text>
    </View>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function isMismatch(report: AdminAiAuditReport) {
  const userClaim = normalizeClaim(report.userSaid);
  const aiClaim = normalizeClaim(report.aiSaid);
  return Boolean(userClaim && aiClaim && userClaim !== aiClaim);
}

function normalizeClaim(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'rain' || normalized === 'raining') return 'rain';
  if (normalized === 'no rain' || normalized === 'not raining' || normalized === 'none') return 'no-rain';
  return normalized;
}

function formatClaim(value?: string) {
  const normalized = normalizeClaim(value);
  if (normalized === 'rain') return 'Có mưa';
  if (normalized === 'no-rain') return 'Không mưa';
  return value?.trim() || 'Chưa rõ';
}

function formatConfidence(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 'N/A';
  const percent = value <= 1 ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa rõ thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0b1120',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 2,
    color: '#94a3b8',
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.22)',
  },
  errorText: {
    flex: 1,
    color: '#fecaca',
    fontSize: 13,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    minHeight: 76,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#101a2d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontSize: 23,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: '#0f172a',
  },
  filterButtonActive: {
    borderColor: 'rgba(0,242,234,0.5)',
    backgroundColor: 'rgba(0,242,234,0.12)',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#d4e4fa',
  },
  reportCard: {
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#101a2d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  reportCardMismatch: {
    borderColor: 'rgba(248,113,113,0.28)',
  },
  reportTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reportImage: {
    width: 92,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#0b1120',
  },
  imagePlaceholder: {
    width: 92,
    height: 72,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1120',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  reportMain: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    minHeight: 26,
    borderRadius: 8,
  },
  statusBadgeMismatch: {
    backgroundColor: 'rgba(248,113,113,0.12)',
  },
  statusBadgeMatch: {
    backgroundColor: 'rgba(52,211,153,0.12)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextMismatch: {
    color: '#fecaca',
  },
  statusTextMatch: {
    color: '#bbf7d0',
  },
  reportTime: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  cameraName: {
    marginTop: 8,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  cameraId: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 11,
  },
  claimGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  claimBox: {
    flex: 1,
    minHeight: 58,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  claimUser: {
    backgroundColor: 'rgba(147,197,253,0.08)',
    borderColor: 'rgba(147,197,253,0.2)',
  },
  claimAi: {
    backgroundColor: 'rgba(0,242,234,0.07)',
    borderColor: 'rgba(0,242,234,0.18)',
  },
  claimLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  claimValue: {
    marginTop: 5,
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
  },
  aiMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaPill: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0b1120',
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
  },
  metaValue: {
    marginTop: 4,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  note: {
    padding: 10,
    borderRadius: 8,
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emptyBox: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#101a2d',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 24,
  },
});
