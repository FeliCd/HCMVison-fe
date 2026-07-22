/**
 * Màn hình thêm khu vực theo dõi cảnh báo mưa.
 *
 * Luồng:
 *  1. Load danh sách quận từ API khi mount
 *  2. Khi user chọn quận → load danh sách phường của quận đó
 *  3. User chọn phường → nhấn "Lưu đăng ký" → tạo subscription
 *  4. Sau khi lưu thành công → quay lại màn hình trước
 */
import { createSubscription } from '@/services/misc';
import { getDistricts, getWardsByDistrict } from '@/services/location';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { District, Ward } from '@/types/api';
import { Icon } from '@/components/icons';
import { RequireAuth } from '@/components/route-guards';

// ─── Nội dung chính của màn hình (được bọc bởi RequireAuth bên dưới) ─────────
function AddSubscriptionContent() {
  const insets = useSafeAreaInsets();

  // Danh sách quận và phường
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Quận / phường đang được chọn
  const [selectedDist, setSelectedDist] = useState<string | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  // Trạng thái loading: dùng chung cho cả tải quận và tải phường
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tải danh sách quận ngay khi màn hình mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Gọi API lấy danh sách quận, lọc bỏ các quận không có tên
  const fetchDistricts = async () => {
    try {
      const response = await getDistricts();
      setDistricts(
        response.data.filter(
          (district) => typeof district.name === 'string' && district.name.trim().length > 0
        )
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách quận');
    } finally {
      setLoading(false);
    }
  };

  // Khi user chọn một quận:
  //  - Reset phường đang chọn
  //  - Gọi API lấy danh sách phường theo tên quận
  const selectDistrict = async (id: string, name: string) => {
    setSelectedDist(id);
    setSelectedWard(null);
    setWards([]);
    setLoading(true);
    try {
      const response = await getWardsByDistrict(name);
      setWards(
        response.data.filter(
          (ward) =>
            typeof ward.id === 'string' &&
            ward.id.trim().length > 0 &&
            typeof ward.name === 'string' &&
            ward.name.trim().length > 0
        )
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể tải danh sách phường');
    } finally {
      setLoading(false);
    }
  };

  // Lưu đăng ký theo dõi khu vực đã chọn
  const handleSave = async () => {
    if (!selectedWard) return;
    setSubmitting(true);
    try {
      await createSubscription({ wardId: selectedWard });
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Thêm khu vực theo dõi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Bước 1: Chọn quận */}
        <Text style={styles.label}>1. Chọn cụm / khu vực</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {districts.map(d => {
            const districtKey = d.id || d.name;

            return (
              <Pressable
                key={districtKey}
                style={[styles.chip, selectedDist === districtKey && styles.chipActive]}
                onPress={() => selectDistrict(districtKey, d.name)}
              >
                <Text style={[styles.chipText, selectedDist === districtKey && styles.chipTextActive]}>{d.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Bước 2: Chọn phường */}
        <Text style={[styles.label, { marginTop: 24 }]}>2. Chọn Phường / Xã</Text>
        {loading && selectedDist ? (
          <ActivityIndicator size="small" color="#00f2ea" style={{ marginTop: 12, alignSelf: 'flex-start' }} />
        ) : wards.length > 0 ? (
          <View style={styles.grid}>
            {wards.map(w => {
              const wardKey = w.id || w.name;

              return (
                <Pressable
                  key={wardKey}
                  style={[styles.gridItem, selectedWard === w.id && styles.gridItemActive]}
                  onPress={() => setSelectedWard(w.id)}
                >
                  <Text style={[styles.gridText, selectedWard === w.id && styles.gridTextActive]}>{w.name}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Vui lòng chọn cụm/khu vực trước</Text>
        )}

      </ScrollView>

      {/* Footer: nút lưu */}
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

// Bọc bởi RequireAuth: nếu chưa đăng nhập sẽ tự redirect về /login
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
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: '#051424' },
  saveBtn: { backgroundColor: '#00f2ea', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
