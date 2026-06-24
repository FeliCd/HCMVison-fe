import { runAiTest, deleteCamera } from '@/services/camera';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminBottomBar } from '@/components/admin-bottom-bar';
import { Icon } from '@/components/icons';
import { useCamera } from '@/hooks/useCamera';
import { Camera } from '@/types/api';

import { formatCameraStatus } from '@/utils/admin-display';

export default function ManageCamerasScreen() {
  const insets = useSafeAreaInsets();
  const { cameras, loading, error, getCameras } = useCamera();
  const [searchText, setSearchText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getCameras(undefined, 1, 200);
  }, [getCameras]);

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const filteredCameras = cameras.filter((camera) => {
    if (!searchText) return true;
    const query = searchText.toLowerCase();
    const nameMatch = camera.name ? camera.name.toLowerCase().includes(query) : false;
    const wardMatch = camera.wardName ? camera.wardName.toLowerCase().includes(query) : false;
    const idMatch = camera.id ? camera.id.toLowerCase().includes(query) : false;
    return nameMatch || wardMatch || idMatch;
  });

  const handleRunAiTest = async (camera: Camera) => {
    setActionLoading(camera.id);
    try {
      await runAiTest(camera.id, true);
      Alert.alert('Thành công', `Đã chạy AI test cho camera ${camera.name}`);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể chạy AI test');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCamera = (id: string) => {
    Alert.alert('Xác nhận xoá', 'Bạn có chắc chắn muốn xoá camera này không?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try {
          await deleteCamera(id);
          getCameras(searchText, 1, 50);
          Alert.alert('Thành công', 'Đã xoá camera');
        } catch (e: any) {
          Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể xoá camera');
        }
      }}
    ]);
  };

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'Active': return '#00f2ea';
      case 'Inactive': return '#f59e0b';
      case 'Offline': return '#ffb4ab';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Quản lý Camera</Text>
        <Pressable style={styles.backButton} onPress={() => getCameras(undefined, 1, 50)}>
          <Icon name="refresh" color="#00f2ea" size={24} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" color="#849492" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm ID hoặc tên Camera..."
            placeholderTextColor="#849492"
            value={searchText}
            onChangeText={handleSearch}
          />
          {loading && <ActivityIndicator size="small" color="#00f2ea" />}
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Icon name="warning" color="#fca5a5" size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading && cameras.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Đang tải danh sách camera...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredCameras.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy camera nào</Text>
          ) : (
            filteredCameras.map((camera) => (
              <View key={camera.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cameraId}>#{camera.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(camera.status) + '15', borderColor: getStatusColor(camera.status) + '40' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(camera.status) }]}>
                      {formatCameraStatus(camera.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cameraName}>{camera.name}</Text>
                <Text style={styles.cameraDetail}>
                  {camera.wardName || 'Chưa có phường'} • Vĩ độ: {camera.latitude?.toFixed(4)}, Kinh độ: {camera.longitude?.toFixed(4)}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: '/admin/manage-cameras/edit' as any, params: { id: camera.id, name: camera.name, lat: camera.latitude, lng: camera.longitude, wardId: camera.wardId, streamUrl: camera.streamUrl } })}
                  >
                    <Text style={styles.actionText}>Sửa</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                    onPress={() => handleDeleteCamera(camera.id)}
                  >
                    <Text style={[styles.actionText, { color: '#fca5a5' }]}>Xoá</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: 'rgba(0, 242, 234, 0.3)' }]}
                    onPress={() => handleRunAiTest(camera)}
                    disabled={actionLoading === camera.id}
                  >
                    {actionLoading === camera.id ? (
                      <ActivityIndicator size="small" color="#00f2ea" />
                    ) : (
                      <Text style={[styles.actionText, { color: '#00f2ea' }]}>Chạy AI</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* FAB Thêm Camera */}
      <Pressable 
        style={styles.fab}
        onPress={() => router.push('/admin/manage-cameras/edit' as any)}
      >
        <Icon name="add" color="#003735" size={28} />
      </Pressable>

      <AdminBottomBar active="cameras" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  fab: { position: 'absolute', bottom: 90, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#00f2ea', justifyContent: 'center', alignItems: 'center', shadowColor: '#00f2ea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: '600' },
  cameraName: { fontSize: 15, fontWeight: '600', color: '#d4e4fa', marginBottom: 4 },
  cameraDetail: { fontSize: 12, color: '#b9cac8', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  actionText: { color: '#d4e4fa', fontSize: 13, fontWeight: '500' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 60 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingTop: 40, fontSize: 14 },
});
