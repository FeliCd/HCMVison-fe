import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, ActivityIndicator, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';
import * as ImagePicker from 'expo-image-picker';

export default function TestAIScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saveLog, setSaveLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để sử dụng tính năng này.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0]);
      setResult(null); // Clear previous result
    }
  };

  const handleTestAI = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      const localUri = image.uri;
      const filename = localUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('imageFile', { uri: localUri, name: filename, type } as any);

      const response = await apiClient.testWeatherAI(formData, saveLog);
      // Backend returns WeatherLog or similar structure
      setResult(response.data);
    } catch (e: any) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể kết nối với server AI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Kiểm định AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.instruction}>
          Tải lên một bức ảnh chụp đường phố để kiểm tra khả năng nhận diện thời tiết và giao thông của mô hình AI.
        </Text>

        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="add" color="#849492" size={48} />
              <Text style={styles.placeholderText}>Chạm để chọn ảnh</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.optionRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionLabel}>Lưu vào nhật ký (Weather Log)</Text>
            <Text style={styles.optionDesc}>Sẽ lưu kết quả test vào cơ sở dữ liệu</Text>
          </View>
          <Switch 
            value={saveLog} 
            onValueChange={setSaveLog}
            trackColor={{ false: '#334155', true: '#00f2ea' }}
            thumbColor={saveLog ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <Pressable 
          style={[styles.submitBtn, (!image || loading) && styles.submitBtnDisabled]}
          onPress={handleTestAI}
          disabled={!image || loading}
        >
          {loading ? (
            <ActivityIndicator color="#003735" />
          ) : (
            <Text style={styles.submitBtnText}>Phân tích ảnh</Text>
          )}
        </Pressable>

        {/* Result Area */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Kết quả phân tích</Text>
            
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Thời tiết:</Text>
              <Text style={[styles.resultValue, { color: result.isRaining ? '#3b82f6' : '#eab308' }]}>
                {result.isRaining ? `Mưa (${result.rainLevel})` : 'Nắng / Tạnh ráo'}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Giao thông:</Text>
              <Text style={[styles.resultValue, { color: result.trafficLevel === 'jam' ? '#ef4444' : '#00f2ea' }]}>
                {result.trafficLevel}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Độ tin cậy (Confidence):</Text>
              <Text style={styles.resultValue}>{Math.round((result.confidence || 0) * 100)}%</Text>
            </View>

            {result.aiReason && (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Lý do nhận diện:</Text>
                <Text style={styles.reasonText}>{result.aiReason}</Text>
              </View>
            )}

            {result.aiModel && (
              <Text style={styles.modelText}>Model: {result.aiModel}</Text>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  instruction: { color: '#849492', fontSize: 14, marginBottom: 20, lineHeight: 22 },
  imagePicker: { width: '100%', height: 240, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', overflow: 'hidden', marginBottom: 24 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  placeholderText: { color: '#849492', fontSize: 15, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionLabel: { color: '#d4e4fa', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  optionDesc: { color: '#849492', fontSize: 13 },
  submitBtn: { backgroundColor: '#00f2ea', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
  resultCard: { marginTop: 24, backgroundColor: 'rgba(0, 242, 234, 0.05)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.2)' },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#00f2ea', marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultLabel: { color: '#849492', fontSize: 14 },
  resultValue: { color: '#d4e4fa', fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  reasonBox: { marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  reasonLabel: { color: '#849492', fontSize: 13, marginBottom: 6 },
  reasonText: { color: '#d4e4fa', fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  modelText: { marginTop: 16, color: '#64748b', fontSize: 12, textAlign: 'right' },
});
