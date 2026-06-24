import { getDistricts, getWardsByDistrict } from '@/services/location';
import { createSubscription } from '@/services/misc';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { RequireAuth } from '@/components/route-guards';


function AddSubscriptionContent() {
  const insets = useSafeAreaInsets();
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedDist, setSelectedDist] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(0.5); // 50%
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await getDistricts();
      setDistricts(response.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách quận');
    } finally {
      setLoading(false);
    }
  };

  const selectDistrict = async (id: string, name: string) => {
    setSelectedDist(id);
    setSelectedWard(null);
    setWards([]);
    setLoading(true);
    try {
      const response = await getWardsByDistrict(name);
      setWards(response.data || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách phường');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedWard) return;
    setSubmitting(true);
    try {
      await createSubscription({ wardId: selectedWard, thresholdProbability: threshold });
      Alert.alert('Thành công', 'Đã thêm cảnh báo khu vực mới');
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu đăng ký');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm khu vực theo dõi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>1. Chọn Quận / Huyện</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {districts.map(d => (
            <Pressable 
              key={d.id} 
              style={[styles.chip, selectedDist === d.id && styles.chipActive]}
              onPress={() => selectDistrict(d.id, d.name)}
            >
              <Text style={[styles.chipText, selectedDist === d.id && styles.chipTextActive]}>{d.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 24 }]}>2. Chọn Phường / Xã</Text>
        {loading && selectedDist ? (
          <ActivityIndicator size="small" color="#00f2ea" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
        ) : wards.length > 0 ? (
          <View style={styles.grid}>
            {wards.map(w => (
              <Pressable 
                key={w.id} 
                style={[styles.gridItem, selectedWard === w.id && styles.gridItemActive]}
                onPress={() => setSelectedWard(w.id)}
              >
                <Text style={[styles.gridText, selectedWard === w.id && styles.gridTextActive]}>{w.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Vui lòng chọn Quận/Huyện trước</Text>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>3. Mức độ dự báo tối thiểu (Ngưỡng cảnh báo)</Text>
        <View style={styles.thresholdRow}>
          {[0.3, 0.5, 0.7, 0.9].map(val => (
            <Pressable 
              key={val} 
              style={[styles.tCard, threshold === val && styles.tCardActive]}
              onPress={() => setThreshold(val)}
            >
              <Text style={[styles.tText, threshold === val && styles.tTextActive]}>{val * 100}%</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hintText}>Bạn sẽ nhận thông báo khi xác suất mưa vượt qua ngưỡng {threshold * 100}%.</Text>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable 
          style={[styles.saveBtn, (!selectedWard || submitting) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!selectedWard || submitting}
        >
          {submitting ? <ActivityIndicator color="#003735" /> : <Text style={styles.saveBtnText}>Lưu đăng ký</Text>}
        </Pressable>
      </View>
    </View>
  );
}

export default function AddSubscriptionScreen() {
  return (
    <RequireAuth>
      <AddSubscriptionContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#d4e4fa', marginBottom: 12 },
  chipRow: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { backgroundColor: '#00f2ea', borderColor: '#00f2ea' },
  chipText: { color: '#849492', fontSize: 14 },
  chipTextActive: { color: '#003735', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gridItemActive: { backgroundColor: 'rgba(0,242,234,0.15)', borderColor: '#00f2ea' },
  gridText: { color: '#b9cac8', fontSize: 14 },
  gridTextActive: { color: '#00f2ea', fontWeight: '600' },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
  thresholdRow: { flexDirection: 'row', gap: 8 },
  tCard: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tCardActive: { backgroundColor: '#00f2ea', borderColor: '#00f2ea' },
  tText: { color: '#b9cac8', fontSize: 15, fontWeight: '600' },
  tTextActive: { color: '#003735' },
  hintText: { color: '#849492', fontSize: 13, marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#051424' },
  saveBtn: { backgroundColor: '#00f2ea', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
