import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Pressable style={styles.backButton}>
          <Icon name="logout" color="#ffb4ab" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1,240</Text>
            <Text style={styles.statLabel}>Camera Hoạt động</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Camera Lỗi</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>54K</Text>
            <Text style={styles.statLabel}>Lượt truy cập/ngày</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00f2ea' }]}>99.9%</Text>
            <Text style={styles.statLabel}>Uptime Hệ thống</Text>
          </View>
        </View>

        {/* Menu Grid */}
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
          
          <Pressable style={styles.menuItem}>
            <Icon name="smart_toy" color="#00f2ea" size={32} />
            <Text style={styles.menuText}>Kiểm định AI</Text>
          </Pressable>
        </View>
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
  statCard: { flex: 1, backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#d4e4fa', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#b9cac8' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#849492', marginTop: 8 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  menuItem: { width: '47%', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
  menuText: { color: '#d4e4fa', fontWeight: '500', fontSize: 14, textAlign: 'center' },
});
