import { testWeatherAI } from '@/services/weather';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';

import { getApiErrorMessage } from '@/utils/api-error';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

interface AiTestResult {
  isRaining?: boolean;
  rainLevel?: string;
  trafficLevel?: string;
  confidence?: number;
  aiReason?: string;
  aiModel?: string;
}

export default function TestAIScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saveLog, setSaveLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiTestResult | null>(null);

  const applyPickerResult = useCallback((pickerResult: ImagePicker.ImagePickerResult) => {
    if (!pickerResult.canceled && pickerResult.assets.length > 0) {
      setImage(pickerResult.assets[0]);
      setResult(null);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let mounted = true;

    void ImagePicker.getPendingResultAsync()
      .then((pendingResult) => {
        if (!mounted || !pendingResult) {
          return;
        }

        if ('code' in pendingResult) {
          Alert.alert('Khong the khoi phuc anh', pendingResult.message);
          return;
        }

        applyPickerResult(pendingResult);
      })
      .catch((error) => {
        console.warn('Failed to recover pending image picker result.', error);
      });

    return () => {
      mounted = false;
    };
  }, [applyPickerResult]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh để sử dụng tính năng này.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'android',
      quality: 0.8,
    });

    applyPickerResult(pickerResult);
  };

  const handleTestAI = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      const filename = image.uri.split('/').pop() || 'anh-kiem-tra.jpg';
      const extension = /.(\w+)$/.exec(filename)?.[1] || 'jpeg';
      formData.append(
        'imageFile',
        { uri: image.uri, name: filename, type: `image/${extension}` } as unknown as Blob
      );

      const response = await testWeatherAI(formData, saveLog);
      setResult(response.data as AiTestResult);
    } catch (error) {
      Alert.alert('Không thể phân tích ảnh', getApiErrorMessage(error, 'Không thể kết nối với máy chủ AI.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Kiểm tra AI</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.instruction}>
          Chọn ảnh giao thông để kiểm tra dự đoán mưa và tình trạng giao thông của AI.
        </Text>

        <Pressable style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholder}>
              <Icon name="add" color="#849492" size={44} />
              <Text style={styles.placeholderText}>Chạm để chọn ảnh</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.optionRow}>
          <View style={styles.optionCopy}>
            <Text style={styles.optionLabel}>Lưu kết quả vào nhật ký</Text>
            <Text style={styles.optionDescription}>Dùng khi cần lưu kết quả kiểm thử làm dữ liệu thời tiết.</Text>
          </View>
          <Switch
            value={saveLog}
            onValueChange={setSaveLog}
            trackColor={{ false: '#334155', true: '#00f2ea' }}
            thumbColor={saveLog ? '#ffffff' : '#94a3b8'}
          />
        </View>

        <Pressable
          style={[styles.submitButton, (!image || loading) && styles.submitButtonDisabled]}
          onPress={handleTestAI}
          disabled={!image || loading}
        >
          {loading ? <ActivityIndicator color="#003735" /> : <Text style={styles.submitText}>Phân tích ảnh</Text>}
        </Pressable>

        {result ? (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Kết quả phân tích</Text>
            <ResultRow label="Thời tiết" value={formatRainLevel(result.rainLevel)} />
            <ResultRow label="Giao thông" value={formatTrafficLevel(result.trafficLevel)} />
            <ResultRow label="Độ tin cậy" value={`${Math.round((result.confidence || 0) * 100)}%`} />
            {result.aiReason ? <ResultRow label="Nhận định" value={result.aiReason} multiline /> : null}
            {result.aiModel ? <ResultRow label="Mô hình AI" value={result.aiModel} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ResultRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={[styles.resultRow, multiline && styles.resultRowMultiline]}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, multiline && styles.resultValueMultiline]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#d4e4fa', fontSize: 18, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 32 },
  instruction: { color: '#94a3b8', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  imagePicker: {
    height: 240,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  placeholderText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(22,37,41,0.6)',
  },
  optionCopy: { flex: 1, gap: 4 },
  optionLabel: { color: '#d4e4fa', fontSize: 14, fontWeight: '800' },
  optionDescription: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  submitButton: {
    minHeight: 50,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#00f2ea',
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#003735', fontSize: 15, fontWeight: '800' },
  result: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,242,234,0.22)',
    backgroundColor: 'rgba(0,242,234,0.05)',
  },
  resultTitle: { color: '#67e8f9', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 8 },
  resultRowMultiline: { alignItems: 'flex-start' },
  resultLabel: { color: '#94a3b8', fontSize: 13 },
  resultValue: { color: '#d4e4fa', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  resultValueMultiline: { flex: 1, lineHeight: 19 },
});
