import * as Location from 'expo-location';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from 'react-native';
import CameraDetailContent from '@/components/camera-detail-content';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Icon } from '@/components/icons';
import { useCamera } from '@/hooks/useCamera';
import { useTheme } from '@/hooks/useTheme';
import { useWeather } from '@/hooks/useWeather';
import { syncCurrentUserLocationAsync } from '@/services/location';
import { WeatherLog } from '@/types/api';
import { formatRainLevel, formatTrafficLevel } from '@/utils/weather-display';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Cấu trúc location cho map
type MapLocation = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  type: 'rain' | 'traffic' | 'combine';
  markerColor: string;
};

// Convert WeatherLog → MapLocation
function toMapLocation(log: WeatherLog): MapLocation {
  const isJam = log.trafficLevel === 'jam' || log.trafficLevel === 'slow';
  const type: MapLocation['type'] = log.isRaining && isJam ? 'combine' : log.isRaining ? 'rain' : 'traffic';
  let markerColor = '#10b981'; // Default green
  if (type === 'combine' || type === 'rain') markerColor = '#ffb4ab'; // Red
  else if (isJam) markerColor = '#f59e0b'; // Orange

  return {
    id: log.cameraId,
    name: log.cameraName || log.cameraId,
    address: log.districtName || log.wardName || log.cameraId,
    lat: log.latitude,
    lng: log.longitude,
    status: `${formatRainLevel(log.rainLevel)} - ${formatTrafficLevel(log.trafficLevel)}`,
    type,
    markerColor,
  };
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
        /* Dark theme filters for map tiles */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          ${isDark ? 'filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);' : ''}
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: false,
            maxBounds: [
                [10.35, 106.35],
                [11.15, 107.05]
            ],
            maxBoundsViscosity: 1.0,
            minZoom: 10
        }).setView([10.7626, 106.6602], 11);

        L.tileLayer('https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        }).addTo(map);

        window.activeMarkers = [];
        window.markerMap = {};

        window.setMarkers = function(locsJson) {
            if (window.activeMarkers) {
                window.activeMarkers.forEach(m => map.removeLayer(m));
            }
            window.activeMarkers = [];
            window.markerMap = {};

            var locs = JSON.parse(locsJson);
            locs.forEach(function(loc) {
                var iconHtml = '<div style="background-color:' + loc.markerColor + ';width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow: 0 0 8px ' + loc.markerColor + ';"></div>';
                var customIcon = L.divIcon({className: 'custom-icon', html: iconHtml});
                var marker = L.marker([loc.lat, loc.lng], {icon: customIcon}).addTo(map);
                marker.bindPopup("<b>" + loc.name + "</b><br>" + loc.status);

                marker.on('click', function() {
                    var msg = { type: 'MARKER_CLICKED', id: loc.id, name: loc.name };
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
                    } else {
                        window.parent.postMessage(msg, '*');
                    }
                });

                window.activeMarkers.push(marker);
                window.markerMap[loc.id] = marker;
            });
        };

        window.focusLocation = function(id, lat, lng, zoom) {
            map.setView([lat, lng], zoom || 15);
            if (window.markerMap && window.markerMap[id]) {
                window.markerMap[id].openPopup();
            }
        };

        var userMarker = null;
        window.setUserLocation = function(lat, lng) {
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            var dotHtml = '<div style="background-color:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow: 0 0 10px #3b82f6; animation: pulse 1.5s infinite;"></div>';
            var customIcon = L.divIcon({className: 'custom-icon', html: dotHtml});
            userMarker = L.marker([lat, lng], {icon: customIcon}).addTo(map);
            map.setView([lat, lng], 15);
        };
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'SYNC_MARKERS') {
                if (window.setMarkers) window.setMarkers(event.data.data);
            } else if (event.data && event.data.type === 'FOCUS_LOCATION') {
                if (window.focusLocation) window.focusLocation(event.data.id, event.data.lat, event.data.lng, event.data.zoom);
            } else if (event.data && event.data.type === 'SET_USER_LOCATION') {
                if (window.setUserLocation) window.setUserLocation(event.data.lat, event.data.lng);
            }
        });
    </script>
</body>
</html>
`;

export default function TabTwoScreen() {
  const insets = useSafeAreaInsets();

  const [activeSegment, setActiveSegment] = useState<'rain' | 'traffic' | 'combine'>('rain');
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<MapLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [selectedCameraName, setSelectedCameraName] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MARKER_CLICKED') {
          setSelectedCameraId(event.data.id);
          setSelectedCameraName(event.data.name);
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  const { logs, getWeatherLogs } = useWeather();
  const { cameras, getCameras } = useCamera();
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    // The map remains useful with its base tiles when the API is temporarily
    // unavailable. Handle both startup requests so a network failure does not
    // become an unhandled promise rejection in the app's error overlay.
    void Promise.allSettled([
      getWeatherLogs(60, 500),
      getCameras(undefined, 1, 1000),
    ]);
  }, [getWeatherLogs, getCameras]);

  useEffect(() => {
    const latestLogsMap = new Map<string, WeatherLog>();
    logs.forEach(log => {
      if (!latestLogsMap.has(log.cameraId)) {
        latestLogsMap.set(log.cameraId, log);
      }
    });

    const mergedLocations: MapLocation[] = cameras.map(camera => {
      const log = latestLogsMap.get(camera.id);
      if (log) {
        return toMapLocation(log);
      }
      return {
        id: camera.id,
        name: camera.name || camera.id,
        address: camera.wardName || 'Khu vực',
        lat: camera.latitude,
        lng: camera.longitude,
        status: 'Chưa có thông tin thời tiết',
        type: 'combine',
        markerColor: '#94a3b8',
      };
    });

    const cameraIds = new Set(cameras.map(c => c.id));
    latestLogsMap.forEach(log => {
      if (!cameraIds.has(log.cameraId)) {
        mergedLocations.push(toMapLocation(log));
      }
    });

    setLocations(mergedLocations);
  }, [logs, cameras]);

  const { rainingCount, jamCount } = useMemo(() => {
    const latestLogsMap = new Map<string, WeatherLog>();
    logs.forEach(log => {
      if (!latestLogsMap.has(log.cameraId)) {
        latestLogsMap.set(log.cameraId, log);
      }
    });
    const rain = Array.from(latestLogsMap.values()).filter(log => log.isRaining).length;
    const jam = Array.from(latestLogsMap.values()).filter(log => log.trafficLevel === 'jam' || log.trafficLevel === 'slow').length;
    return { rainingCount: rain, jamCount: jam };
  }, [logs]);

  const bottomBarHeight = 64 + insets.bottom;
  const fabsBottom = bottomBarHeight + 16;
  const infoPanelBottom = bottomBarHeight + 12;

  const dotOpacity = useSharedValue(0.5);
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [dotOpacity]);
  const pulseDotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const locScale = useSharedValue(1);
  const locStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locScale.value }],
  }));

  const syncMarkers = useCallback(() => {
    const filtered = locations.filter(loc => {
      if (activeSegment === 'combine') return true;
      return loc.type === activeSegment || loc.type === 'combine';
    });
    const locsString = JSON.stringify(filtered).replace(/'/g, "\\\\'");

    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({ type: 'SYNC_MARKERS', data: locsString }, '*');
    } else {
      webViewRef.current?.injectJavaScript(`
        if (window.setMarkers) {
          window.setMarkers('${locsString}');
        }
        true;
      `);
    }
  }, [locations, activeSegment]);

  useEffect(() => {
    syncMarkers();
  }, [syncMarkers]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (text.trim().length > 0) {
      const filtered = locations.filter(loc =>
        loc.name.toLowerCase().includes(text.toLowerCase()) ||
        loc.address.toLowerCase().includes(text.toLowerCase()) ||
        loc.status.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (loc: MapLocation) => {
    setSearchText(loc.name);
    setShowSuggestions(false);
    Keyboard.dismiss();

    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({ type: 'FOCUS_LOCATION', id: loc.id, lat: loc.lat, lng: loc.lng, zoom: 15 }, '*');
    } else {
      webViewRef.current?.injectJavaScript(`
        if (window.focusLocation) {
          window.focusLocation('${loc.id}', ${loc.lat}, ${loc.lng}, 15);
        }
        true;
      `);
    }
  };

  const handleLocationPress = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Cần cấp quyền vị trí để sử dụng tính năng này.');
        return;
      }
      const location = await syncCurrentUserLocationAsync({ requestPermission: false });
      if (!location) {
        alert('Không thể lấy vị trí hiện tại.');
        return;
      }

      if (Platform.OS === 'web') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'SET_USER_LOCATION', lat: location.latitude, lng: location.longitude }, '*');
      } else {
        webViewRef.current?.injectJavaScript(`
          if (window.setUserLocation) {
            window.setUserLocation(${location.latitude}, ${location.longitude});
          }
          true;
        `);
      }
    } catch (e) {
      console.error('Failed to get location:', e);
      alert('Không thể lấy vị trí hiện tại.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', border: 'none' }}
          srcDoc={mapHtml(isDark)}
          onLoad={() => syncMarkers()}
        />
      ) : (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: mapHtml(isDark) }}
          scrollEnabled={false}
          bounces={false}
          onLoadEnd={syncMarkers}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'MARKER_CLICKED') {
                setSelectedCameraId(data.id);
                setSelectedCameraName(data.name);
              }
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      <View style={[styles.topUiContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon name="search" color={colors.textMuted} size={20} />
            <TextInput
              placeholder="Tìm camera, phường hoặc khu vực"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={() => {
                if (searchText.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {searchText.length > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                <Icon name="close" color={colors.textMuted} size={18} />
              </Pressable>
            )}
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View style={[styles.suggestionsDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {suggestions.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleSelectSuggestion(loc)}
                  >
                    <Icon name="location_on" color={colors.primary} size={18} />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={[styles.suggestionName, { color: colors.text }]}>{loc.name}</Text>
                      <Text style={[styles.suggestionAddress, { color: colors.textMuted }]}>{loc.address}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScrollView}
          contentContainerStyle={styles.chipsContainer}
        >
          <View style={[styles.statusChipRed, { backgroundColor: colors.dangerMuted, borderColor: colors.danger }]}>
            <Icon name="rainy" color={colors.danger} size={14} />
            <Text style={[styles.statusChipRedText, { color: colors.danger }]}>
              Đang mưa: {rainingCount} camera
            </Text>
          </View>

          <View style={[styles.statusChipRed, { backgroundColor: colors.dangerMuted, borderColor: colors.danger }]}>
            <Icon name="traffic" color={colors.danger} size={14} />
            <Text style={[styles.statusChipRedText, { color: colors.danger }]}>
              Kẹt xe/chậm: {jamCount} điểm
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          {(['rain', 'traffic', 'combine'] as const).map((seg) => {
            const isActive = activeSegment === seg;
            const iconColor = isActive ? colors.primary : colors.textMuted;
            
            let iconComponent;
            if (seg === 'rain') {
              iconComponent = <Icon name="rainy" color={iconColor} size={18} />;
            } else if (seg === 'traffic') {
              iconComponent = <Icon name="traffic" color={iconColor} size={18} />;
            } else {
              iconComponent = (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Icon name="rainy" color={iconColor} size={15} />
                  <Icon name="traffic" color={iconColor} size={15} />
                </View>
              );
            }

            return (
              <Pressable
                key={seg}
                onPress={() => setActiveSegment(seg)}
                style={[styles.segmentBtn, isActive && { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {iconComponent}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.fabsContainer, { bottom: fabsBottom }]}>


        <AnimatedPressable
          style={[styles.fabItem, styles.fabLocation, locStyle, { backgroundColor: colors.primary }]}
          onPressIn={() => { locScale.value = withSpring(0.88, { damping: 12 }); }}
          onPressOut={() => { locScale.value = withSpring(1, { damping: 12 }); }}
          onPress={handleLocationPress}
        >
          <Icon name="my_location" color="#000000" size={22} />
        </AnimatedPressable>
      </View>

      <View style={[styles.infoPanel, { bottom: infoPanelBottom, backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
        <Animated.View style={[styles.infoPanelDot, pulseDotStyle]} />
        <View style={styles.infoPanelTextContainer}>
          <Text style={[styles.infoPanelSubtitle, { color: colors.textMuted }]}>Nguồn: Cổng TTGT TP.HCM</Text>
        </View>
      </View>

      {selectedCameraId && (
        <Modal
          visible={selectedCameraId !== null}
          animationType="slide"
          onRequestClose={() => {
            setSelectedCameraId(null);
            setSelectedCameraName(null);
          }}
        >
          <CameraDetailContent
            id={selectedCameraId}
            name={selectedCameraName || undefined}
            onClose={() => {
              setSelectedCameraId(null);
              setSelectedCameraName(null);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topUiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
    gap: 12,
  },
  searchContainer: {
    zIndex: 30,
  },
  searchBar: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' as any },
    }),
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsDropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionAddress: {
    fontSize: 11,
    marginTop: 2,
  },
  chipsScrollView: {
    flexGrow: 0,
  },
  chipsContainer: {
    gap: 8,
    flexDirection: 'row',
  },
  statusChipRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusChipRedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    padding: 3,
    marginTop: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fabsContainer: {
    position: 'absolute',
    right: 16,
    gap: 12,
    zIndex: 20,
    alignItems: 'center',
  },
  fabItem: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabLocation: {
    marginTop: 4,
    borderWidth: 0,
  },
  infoPanel: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    maxWidth: 210,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  infoPanelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6ffbbe',
  },
  infoPanelTextContainer: {
    flex: 1,
  },
  infoPanelSubtitle: {
    fontSize: 10,
  },
});
