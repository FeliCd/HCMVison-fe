import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function PermissionLocationScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="my_location" color="#00f2ea" size={64} />
        </View>
        <Text style={styles.title}>Cấp quyền Vị trí</Text>
        <Text style={styles.subtitle}>
          HCMRainVision cần quyền truy cập vị trí của bạn để cảnh báo ngập lụt và đề xuất tuyến đường chính xác nhất theo thời gian thực.
        </Text>
        
        <View style={styles.infoBox}>
          <Icon name="privacy_tip" color="#849492" size={20} />
          <Text style={styles.infoText}>Dữ liệu vị trí của bạn được mã hóa và không bao giờ chia sẻ cho bên thứ ba.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.denyButton} onPress={() => router.replace('/permission-notification')}>
          <Text style={styles.denyButtonText}>Lúc khác</Text>
        </Pressable>
        <Pressable style={styles.allowButton} onPress={() => router.push('/permission-notification')}>
          <Text style={styles.allowButtonText}>Cho phép</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(22, 37, 41, 0.8)', justifyContent: 'center', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  title: { fontSize: 28, fontWeight: '700', color: '#d4e4fa', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#b9cac8', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8, marginBottom: 32 },
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'flex-start', gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#849492', lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 24 },
  denyButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(22, 37, 41, 0.8)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  denyButtonText: { color: '#d4e4fa', fontSize: 16, fontWeight: '600' },
  allowButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00f2ea', alignItems: 'center' },
  allowButtonText: { color: '#003735', fontSize: 16, fontWeight: '600' },
});
