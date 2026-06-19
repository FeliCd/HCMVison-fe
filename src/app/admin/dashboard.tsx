import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Try getAdminStats first, fallback to checkCameraHealth
      const statsRes = await apiClient.getAdminStats().catch(() => null);
      if (statsRes?.data) {
        setStats(statsRes.data);
      } else {
        // Fallback: build stats from camera health
        const healthRes = await apiClient.checkCameraHealth().catch(() => null);
        const summary = healthRes?.data?.summary || healthRes?.data?.Summary;
        if (summary) {
          setStats({
            totalCameras: summary.TotalCameras ?? summary.totalCameras ?? 0,
            activeCameras: summary.Active ?? summary.active ?? 0,
            offlineCameras: summary.Offline ?? summary.offline ?? 0,
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const totalCameras = stats?.totalCameras ?? stats?.TotalCameras ?? 0;
  const activeCameras = stats?.activeCameras ?? stats?.Active ?? 0;
  const offlineCameras = stats?.offlineCameras ?? stats?.Offline ?? 0;
  const totalUsers = stats?.totalUsers ?? stats?.TotalUsers ?? '—';
  const uptime = totalCameras > 0 ? ((activeCameras / totalCameras) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Pressable style={styles.backButton} onPress={fetchStats}>
          <Icon name="refresh" color="#00f2ea" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải thống kê...</Text>
          </View>
        ) : (
          <>
            {/* Quick Stats */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{activeCameras}</Text>
                <Text style={styles.statLabel}>Camera Hoạt động</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#ffb4ab' }]}>{offlineCameras}</Text>
                <Text style={styles.statLabel}>Camera Lỗi</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalUsers}</Text>
                <Text style={styles.statLabel}>Người dùng</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#00f2ea' }]}>{uptime}%</Text>
                <Text style={styles.statLabel}>Uptime Hệ thống</Text>
              </View>
            </Animated.View>

            {/* Menu Grid */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)}>
              <Text style={styles.sectionTitle}>Quản lý Hệ thống</Text>
              <View style={styles.menuGrid}>
                <Pressable style={styles.menuItem} onPress={() => router.push('/admin/manage-cameras')}>
                  <Icon name="videocam" color="#00f2ea" size={32} />
                  <Text style={styles.menuText}>Quản lý Camera</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => router.push('/admin/manage-users')}>
                  <Icon name="group" color="#00f2ea" size={32} />
                  <Text style={styles.menuText}>Người dùng</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => router.push('/admin/system-health')}>
                  <Icon name="monitor_heart" color="#00f2ea" size={32} />
                  <Text style={styles.menuText}>Sức khỏe Hệ thống</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => router.push('/admin/test-ai' as any)}>
                  <Icon name="smart_toy" color="#00f2ea" size={32} />
                  <Text style={styles.menuText}>Kiểm định AI</Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={() => router.push('/admin/ingestion' as any)}>
                  <Icon name="update" color="#00f2ea" size={32} />
                  <Text style={styles.menuText}>Lịch sử đồng bộ</Text>
                </Pressable>
              </View>
            </Animated.View>
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
  scrollContent: { padding: 16, gap: 16 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#b9cac8' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#849492', marginTop: 8 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 },
  menuItem: { width: '47%', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  menuText: { color: '#d4e4fa', fontWeight: '500', fontSize: 14, textAlign: 'center' },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
});
