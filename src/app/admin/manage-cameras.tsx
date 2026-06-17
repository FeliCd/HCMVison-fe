import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function ManageCamerasScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Quản lý Camera</Text>
        <Pressable style={styles.backButton}>
          <Icon name="add" color="#00f2ea" size={24} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" color="#849492" size={20} />
          <TextInput style={styles.searchInput} placeholder="Tìm ID hoặc tên Camera..." placeholderTextColor="#849492" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cameraId}>#CAM-001</Text>
            <View style={styles.statusBadgeGreen}>
              <Text style={styles.statusTextGreen}>Active</Text>
            </View>
          </View>
          <Text style={styles.cameraName}>Ngã 4 Nguyễn Văn Linh</Text>
          <Text style={styles.cameraDetail}>IP: 192.168.1.101 • Vị trí: Quận 7</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Cấu hình</Text></Pressable>
            <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Khởi động lại</Text></Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cameraId}>#CAM-084</Text>
            <View style={styles.statusBadgeRed}>
              <Text style={styles.statusTextRed}>Offline</Text>
            </View>
          </View>
          <Text style={styles.cameraName}>Vòng xoay Phú Lâm</Text>
          <Text style={styles.cameraDetail}>IP: 192.168.1.184 • Vị trí: Quận 6</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Cấu hình</Text></Pressable>
            <Pressable style={styles.actionBtn}><Text style={styles.actionText}>Ping</Text></Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 37, 41, 0.8)', paddingHorizontal: 16, borderRadius: 12, height: 44, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, color: '#d4e4fa', fontSize: 14 },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cameraId: { color: '#00f2ea', fontWeight: '600', fontSize: 14 },
  statusBadgeGreen: { backgroundColor: 'rgba(0, 242, 234, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusTextGreen: { color: '#00f2ea', fontSize: 12, fontWeight: '600' },
  statusBadgeRed: { backgroundColor: 'rgba(255, 180, 171, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusTextRed: { color: '#ffb4ab', fontSize: 12, fontWeight: '600' },
  cameraName: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', marginBottom: 4 },
  cameraDetail: { fontSize: 13, color: '#b9cac8', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#d4e4fa', fontSize: 13, fontWeight: '500' },
});
