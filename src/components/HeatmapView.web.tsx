import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Icon } from '@/components/icons';

export default function HeatmapView({ heatmapData, mapRegion }: any) {
  return (
    <View style={styles.mapPlaceholder}>
      <Icon name="map" color="#849492" size={48} />
      <Text style={styles.mapText}>Bản đồ nhiệt lượng mưa không hỗ trợ trên trình duyệt Web.</Text>
      <Text style={styles.mapSubText}>Vui lòng mở ứng dụng trên thiết bị di động (Android/iOS) để xem.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: { flex: 1, backgroundColor: '#1c2b3c', justifyContent: 'center', alignItems: 'center', padding: 24 },
  mapText: { color: '#849492', marginTop: 16, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  mapSubText: { color: '#849492', marginTop: 8, fontSize: 14, textAlign: 'center' },
});
