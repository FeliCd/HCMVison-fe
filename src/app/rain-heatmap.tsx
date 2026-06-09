import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function RainHeatmapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Bản đồ nhiệt lượng mưa</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Icon name="map" color="#849492" size={48} />
          <Text style={styles.mapText}>Heatmap đang tải...</Text>
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Chú giải lượng mưa</Text>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Nhẹ (&lt; 5mm)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#eab308' }]} />
            <Text style={styles.legendText}>Vừa (5-15mm)</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Nặng (&gt; 15mm)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#051424', zIndex: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  mapContainer: { flex: 1, position: 'relative' },
  mapPlaceholder: { flex: 1, backgroundColor: '#1c2b3c', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#849492', marginTop: 12 },
  legendCard: { position: 'absolute', bottom: 32, right: 16, backgroundColor: 'rgba(22, 37, 41, 0.9)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  legendTitle: { color: '#d4e4fa', fontWeight: '600', marginBottom: 12, fontSize: 13 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorBox: { width: 16, height: 16, borderRadius: 4 },
  legendText: { color: '#b9cac8', fontSize: 12 },
});
