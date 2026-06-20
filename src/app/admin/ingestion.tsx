import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { apiClient } from '@/services/api';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function IngestionJobsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, jobsRes] = await Promise.all([
        apiClient.getIngestionStats(7).catch(() => null),
        apiClient.getIngestionJobs(1, 20).catch(() => null)
      ]);

      if (statsRes?.data) setStats(Array.isArray(statsRes.data) ? statsRes.data : [statsRes.data]);
      if (jobsRes?.data) setJobs(jobsRes.data.items || jobsRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu đồng bộ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#22c55e';
      case 'processing': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Đồng bộ Dữ liệu (Ingestion)</Text>
        <Pressable style={styles.backButton} onPress={fetchData}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            {/* Stats Summary */}
            <Text style={styles.sectionTitle}>Thống kê tuần qua</Text>
            {stats.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                {stats.map((s, idx) => (
                  <Animated.View key={idx} entering={FadeInUp.duration(400).delay(idx * 100)} style={styles.statCard}>
                    <Text style={styles.statDate}>{s.date || 'Hôm nay'}</Text>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Thành công:</Text>
                      <Text style={styles.statSuccess}>{s.processedRecords || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Lỗi:</Text>
                      <Text style={styles.statFailed}>{s.failedRecords || 0}</Text>
                    </View>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Chưa có dữ liệu thống kê</Text>
            )}

            {/* Jobs List */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Lịch sử đồng bộ gần đây</Text>
            {jobs.length > 0 ? (
              jobs.map((job, idx) => (
                <Animated.View key={job.jobId || idx} entering={FadeInUp.duration(400).delay(200 + idx * 50)} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobId}>ID: {job.jobId}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                        {job.status || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.jobDetails}>
                    <View style={styles.jobRow}>
                      <Icon name="update" size={14} color="#849492" />
                      <Text style={styles.jobText}>Bắt đầu: {formatDate(job.createdAt)}</Text>
                    </View>
                    {job.completedAt && (
                      <View style={styles.jobRow}>
                        <Icon name="check_circle" size={14} color="#849492" />
                        <Text style={styles.jobText}>Hoàn thành: {formatDate(job.completedAt)}</Text>
                      </View>
                    )}
                    {job.progress !== undefined && (
                      <View style={styles.jobRow}>
                        <Icon name="update" size={14} color="#849492" />
                        <Text style={styles.jobText}>Tiến độ: {Math.round(job.progress * 100)}%</Text>
                      </View>
                    )}
                    {job.errorMessage && (
                      <View style={[styles.jobRow, { marginTop: 8 }]}>
                        <Icon name="warning" size={14} color="#ef4444" />
                        <Text style={[styles.jobText, { color: '#ef4444', flex: 1 }]}>{job.errorMessage}</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              ))
            ) : (
              <Text style={styles.emptyText}>Không có tiến trình nào gần đây</Text>
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
  scrollContent: { padding: 16 },
  centerBox: { paddingTop: 60, alignItems: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', padding: 16, borderRadius: 12 },
  errorText: { color: '#fca5a5', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', marginBottom: 12 },
  statsScroll: { flexDirection: 'row', marginHorizontal: -16, paddingHorizontal: 16 },
  statCard: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, marginRight: 12, minWidth: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statDate: { fontSize: 14, fontWeight: '700', color: '#849492', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statLabel: { color: '#b9cac8', fontSize: 13 },
  statSuccess: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
  statFailed: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  emptyText: { color: '#64748b', fontStyle: 'italic', fontSize: 14, paddingVertical: 20 },
  jobCard: { backgroundColor: 'rgba(25, 30, 40, 0.5)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  jobId: { fontSize: 14, fontWeight: '600', color: '#d4e4fa' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  jobDetails: { gap: 6 },
  jobRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  jobText: { color: '#b9cac8', fontSize: 13 },
});
