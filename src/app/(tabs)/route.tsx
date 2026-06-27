import { geocodeAddress, getOSRMRoutes, searchAddresses, AddressSuggestion } from '@/services/location';
import { checkRoute, getWeatherLogs } from '@/services/weather';
import { getCameras } from '@/services/camera';
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeOut, Layout } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Location from 'expo-location';

import { Icon } from '@/components/icons';

import { useTheme } from '@/hooks/useTheme';
import { CameraWithWeather, mergeCamerasWithWeather } from '@/utils/camera-weather';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

interface RouteData {
  id: string;
  distanceKm: string;
  durationMin: string;
  summary: string;
  isSafe: boolean;
  warnings: any[];
  badTrafficWarnings: any[];
  coordinates: {lat: number; lng: number}[];
  cameras?: CameraWithWeather[];
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
  const [camerasLoading, setCamerasLoading] = useState(false);

  const currentRoute = routes.find((r) => r.id === selectedRouteId);
  const routeCameras = currentRoute?.cameras || [];

  // Autocomplete state
  const [fromSuggestions, setFromSuggestions] = useState<AddressSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeInput, setActiveInput] = useState<'from' | 'to' | null>(null);
  const [fromCoord, setFromCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [toCoord, setToCoord] = useState<{ lat: number; lng: number } | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const POPULAR_PLACES: AddressSuggestion[] = [
    { shortName: 'Chợ Bến Thành', displayName: 'Chợ Bến Thành, Quận 1, TP.HCM', lat: 10.7725, lng: 106.6981 },
    { shortName: 'Phú Mỹ Hưng', displayName: 'Phú Mỹ Hưng, Quận 7, TP.HCM', lat: 10.7285, lng: 106.7220 },
    { shortName: 'Sân bay Tân Sơn Nhất', displayName: 'Sân bay Tân Sơn Nhất, Tân Bình, TP.HCM', lat: 10.8184, lng: 106.6588 },
    { shortName: 'Đại học Bách Khoa', displayName: 'ĐH Bách Khoa, Quận 10, TP.HCM', lat: 10.7731, lng: 106.6600 },
    { shortName: 'Bitexco Financial Tower', displayName: 'Bitexco Financial Tower, Quận 1, TP.HCM', lat: 10.7716, lng: 106.7042 },
    { shortName: 'Vinhomes Central Park', displayName: 'Vinhomes Central Park, Bình Thạnh, TP.HCM', lat: 10.7955, lng: 106.7220 },
  ];

  const debouncedSearch = useCallback((text: string, field: 'from' | 'to') => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (text.trim().length < 2) {
        if (field === 'from') {
          setFromSuggestions([]);
        } else {
          setToSuggestions([]);
        }
        return;
      }
      const results = await searchAddresses(text);
      if (field === 'from') {
        setFromSuggestions(results);
      } else {
        setToSuggestions(results);
      }
    }, 300);
  }, []);

  const handleFromChange = (text: string) => {
    setFrom(text);
    setFromCoord(null); // clear cached coord when user edits
    debouncedSearch(text, 'from');
  };

  const handleToChange = (text: string) => {
    setTo(text);
    setToCoord(null);
    debouncedSearch(text, 'to');
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion, field: 'from' | 'to') => {
    if (field === 'from') {
      setFrom(suggestion.shortName);
      setFromCoord({ lat: suggestion.lat, lng: suggestion.lng });
      setFromSuggestions([]);
    } else {
      setTo(suggestion.shortName);
      setToCoord({ lat: suggestion.lat, lng: suggestion.lng });
      setToSuggestions([]);
    }
    setActiveInput(null);
  };

  const handleSwap = () => {
    const temp = from;
    const tempCoord = fromCoord;
    setFrom(to);
    setFromCoord(toCoord);
    setTo(temp);
    setToCoord(tempCoord);
  };

  // Calculate distance between two coordinates (Haversine formula) in meters
  const getDistanceFromLatLng = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSearch = async () => {
    if (!from || !to) {
      setErrorMsg('Vui lòng nhập điểm xuất phát và điểm đến');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setCamerasLoading(true);
    setErrorMsg('');
    setRoutes([]);
    setSelectedRouteId(null);

    try {
      let startCoord = fromCoord;
      let endCoord = toCoord;

      if (from.toLowerCase() === 'vị trí hiện tại' || from.toLowerCase() === 'my location') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Vui lòng cấp quyền vị trí để dùng "Vị trí hiện tại"');
          setLoading(false);
          setCamerasLoading(false);
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
          setCamerasLoading(false);
          return;
        }
        startCoord = { lat: location.coords.latitude, lng: location.coords.longitude };
      } else if (!startCoord) {
        startCoord = await geocodeAddress(from);
        if (!startCoord) {
          setErrorMsg(`Không tìm thấy địa chỉ: ${from}`);
          setLoading(false);
          setCamerasLoading(false);
          return;
        }
      }

      if (!endCoord) {
        endCoord = await geocodeAddress(to);
        if (!endCoord) {
          setErrorMsg(`Không tìm thấy địa chỉ: ${to}`);
          setLoading(false);
          setCamerasLoading(false);
          return;
        }
      }

      // Fetch cameras & weather logs in parallel with the route request
      const [cameraRes, weatherRes, osrmData] = await Promise.all([
        getCameras(undefined, undefined, 1, 1000).catch(() => null),
        getWeatherLogs(180, 500, false).catch(() => null),
        getOSRMRoutes(startCoord.lng, startCoord.lat, endCoord.lng, endCoord.lat),
      ]);

      if (!osrmData || !osrmData.routes || osrmData.routes.length === 0) {
        setErrorMsg('Không tìm thấy tuyến đường nào khả dụng');
        setLoading(false);
        setCamerasLoading(false);
        return;
      }

      const allCamerasWithWeather = cameraRes?.data?.data
        ? mergeCamerasWithWeather(cameraRes.data.data, weatherRes?.data?.data || [])
        : [];

      const loadedRoutes: RouteData[] = [];
      
      for (let i = 0; i < osrmData.routes.length; i++) {
        const routeObj = osrmData.routes[i];
        
        const coords = routeObj.geometry.coordinates;
        if (!coords || coords.length === 0) continue;

        const routePoints = coords.map((c: any) => ({ lat: c[1], lng: c[0] }));
        const leafletCoords = coords.map((c: any) => ({ lat: c[1], lng: c[0] }));

        // Filter cameras within 500m of this specific route
        const sampledCoords = leafletCoords.filter((_: { lat: number; lng: number }, idx: number) => idx % 5 === 0);
        const routeCams = allCamerasWithWeather.filter(cam => {
          if (!cam.latitude || !cam.longitude) return false;
          return sampledCoords.some((coord: { lat: number; lng: number }) =>
            getDistanceFromLatLng(cam.latitude, cam.longitude, coord.lat, coord.lng) < 500
          );
        });

        // Determine warnings & safety directly from the route's camera metrics!
        const routeHasJam = routeCams.some(cam => cam.trafficLevel === 'jam');
        const routeHasSlow = routeCams.some(cam => cam.trafficLevel === 'slow');
        const routeHasRain = routeCams.some(cam => cam.isRaining);

        let finalIsSafe = true;
        let routeWarnings: any[] = [];
        let routeBadTrafficWarnings: any[] = [];

        if (routeCams.length > 0) {
          if (routeHasRain) {
            const rainCam = routeCams.find(cam => cam.isRaining);
            const levelText = formatRainLevel(rainCam?.rainLevel).toLowerCase();
            routeWarnings.push({ reason: `Mưa phát hiện qua camera: ${rainCam?.name} (${levelText})` });
          }

          if (routeHasJam) {
            routeBadTrafficWarnings.push({ reason: 'Ùn tắc phát hiện qua camera trên tuyến' });
          } else if (routeHasSlow) {
            routeBadTrafficWarnings.push({ reason: 'Giao thông di chuyển chậm trên tuyến' });
          }

          finalIsSafe = !routeHasJam && !routeHasRain;
        } else {
          // Fallback to backend API checkRoute if no cameras are nearby
          try {
            const checkRes = await checkRoute({ routePoints });
            const safetyData = checkRes.data;
            finalIsSafe = safetyData.isRouteSafe;
            routeWarnings = safetyData.warnings || [];
            routeBadTrafficWarnings = safetyData.badTrafficWarnings || [];
          } catch (err) {
            console.warn('Fallback checkRoute failed', err);
          }
        }

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
          isSafe: finalIsSafe,
          warnings: routeWarnings,
          badTrafficWarnings: routeBadTrafficWarnings,
          coordinates: leafletCoords,
          cameras: routeCams,
        });
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
      setCamerasLoading(false);
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
                  onChangeText={handleFromChange}
                  placeholder="Điểm xuất phát"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleSearch}
                  onFocus={() => setActiveInput('from')}
                />
              </View>

              {/* From Suggestions Dropdown */}
              {activeInput === 'from' && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[styles.suggestionsContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                  <ScrollView style={styles.suggestionsScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {/* Current location shortcut */}
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        setFrom('Vị trí hiện tại');
                        setFromCoord(null);
                        setFromSuggestions([]);
                        setActiveInput(null);
                      }}
                    >
                      <Icon name="location" color={colors.primary} size={16} />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={[styles.suggestionTitle, { color: colors.primary }]}>Vị trí hiện tại</Text>
                        <Text style={[styles.suggestionSubtitle, { color: colors.textMuted }]}>Sử dụng GPS</Text>
                      </View>
                    </TouchableOpacity>

                    {fromSuggestions.length > 0 ? (
                      fromSuggestions.map((s, i) => (
                        <TouchableOpacity
                          key={`from-${i}`}
                          style={[styles.suggestionItem, i === fromSuggestions.length - 1 && { borderBottomWidth: 0 }]}
                          onPress={() => handleSelectSuggestion(s, 'from')}
                        >
                          <Icon name="location" color={colors.textMuted} size={16} />
                          <View style={styles.suggestionTextContainer}>
                            <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{s.shortName}</Text>
                            <Text style={[styles.suggestionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{s.displayName}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : from.trim().length < 2 ? (
                      <>
                        <Text style={[styles.popularLabel, { color: colors.textMuted }]}>Địa điểm phổ biến</Text>
                        {POPULAR_PLACES.map((p, i) => (
                          <TouchableOpacity
                            key={`pop-from-${i}`}
                            style={[styles.suggestionItem, i === POPULAR_PLACES.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => handleSelectSuggestion(p, 'from')}
                          >
                            <Icon name="star" color={colors.primary} size={14} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{p.shortName}</Text>
                              <Text style={[styles.suggestionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{p.displayName}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : null}
                  </ScrollView>
                </Animated.View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.inputRow}>
                <View style={styles.inputDotRed} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={to}
                  onChangeText={handleToChange}
                  placeholder="Điểm đến"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleSearch}
                  onFocus={() => setActiveInput('to')}
                />
              </View>

              {/* To Suggestions Dropdown */}
              {activeInput === 'to' && (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={[styles.suggestionsContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
                  <ScrollView style={styles.suggestionsScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {toSuggestions.length > 0 ? (
                      toSuggestions.map((s, i) => (
                        <TouchableOpacity
                          key={`to-${i}`}
                          style={[styles.suggestionItem, i === toSuggestions.length - 1 && { borderBottomWidth: 0 }]}
                          onPress={() => handleSelectSuggestion(s, 'to')}
                        >
                          <Icon name="location" color={colors.textMuted} size={16} />
                          <View style={styles.suggestionTextContainer}>
                            <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{s.shortName}</Text>
                            <Text style={[styles.suggestionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{s.displayName}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : to.trim().length < 2 ? (
                      <>
                        <Text style={[styles.popularLabel, { color: colors.textMuted }]}>Địa điểm phổ biến</Text>
                        {POPULAR_PLACES.map((p, i) => (
                          <TouchableOpacity
                            key={`pop-to-${i}`}
                            style={[styles.suggestionItem, i === POPULAR_PLACES.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => handleSelectSuggestion(p, 'to')}
                          >
                            <Icon name="star" color={colors.primary} size={14} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{p.shortName}</Text>
                              <Text style={[styles.suggestionSubtitle, { color: colors.textMuted }]} numberOfLines={1}>{p.displayName}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </>
                    ) : null}
                  </ScrollView>
                </Animated.View>
              )}
              
              <Pressable style={[styles.swapButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleSwap}>
                <Icon name="refresh" color={colors.primary} size={16} />
              </Pressable>

              <Pressable style={[styles.searchButton, { backgroundColor: colors.primary }]} onPress={() => { setActiveInput(null); handleSearch(); }}>
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
                    const isSelected = selectedRouteId === route.id;
                    const routeCams = route.cameras || [];
                    const hasJam = routeCams.some(c => c.trafficLevel === 'jam');
                    const hasSlow = routeCams.some(c => c.trafficLevel === 'slow');
                    const hasRain = routeCams.some(c => c.isRaining);

                    let statusText = 'THÔNG THOÁNG';
                    let statusColor = colors.primary; 
                    let statusIcon: 'traffic' | 'warning' | 'rainy' = 'traffic';
                    let mainDesc = 'Hệ thống quét: Tuyến đường tối ưu, di chuyển bình thường.';

                    if (hasJam) {
                      statusText = 'ÙN TẮC CỰC BỘ';
                      statusColor = colors.danger;
                      statusIcon = 'warning';
                      mainDesc = 'Cảnh báo: Phát hiện ùn tắc qua phân tích camera trên tuyến.';
                    } else if (hasSlow) {
                      statusText = 'DI CHUYỂN CHẬM';
                      statusColor = '#f59e0b';
                      statusIcon = 'traffic';
                      mainDesc = 'Lưu ý: Mật độ giao thông đông, di chuyển chậm.';
                    }

                    if (hasRain) {
                      const rainCam = routeCams.find(c => c.isRaining);
                      statusText = hasJam ? 'ÙN TẮC + MƯA' : 'CÓ MƯA / NGẬP';
                      if (!hasJam) {
                        statusColor = '#0ea5e9';
                        statusIcon = 'rainy';
                      }
                      mainDesc = `Cảnh báo thời tiết: Mưa tại khu vực ${rainCam?.name || 'tuyến đường'}.`;
                    }

                    // Fallback to backend API safety if no cameras exist on this route
                    if (routeCams.length === 0) {
                      const isSafe = route.isSafe;
                      const hasBackendJam = route.badTrafficWarnings.length > 0;
                      const hasBackendRain = route.warnings.length > 0;

                      if (hasBackendJam) {
                        statusText = 'KẸT XE (DỰ BÁO)';
                        statusColor = colors.danger;
                        statusIcon = 'warning';
                        mainDesc = route.badTrafficWarnings[0]?.reason || 'Phát hiện kẹt xe trên tuyến đường.';
                      } else if (hasBackendRain) {
                        statusText = 'MƯA / NGẬP (DỰ BÁO)';
                        statusColor = '#0ea5e9';
                        statusIcon = 'rainy';
                        mainDesc = route.warnings[0]?.reason || 'Phát hiện mưa lớn trên tuyến đường.';
                      } else {
                        statusText = isSafe ? 'THÔNG THOÁNG' : 'CÓ CẢNH BÁO';
                        statusColor = isSafe ? colors.primary : '#f59e0b';
                        mainDesc = isSafe ? 'Tuyến đường tối ưu nhất hiện tại.' : 'Có cảnh báo thời tiết hoặc kẹt xe.';
                      }
                    }

                    return (
                      <Animated.View key={route.id} entering={FadeInUp.duration(600).delay(100 + index * 100)} layout={Layout.springify()}>
                        <Pressable 
                          style={[
                            styles.techRouteCard, 
                            { backgroundColor: isDark ? 'rgba(12, 22, 38, 0.9)' : 'rgba(255, 255, 255, 0.95)' },
                            isSelected && { borderColor: statusColor, shadowColor: statusColor, shadowOpacity: 0.3 }
                          ]}
                          onPress={() => setSelectedRouteId(route.id)}
                        >
                          {isSelected && <View style={[styles.techGlowLine, { backgroundColor: statusColor }]} />}

                          <View style={styles.techRouteHeader}>
                            <View style={styles.techMainInfo}>
                              <View style={styles.techTimeContainer}>
                                <Text style={[styles.techTimeNum, { color: isSelected ? statusColor : colors.text }]}>{route.durationMin}</Text>
                                <Text style={[styles.techTimeUnit, { color: colors.textMuted }]}>MIN</Text>
                              </View>
                              <View style={styles.techTextContainer}>
                                <Text style={[styles.techSummaryTitle, { color: colors.text }]} numberOfLines={1}>
                                  {route.summary.toUpperCase()}
                                </Text>
                                <Text style={[styles.techStatsText, { color: colors.textMuted }]}>
                                  DIS: {route.distanceKm} KM  •  CAMS: {routeCams.length}
                                </Text>
                              </View>
                            </View>

                            <View style={[styles.techStatusChip, { borderColor: statusColor }]}>
                              <View style={[styles.techStatusDot, { backgroundColor: statusColor }]} />
                              <Text style={[styles.techStatusText, { color: statusColor }]}>{statusText}</Text>
                            </View>
                          </View>

                          <View style={[styles.techDetailsFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                            <Icon name={statusIcon} color={statusColor} size={13} />
                            <Text style={[styles.techDescText, { color: colors.textMuted }]} numberOfLines={1}>{mainDesc}</Text>
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              )}

              {/* Camera cards section */}
              {!isSearchExpanded && routes.length > 0 && (
                <View>
                  <Animated.Text entering={FadeInUp.duration(500).delay(400)} style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 8 }]}>
                    <Icon name="videocam" color={colors.textMuted} size={14} />  Camera trên tuyến đường {routeCameras.length > 0 ? `(${routeCameras.length})` : ''}
                  </Animated.Text>

                  {camerasLoading ? (
                    <Animated.View entering={FadeIn.duration(300)} style={styles.camerasLoadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.camerasLoadingText, { color: colors.textMuted }]}>Đang tìm camera...</Text>
                    </Animated.View>
                  ) : routeCameras.length === 0 ? (
                    <Animated.View entering={FadeIn.duration(300)} style={[styles.noCameraBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Icon name="videocam" color={colors.textMuted} size={20} />
                      <Text style={[styles.noCameraText, { color: colors.textMuted }]}>Không tìm thấy camera nào trên tuyến đường</Text>
                    </Animated.View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cameraScrollContent}>
                      {routeCameras.map((cam, index) => {
                        const isRaining = cam.isRaining;
                        const rainText = formatRainLevel(cam.rainLevel);
                        const trafficText = formatTrafficLevel(cam.trafficLevel);
                        const hasImage = !!cam.imageSources.weatherImageUrl;

                        return (
                          <Animated.View key={cam.id} entering={FadeInUp.duration(500).delay(100 + index * 80)}>
                            <Pressable
                              style={[
                                styles.cameraCard,
                                { backgroundColor: colors.surface, borderColor: isRaining ? colors.dangerMuted : colors.border },
                              ]}
                              onPress={() => router.push({ pathname: '/camera-detail', params: { id: cam.id, name: cam.name } })}
                            >
                              {/* Camera Image */}
                              <View style={styles.cameraImageContainer}>
                                {hasImage ? (
                                  <Image
                                    source={{ uri: cam.imageSources.weatherImageUrl }}
                                    style={styles.cameraImage}
                                    contentFit="cover"
                                    transition={200}
                                  />
                                ) : (
                                  <View style={[styles.cameraImagePlaceholder, { backgroundColor: colors.surfaceHighlight }]}>
                                    <Icon name="videocam" color={colors.textMuted} size={24} />
                                  </View>
                                )}
                                {/* Status badge */}
                                {isRaining && (
                                  <View style={styles.cameraRainBadge}>
                                    <Icon name="rainy" color="#fff" size={10} />
                                  </View>
                                )}
                              </View>

                              {/* Camera Info */}
                              <View style={styles.cameraInfo}>
                                <Text style={[styles.cameraName, { color: colors.text }]} numberOfLines={1}>{cam.name}</Text>
                                <View style={styles.cameraStatusRow}>
                                  <Icon name={isRaining ? 'rainy' : 'traffic'} color={isRaining ? colors.danger : colors.primary} size={11} />
                                  <Text style={[styles.cameraStatusText, { color: isRaining ? colors.danger : colors.primary }]} numberOfLines={1}>
                                    {isRaining ? rainText : trafficText}
                                  </Text>
                                </View>
                                {cam.timeAgo ? (
                                  <Text style={[styles.cameraTimeAgo, { color: colors.textMuted }]} numberOfLines={1}>{cam.timeAgo}</Text>
                                ) : null}
                              </View>
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </ScrollView>
                  )}
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
    bottom: 60,
    left: 0,
    right: 0,
    maxHeight: '55%',
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
  suggestionsContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 4,
    overflow: 'hidden',
    maxHeight: 220,
  },
  suggestionsScroll: {
    maxHeight: 220,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  popularLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  // Camera cards styles
  camerasLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  camerasLoadingText: {
    fontSize: 13,
  },
  noCameraBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  noCameraText: {
    fontSize: 13,
    flex: 1,
  },
  cameraScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  cameraCard: {
    width: 150,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cameraImageContainer: {
    width: '100%',
    height: 96,
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  cameraImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraRainBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 8,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraInfo: {
    padding: 10,
    gap: 3,
  },
  cameraName: {
    fontSize: 12,
    fontWeight: '700',
  },
  cameraStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cameraStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cameraTimeAgo: {
    fontSize: 10,
  },
  techRouteCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  techGlowLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  techRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  techMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  techTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  techTimeNum: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: -1,
  },
  techTimeUnit: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 2,
  },
  techTextContainer: {
    flex: 1,
  },
  techSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  techStatsText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  techStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  techStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  techStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  techDetailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  techDescText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
