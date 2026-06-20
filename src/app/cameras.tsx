import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { useCamera } from '@/hooks/useCamera';
import { Camera } from '@/types/api';

export default function CamerasScreen() {
  const insets = useSafeAreaInsets();
  const { cameras, loading, error, getCameras } = useCamera();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    getCameras(undefined, 1, 20);
  }, [getCameras]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (text.trim().length >= 2) {
      getCameras(text.trim(), 1, 20);
    } else if (text.trim().length === 0) {
      getCameras(undefined, 1, 20);
    }
  }, [getCameras]);

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'Active': return '#00f2ea';
      case 'Inactive': return '#f59e0b';
      case 'Offline': return '#ffb4ab';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: Camera['status']) => {
    switch (status) {
      case 'Active': return 'Hoạt động';
      case 'Inactive': return 'Không hoạt động';
      case 'Offline': return 'Ngoại tuyến';
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Tất cả Camera</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" color="#849492" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm camera theo tên, quận..."
            placeholderTextColor="#849492"
            value={searchText}
            onChangeText={handleSearch}
          />
          {loading && <ActivityIndicator size="small" color="#00f2ea" />}
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Icon name="warning" color="#fca5a5" size={24} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => getCameras(undefined, 1, 20)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : loading && cameras.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Đang tải danh sách camera...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {cameras.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="videocam" color="#334155" size={48} />
              <Text style={styles.emptyText}>Không tìm thấy camera nào</Text>
            </View>
          ) : (
            cameras.map((camera) => (
              <Pressable
                key={camera.id}
                style={styles.cameraItem}
                onPress={() => router.push({ pathname: '/camera-detail', params: { id: camera.id, name: camera.name } })}
              >
                <View style={styles.cameraThumbnail}>
                  <Icon name="videocam" color={getStatusColor(camera.status)} size={28} />
                </View>
                <View style={styles.cameraInfo}>
                  <Text style={styles.cameraTitle} numberOfLines={1}>{camera.name}</Text>
                  <Text style={styles.cameraSubtitle} numberOfLines={1}>
                    {camera.wardName || `ID: ${camera.id}`}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(camera.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(camera.status) }]}>
                  {getStatusLabel(camera.status)}
                </Text>
                <Icon name="chevron_right" color="#849492" size={20} />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
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
  scrollContent: { padding: 16, gap: 12 },
  cameraItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 8 },
  cameraThumbnail: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(5, 20, 36, 0.8)', justifyContent: 'center', alignItems: 'center' },
  cameraInfo: { flex: 1, justifyContent: 'center' },
  cameraTitle: { fontSize: 15, fontWeight: '600', color: '#d4e4fa', marginBottom: 2 },
  cameraSubtitle: { fontSize: 12, color: '#b9cac8' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: 'rgba(0, 242, 234, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  retryText: { color: '#00f2ea', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#334155', fontSize: 14 },
});
