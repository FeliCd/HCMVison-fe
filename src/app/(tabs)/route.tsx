import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { Icon } from '@/components/icons';
import { apiClient } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';

interface RouteData {
  id: string;
  distanceKm: string;
  durationMin: string;
  summary: string;
  isSafe: boolean;
  warnings: any[];
  badTrafficWarnings: any[];
  coordinates: {lat: number; lng: number}[];
}

const mapHtml = (isDark: boolean) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; background-color: ${isDark ? '#051424' : '#f1f5f9'}; }
        .leaflet-layer, .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
          ${isDark ? 'filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);' : ''}
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

        L.tileLayer('https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        }).addTo(map);

        window.routeLayers = [];
        window.markers = [];

        window.drawRoutes = function(routesJson, selectedRouteId) {
            var routes = JSON.parse(routesJson);
            
            window.routeLayers.forEach(l => map.removeLayer(l));
            window.markers.forEach(m => map.removeLayer(m));
            window.routeLayers = [];
            window.markers = [];

            if (routes.length === 0) return;

            var bounds = L.latLngBounds();

            routes.forEach(route => {
                if (route.id === selectedRouteId) return;
                var polyline = L.polyline(route.coordinates, {color: '#94a3b8', weight: 4, opacity: 0.6}).addTo(map);
                window.routeLayers.push(polyline);
            });

            var selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
            var mainColor = selectedRoute.isSafe ? '#3b82f6' : '#ef4444';
            var mainPolyline = L.polyline(selectedRoute.coordinates, {color: mainColor, weight: 6, opacity: 0.9}).addTo(map);
            window.routeLayers.push(mainPolyline);

            selectedRoute.coordinates.forEach(c => bounds.extend(c));

            var startCoord = selectedRoute.coordinates[0];
            var endCoord = selectedRoute.coordinates[selectedRoute.coordinates.length - 1];
            
            var startIcon = L.divIcon({className: 'custom-icon', html: '<div style="background-color:#00f2ea;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow: 0 0 8px #00f2ea;"></div>'});
            var endIcon = L.divIcon({className: 'custom-icon', html: '<div style="background-color:#ffb4ab;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow: 0 0 8px #ffb4ab;"></div>'});
            
            window.markers.push(L.marker(startCoord, {icon: startIcon}).addTo(map));
            window.markers.push(L.marker(endCoord, {icon: endIcon}).addTo(map));

            map.fitBounds(bounds, {padding: [40, 40]});
        };

        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'DRAW_ROUTES') {
                if (window.drawRoutes) window.drawRoutes(event.data.routesJson, event.data.selectedRouteId);
            }
        });
    </script>
</body>
</html>
`;

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);

  const [isSearchExpanded, setIsSearchExpanded] = useState(true);

  const [from, setFrom] = useState('Vị trí hiện tại');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleSearch = async () => {
    if (!from || !to) {
      setErrorMsg('Vui lòng nhập điểm xuất phát và điểm đến');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg('');
    setRoutes([]);
    setSelectedRouteId(null);

    try {
      let startCoord = null;
      let endCoord = null;

      if (from.toLowerCase() === 'vị trí hiện tại' || from.toLowerCase() === 'my location') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Vui lòng cấp quyền vị trí để dùng "Vị trí hiện tại"');
          setLoading(false);
          return;
        }
        
        let location;
        try {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch (locErr) {
          console.warn('getCurrentPositionAsync failed, trying last known position...', locErr);
          location = await Location.getLastKnownPositionAsync({});
        }

        if (!location) {
          setErrorMsg('Không thể lấy được vị trí hiện tại của thiết bị.');
          setLoading(false);
          return;
        }
        startCoord = { lat: location.coords.latitude, lng: location.coords.longitude };
      } else {
        startCoord = await apiClient.geocodeAddress(from);
        if (!startCoord) {
          setErrorMsg(`Không tìm thấy địa chỉ: ${from}`);
          setLoading(false);
          return;
        }
      }

      endCoord = await apiClient.geocodeAddress(to);
      if (!endCoord) {
        setErrorMsg(`Không tìm thấy địa chỉ: ${to}`);
        setLoading(false);
        return;
      }

      const osrmData = await apiClient.getOSRMRoutes(
        startCoord.lng,
        startCoord.lat,
        endCoord.lng,
        endCoord.lat
      );

      if (!osrmData || !osrmData.routes || osrmData.routes.length === 0) {
        setErrorMsg('Không tìm thấy tuyến đường nào khả dụng');
        setLoading(false);
        return;
      }

      const loadedRoutes: RouteData[] = [];
      
      for (let i = 0; i < osrmData.routes.length; i++) {
        const routeObj = osrmData.routes[i];
        
        const coords = routeObj.geometry.coordinates;
        if (!coords || coords.length === 0) continue;

        const routePoints = coords.map((c: any) => ({ lat: c[1], lng: c[0] }));
        const leafletCoords = coords.map((c: any) => ({ lat: c[1], lng: c[0] }));

        try {
          const checkRes = await apiClient.checkRoute({ routePoints });
          const safetyData = checkRes.data;

          const distanceKm = (routeObj.distance / 1000).toFixed(1);
          const durationMin = Math.round(routeObj.duration / 60).toString();
          
          let summaryText = 'Tuyến đường thay thế';
          if (routeObj.legs && routeObj.legs.length > 0 && routeObj.legs[0].summary) {
            summaryText = `Qua ${routeObj.legs[0].summary}`;
          } else if (i === 0) {
            summaryText = 'Tuyến đường nhanh nhất';
          }

          loadedRoutes.push({
            id: `route-${i}`,
            distanceKm,
            durationMin,
            summary: summaryText,
            isSafe: safetyData.isRouteSafe,
            warnings: safetyData.warnings || [],
            badTrafficWarnings: safetyData.badTrafficWarnings || [],
            coordinates: leafletCoords,
          });
        } catch (err) {
          console.warn('Check route safety failed for a route', err);
        }
      }

      setRoutes(loadedRoutes);
      if (loadedRoutes.length > 0) {
        setSelectedRouteId(loadedRoutes[0].id);
        setIsSearchExpanded(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi tìm đường');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routes.length > 0 && selectedRouteId) {
      const routesJson = JSON.stringify(routes.map(r => ({
        id: r.id,
        isSafe: r.isSafe,
        coordinates: r.coordinates
      }))).replace(/'/g, "\\\\'");

      if (Platform.OS === 'web') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'DRAW_ROUTES', routesJson, selectedRouteId }, '*');
      } else {
        webViewRef.current?.injectJavaScript(`
          if (window.drawRoutes) {
            window.drawRoutes('${routesJson}', '${selectedRouteId}');
          }
          true;
        `);
      }
    }
  }, [routes, selectedRouteId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. Map Layer (Absolute Fill) */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', border: 'none' }}
            srcDoc={mapHtml(isDark)}
            onLoad={() => {
              if (routes.length > 0 && selectedRouteId) {
                const routesJson = JSON.stringify(routes.map(r => ({
                  id: r.id,
                  isSafe: r.isSafe,
                  coordinates: r.coordinates
                }))).replace(/'/g, "\\\\'");
                iframeRef.current?.contentWindow?.postMessage({ type: 'DRAW_ROUTES', routesJson, selectedRouteId }, '*');
              }
            }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            style={StyleSheet.absoluteFill}
            source={{ html: mapHtml(isDark) }}
            scrollEnabled={false}
            bounces={false}
          />
        )}
      </View>

      {/* 2. Top & Bottom Overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]} pointerEvents="none">
          <Animated.Text entering={FadeInUp.duration(500)} style={[styles.headerTitle, { color: colors.text }]}>Tuyến đường</Animated.Text>
        </View>

        {/* Search Overlay */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={[styles.inputOverlay, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]} pointerEvents="auto">
          {isSearchExpanded ? (
            <>
              <View style={styles.inputRow}>
                <View style={styles.inputDotGreen} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={from}
                  onChangeText={setFrom}
                  placeholder="Điểm xuất phát"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleSearch}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.inputRow}>
                <View style={styles.inputDotRed} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={to}
                  onChangeText={setTo}
                  placeholder="Điểm đến"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleSearch}
                />
              </View>
              
              <Pressable style={[styles.swapButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleSwap}>
                <Icon name="refresh" color={colors.primary} size={16} />
              </Pressable>

              <Pressable style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
                {loading ? (
                  <ActivityIndicator size="small" color="#051424" />
                ) : (
                  <Text style={styles.searchButtonText}>Tìm đường</Text>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setIsSearchExpanded(true)} style={styles.collapsedSearch}>
              <Icon name="search" color={colors.textMuted} size={20} />
              <Text style={[styles.collapsedText, { color: colors.text }]} numberOfLines={1}>{from}  →  {to}</Text>
              <Icon name="edit" color={colors.primary} size={18} />
            </Pressable>
          )}
        </Animated.View>

        {/* Bottom Overlay */}
        {(!isSearchExpanded || errorMsg !== '') && (
          <View style={styles.bottomOverlay} pointerEvents="box-none">
            <ScrollView style={styles.bottomScrollView} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 16 }} pointerEvents="auto" showsVerticalScrollIndicator={false}>
              {errorMsg ? (
                 <Animated.View entering={FadeInUp.duration(400)} style={styles.errorBox}>
                   <Icon name="warning" color="#fca5a5" size={20} />
                   <Text style={styles.errorText}>{errorMsg}</Text>
                 </Animated.View>
              ) : null}

              {!isSearchExpanded && routes.length > 0 && (
                <View>
                  <Animated.Text entering={FadeInUp.duration(500).delay(200)} style={[styles.sectionTitle, { color: colors.textMuted }]}>
                    Đề xuất tuyến đường
                  </Animated.Text>

                  {routes.map((route, index) => {
                    const isWarning = !route.isSafe || route.warnings.length > 0 || route.badTrafficWarnings.length > 0;
                    const isSelected = selectedRouteId === route.id;
                    
                    let mainWarning = 'Tuyến đường tối ưu nhất hiện tại. Không có ngập nước hoặc kẹt xe.';
                    let shortStatus = 'Thông thoáng';
                    
                    if (isWarning) {
                       const allWarns = [...route.warnings.map(w => w.reason), ...route.badTrafficWarnings.map(w => w.reason)];
                       if (allWarns.length > 0) {
                         mainWarning = `Cảnh báo: ${allWarns[0]}`;
                       } else {
                         mainWarning = 'Có cảnh báo thời tiết hoặc kẹt xe trên tuyến đường.';
                       }
                       
                       if (route.warnings.length > 0) {
                          shortStatus = 'Mưa lớn / Ngập';
                       } else {
                          shortStatus = 'Kẹt xe';
                       }
                    }

                    return (
                      <Animated.View key={route.id} entering={FadeInUp.duration(600).delay(100 + index * 100)} layout={Layout.springify()}>
                        <Pressable 
                          style={[
                            styles.routeCard, 
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            isWarning && { borderColor: colors.dangerMuted },
                            isSelected && { borderColor: colors.primary, borderWidth: 2 }
                          ]}
                          onPress={() => setSelectedRouteId(route.id)}
                        >
                          <View style={styles.routeHeader}>
                            <View>
                              <Text style={[isWarning ? styles.routeTimeWarning : styles.routeTime, !isWarning && { color: colors.primary }]}>{route.durationMin} phút</Text>
                              <Text style={[styles.routeDistance, { color: colors.textMuted }]}>{route.distanceKm} km • {route.summary}</Text>
                            </View>
                            <View style={isWarning ? styles.statusChipRed : styles.statusChipGreen}>
                              <Icon name={isWarning ? (route.warnings.length > 0 ? "rainy" : "traffic") : "traffic"} color={isWarning ? colors.danger : colors.primary} size={12} />
                              <Text style={[isWarning ? styles.statusChipRedText : styles.statusChipGreenText, isWarning ? { color: colors.danger } : { color: colors.primary }]}>{shortStatus}</Text>
                            </View>
                          </View>
                          <View style={[styles.routeDetails, { borderTopColor: colors.border }]}>
                            <Text style={[isWarning ? styles.routeDescWarning : styles.routeDesc, !isWarning && { color: colors.text }]}>{mainWarning}</Text>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  inputOverlay: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '45%',
    zIndex: 20,
  },
  bottomScrollView: {
    flex: 1,
  },
  collapsedSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsedText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
    marginRight: 40, // space for swap btn
  },
  inputDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00f2ea',
  },
  inputDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffb4ab',
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' as any },
    }),
  },
  divider: {
    height: 1,
    marginLeft: 22,
    marginVertical: 4,
    marginRight: 40,
  },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: 36,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  searchButtonText: {
    color: '#003735',
    fontSize: 15,
    fontWeight: '700',
  },
  errorBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(239,68,68,0.08)', 
    padding: 16, 
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  routeCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routeTime: {
    fontSize: 22,
    fontWeight: '800',
  },
  routeTimeWarning: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffb4ab',
  },
  routeDistance: {
    fontSize: 13,
    marginTop: 4,
  },
  statusChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusChipGreenText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusChipRedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeDetails: {
    paddingTop: 14,
    borderTopWidth: 1,
  },
  routeDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  routeDescWarning: {
    fontSize: 14,
    color: '#ffb4ab',
    lineHeight: 22,
  },
});
