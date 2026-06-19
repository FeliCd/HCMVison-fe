import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';

export default function ReportWeatherScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const cameraId = params.cameraId as string | undefined;
  const cameraName = params.cameraName as string | undefined;

  const { reportWeather } = useWeather();
  const [isRaining, setIsRaining] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportWeather({
        cameraId,
        isRaining,
        note: note.trim()
      });
      Alert.alert('Cảm ơn bạn', 'Báo cáo thời tiết đã được ghi nhận.');
      router.back();
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể gửi báo cáo');
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
        <Text style={styles.headerTitle}>Báo cáo thời tiết</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Cập nhật tình hình hiện tại</Text>
        <Text style={styles.subtitle}>Báo cáo của bạn giúp cộng đồng có thông tin chính xác hơn.</Text>

        {cameraName && (
          <View style={styles.cameraBox}>
            <Icon name="videocam" color="#00f2ea" size={20} />
            <Text style={styles.cameraText}>Khu vực: {cameraName}</Text>
          </View>
        )}

        <View style={styles.optionsRow}>
          <Pressable 
            style={[styles.optionCard, !isRaining && styles.optionCardActive]}
            onPress={() => setIsRaining(false)}
          >
            <Icon name="settings_brightness" color={!isRaining ? "#eab308" : "#849492"} size={32} />
            <Text style={[styles.optionText, !isRaining && styles.optionTextActive]}>Trời đang tạnh ráo</Text>
          </Pressable>

          <Pressable 
            style={[styles.optionCard, isRaining && styles.optionCardActive]}
            onPress={() => setIsRaining(true)}
          >
            <Icon name="water_damage" color={isRaining ? "#3b82f6" : "#849492"} size={32} />
            <Text style={[styles.optionText, isRaining && styles.optionTextActive]}>Trời đang mưa</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Ghi chú thêm (Không bắt buộc)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Mưa to kèm gió lớn, ngập sâu nửa bánh xe..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={note}
          onChangeText={setNote}
          textAlignVertical="top"
        />

        <View style={{ flex: 1 }} />

        <Pressable 
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#003735" />
          ) : (
            <Text style={styles.submitButtonText}>Gửi báo cáo</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#d4e4fa', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#849492', marginBottom: 24, lineHeight: 20 },
  cameraBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0, 242, 234, 0.08)', padding: 12, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.2)' },
  cameraText: { color: '#00f2ea', fontSize: 14, fontWeight: '500' },
  optionsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  optionCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12 },
  optionCardActive: { backgroundColor: 'rgba(0, 242, 234, 0.08)', borderColor: '#00f2ea' },
  optionText: { color: '#849492', fontSize: 14, fontWeight: '500', textAlign: 'center' },
  optionTextActive: { color: '#d4e4fa', fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#d4e4fa', marginBottom: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, color: '#d4e4fa', fontSize: 15, minHeight: 120 },
  submitButton: { backgroundColor: '#00f2ea', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 12 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
