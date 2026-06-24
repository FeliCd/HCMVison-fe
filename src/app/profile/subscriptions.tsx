import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { RequireAuth } from '@/components/route-guards';
import { apiClient } from '@/services/api';
import Animated, { FadeInUp } from 'react-native-reanimated';

function SubscriptionsContent() {
  const insets = useSafeAreaInsets();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getSubscriptions();
      setSubs(response.data?.items || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      setSubs(prev => prev.map(s => s.subscriptionId === id ? { ...s, isEnabled: !current } : s));
      await apiClient.updateSubscription(id, { isEnabled: !current });
    } catch {
      // revert on fail
      setSubs(prev => prev.map(s => s.subscriptionId === id ? { ...s, isEnabled: current } : s));
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xoá đăng ký cảnh báo này?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        try {
          await apiClient.deleteSubscription(id);
          setSubs(prev => prev.filter(s => s.subscriptionId !== id));
        } catch {
          Alert.alert('Lỗi', 'Không thể xoá đăng ký');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Cảnh báo thời tiết</Text>
        <Pressable style={styles.addButton} onPress={() => router.push('/profile/add-subscription' as any)}>
          <Icon name="add" color="#00f2ea" size={24} />
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
        ) : subs.length === 0 ? (
          <View style={styles.centerBox}>
            <Icon name="notifications" color="#64748b" size={48} />
            <Text style={styles.emptyTitle}>Chưa có cảnh báo nào</Text>
            <Text style={styles.emptyText}>Nhận thông báo khi trời sắp mưa tại các khu vực bạn quan tâm.</Text>
            <Pressable style={styles.addBtnLarge} onPress={() => router.push('/profile/add-subscription' as any)}>
              <Text style={styles.addBtnText}>Thêm khu vực</Text>
            </Pressable>
          </View>
        ) : (
          subs.map((item, idx) => (
            <Animated.View key={item.subscriptionId} entering={FadeInUp.duration(400).delay(idx * 100)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.wardName}>{item.wardName || 'Khu vực'}</Text>
                  <Text style={styles.districtName}>{item.districtName || 'Thành phố'}</Text>
                  <Text style={styles.thresholdText}>Ngưỡng mưa: {Math.round(item.thresholdProbability * 100)}%</Text>
                </View>
                <Switch 
                  value={item.isEnabled} 
                  onValueChange={() => handleToggle(item.subscriptionId, item.isEnabled)}
                  trackColor={{ false: '#334155', true: '#00f2ea' }}
                  thumbColor={item.isEnabled ? '#ffffff' : '#94a3b8'}
                />
              </View>
              <View style={styles.cardActions}>
                <Pressable onPress={() => handleDelete(item.subscriptionId)} style={styles.deleteBtn}>
                  <Icon name="close" color="#fca5a5" size={20} />
                  <Text style={styles.deleteText}>Xoá</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function SubscriptionsScreen() {
  return (
    <RequireAuth>
      <SubscriptionsContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  scrollContent: { padding: 16 },
  centerBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', padding: 16, borderRadius: 12 },
  errorText: { color: '#fca5a5', flex: 1 },
  emptyTitle: { fontSize: 16, color: '#d4e4fa', fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, color: '#849492', textAlign: 'center', paddingHorizontal: 32 },
  addBtnLarge: { backgroundColor: '#00f2ea', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  addBtnText: { color: '#003735', fontWeight: '700' },
  card: { backgroundColor: 'rgba(25, 30, 40, 0.5)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 12, marginBottom: 12 },
  cardInfo: { flex: 1 },
  wardName: { fontSize: 16, fontWeight: '700', color: '#d4e4fa' },
  districtName: { fontSize: 14, color: '#849492', marginTop: 2 },
  thresholdText: { fontSize: 13, color: '#00f2ea', marginTop: 8 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  deleteText: { color: '#fca5a5', fontSize: 13 },
});
