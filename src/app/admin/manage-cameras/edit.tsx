import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';

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
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!id || !name || !lat || !lng || !streamUrl) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await apiClient.updateCamera(id, {
          name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          wardId: wardId || undefined,
          streamUrl
        });
        Alert.alert('Thành công', 'Cập nhật camera thành công');
      } else {
        await apiClient.createCamera({
          id,
          name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          wardId: wardId || undefined,
          streamUrl
        });
        Alert.alert('Thành công', 'Thêm camera mới thành công');
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu camera');
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
              onChangeText={setLat}
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
              onChangeText={setLng}
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
            onChangeText={setWardId}
            placeholder="VD: 12345"
            placeholderTextColor="#64748b"
          />
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
  submitBtn: { backgroundColor: '#00f2ea', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
