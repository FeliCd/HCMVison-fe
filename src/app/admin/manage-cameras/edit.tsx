import { updateCamera, createCamera } from '@/services/camera';
import { resolveWardByCoordinates, type ResolvedWard } from '@/services/location';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';


export default function EditCameraScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  const isEdit = !!params.id;

  const [id, setId] = useState(params.id as string || '');
  const [name, setName] = useState(params.name as string || '');
  const [lat, setLat] = useState(params.lat?.toString() || '');
  const [lng, setLng] = useState(params.lng?.toString() || '');
  const [wardId, setWardId] = useState(params.wardId as string || '');
  const [streamUrl, setStreamUrl] = useState(params.streamUrl as string || '');
  const [resolvedWard, setResolvedWard] = useState<ResolvedWard | null>(null);
  const [resolvingWard, setResolvingWard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const parseCoordinate = (value: string) => {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getErrorMessage = (error: any) => {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    return data?.message || data?.error || 'Không thể lưu camera';
  };

  const handleResolveWard = async () => {
    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(lng);

    if (latitude === null || longitude === null) {
      Alert.alert('Lỗi', 'Vui lòng nhập vĩ độ và kinh độ hợp lệ trước.');
      return;
    }

    setResolvingWard(true);
    try {
      const ward = await resolveWardByCoordinates(latitude, longitude);
      setWardId(ward.wardId);
      setResolvedWard(ward);
    } catch (error: any) {
      setResolvedWard(null);
      Alert.alert('Không tìm thấy phường', getErrorMessage(error));
    } finally {
      setResolvingWard(false);
    }
  };

  const handleSave = async () => {
    if (!id || !name || !lat || !lng || !streamUrl) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    const latitude = parseCoordinate(lat);
    const longitude = parseCoordinate(lng);
    if (latitude === null || longitude === null) {
      Alert.alert('Lỗi', 'Vĩ độ hoặc kinh độ không hợp lệ');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCamera(id, {
          name,
          latitude,
          longitude,
          wardId: wardId.trim() || undefined,
          streamUrl
        });
        Alert.alert('Thành công', 'Cập nhật camera thành công');
      } else {
        await createCamera({
          id,
          name,
          latitude,
          longitude,
          wardId: wardId.trim() || undefined,
          streamUrl
        });
        Alert.alert('Thành công', 'Thêm camera mới thành công');
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'Cập nhật Camera' : 'Thêm Camera'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>ID Camera *</Text>
          <TextInput
            style={[styles.input, isEdit && styles.inputDisabled]}
            value={id}
            onChangeText={setId}
            editable={!isEdit}
            placeholder="VD: CAM_001"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên Camera *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="VD: Ngã 4 Hàng Xanh"
            placeholderTextColor="#64748b"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Vĩ độ (Lat) *</Text>
            <TextInput
              style={styles.input}
              value={lat}
              onChangeText={(value) => {
                setLat(value);
                setResolvedWard(null);
              }}
              keyboardType="numeric"
              placeholder="10.12345"
              placeholderTextColor="#64748b"
            />
          </View>
          <View style={styles.gap} />
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Kinh độ (Lng) *</Text>
            <TextInput
              style={styles.input}
              value={lng}
              onChangeText={(value) => {
                setLng(value);
                setResolvedWard(null);
              }}
              keyboardType="numeric"
              placeholder="106.12345"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Mã Phường (Ward ID)</Text>
          <TextInput
            style={styles.input}
            value={wardId}
            onChangeText={(value) => {
              setWardId(value);
              setResolvedWard(null);
            }}
            placeholder="VD: 12345"
            placeholderTextColor="#64748b"
          />
          <Pressable
            style={[styles.resolveBtn, resolvingWard && styles.resolveBtnDisabled]}
            onPress={handleResolveWard}
            disabled={resolvingWard}
          >
            {resolvingWard ? (
              <ActivityIndicator color="#00f2ea" />
            ) : (
              <Icon name="my_location" color="#00f2ea" size={18} />
            )}
            <Text style={styles.resolveBtnText}>
              {resolvingWard ? 'Đang xác định...' : 'Tự xác định phường từ tọa độ'}
            </Text>
          </Pressable>
          {resolvedWard ? (
            <Text style={styles.resolvedWardText}>
              {resolvedWard.wardName}
              {resolvedWard.districtName ? ` - ${resolvedWard.districtName}` : ''}
              {resolvedWard.matchType === 'nearest' ? ` (gần nhất ${Math.round(resolvedWard.distanceMeters)}m)` : ''}
            </Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Stream URL (RTSP/HLS) *</Text>
          <TextInput
            style={styles.input}
            value={streamUrl}
            onChangeText={setStreamUrl}
            placeholder="rtsp://... hoặc http://..."
            placeholderTextColor="#64748b"
            multiline
          />
        </View>

        <Pressable 
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#003735" /> : <Text style={styles.submitBtnText}>Lưu thông tin</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 20 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#849492', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(22, 37, 41, 0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: '#d4e4fa', fontSize: 15 },
  inputDisabled: { opacity: 0.5, backgroundColor: 'rgba(255,255,255,0.02)' },
  row: { flexDirection: 'row' },
  gap: { width: 16 },
  resolveBtn: { marginTop: 10, borderWidth: 1, borderColor: 'rgba(0,242,234,0.35)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(0,242,234,0.08)' },
  resolveBtnDisabled: { opacity: 0.6 },
  resolveBtnText: { color: '#00f2ea', fontSize: 14, fontWeight: '700' },
  resolvedWardText: { marginTop: 8, color: '#8ee7df', fontSize: 13, lineHeight: 18 },
  submitBtn: { backgroundColor: '#00f2ea', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
