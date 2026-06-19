import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';

const heatmapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; background-color: #051424; }
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: false,
            maxBounds: [[10.35, 106.35], [11.15, 107.05]],
            maxBoundsViscosity: 1.0,
            minZoom: 10
        }).setView([10.7626, 106.6602], 12);

        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        }).addTo(map);

        var heatLayer = null;

        window.setHeatmapData = function(pointsJson) {
            var points = JSON.parse(pointsJson);
            if (heatLayer) {
                map.removeLayer(heatLayer);
            }
            var heatData = points.map(function(p) {
                return [p.lat, p.lng, p.intensity];
            });
            heatLayer = L.heatLayer(heatData, {
                radius: 30,
                blur: 20,
                maxZoom: 17,
                max: 1.0,
                gradient: {
                    0.0: '#3b82f6',
                    0.3: '#22d3ee',
                    0.5: '#eab308',
                    0.7: '#f97316',
            }).addTo(map);
        };
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'SET_HEATMAP_DATA') {
                if (window.setHeatmapData) window.setHeatmapData(event.data.data);
            }
        });
    </script>
</body>
</html>
`;

export default function RainHeatmapScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointCount, setPointCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHeatmap = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getWeatherHeatmap();
      const data = response.data;
      
      // Handle different response shapes
      const points = Array.isArray(data) 
        ? data 
        : data?.points || data?.data || [];
      
      setPointCount(points.length);
      setLastUpdated(new Date());

      // Inject points into webview
      if (points.length > 0) {
        const pointsJson = JSON.stringify(points).replace(/'/g, "\\\\'");
        if (Platform.OS === 'web') {
          iframeRef.current?.contentWindow?.postMessage({ type: 'SET_HEATMAP_DATA', data: pointsJson }, '*');
        } else if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (window.setHeatmapData) {
              window.setHeatmapData('${pointsJson}');
            }
            true;
          `);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải dữ liệu heatmap';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay fetch slightly to let webview load
    const timer = setTimeout(fetchHeatmap, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Bản đồ nhiệt lượng mưa</Text>
        <Pressable style={styles.backButton} onPress={fetchHeatmap}>
          <Icon name="refresh" color="#00f2ea" size={22} />
        </Pressable>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', border: 'none' }}
            srcDoc={heatmapHtml}
            onLoad={() => {
              fetchHeatmap();
            }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            style={StyleSheet.absoluteFill}
            source={{ html: heatmapHtml }}
            scrollEnabled={false}
            bounces={false}
            onLoadEnd={() => fetchHeatmap()}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00f2ea" />
            <Text style={styles.loadingText}>Đang tải heatmap...</Text>
          </View>
        )}

        {/* Error Overlay */}
        {error && !loading ? (
          <View style={styles.errorOverlay}>
            <Icon name="warning" color="#fca5a5" size={24} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={fetchHeatmap}>
              <Text style={styles.retryText}>Thử lại</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Chú giải lượng mưa</Text>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Nhẹ</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#eab308' }]} />
            <Text style={styles.legendText}>Vừa</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Nặng</Text>
          </View>
        </View>

        {/* Info panel */}
        {lastUpdated && !loading && (
          <View style={styles.infoPanel}>
            <View style={styles.infoDot} />
            <Text style={styles.infoText}>
              {pointCount} điểm • {lastUpdated.toLocaleTimeString()}
            </Text>
          </View>
        )}
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
  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#051424' },
  webFallbackText: { color: '#849492', marginTop: 12, fontSize: 14 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(5, 20, 36, 0.7)' },
  loadingText: { color: '#b9cac8', marginTop: 12, fontSize: 14 },
  errorOverlay: { position: 'absolute', top: '30%', left: 24, right: 24, backgroundColor: 'rgba(25, 30, 40, 0.9)', padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,180,171,0.2)' },
  errorText: { color: '#fca5a5', fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: 'rgba(0, 242, 234, 0.1)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)', marginTop: 4 },
  retryText: { color: '#00f2ea', fontWeight: '600' },
  legendCard: { position: 'absolute', bottom: 32, right: 16, backgroundColor: 'rgba(22, 37, 41, 0.9)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  legendTitle: { color: '#d4e4fa', fontWeight: '600', marginBottom: 12, fontSize: 13 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  colorBox: { width: 16, height: 16, borderRadius: 4 },
  legendText: { color: '#b9cac8', fontSize: 12 },
  infoPanel: { position: 'absolute', bottom: 32, left: 16, backgroundColor: 'rgba(22, 37, 41, 0.9)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  infoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6ffbbe' },
  infoText: { color: '#b9cac8', fontSize: 12 },
});
