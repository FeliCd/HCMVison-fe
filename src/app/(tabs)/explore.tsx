import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import { useTheme } from '@/hooks/useTheme';
import { WeatherLog } from '@/types/api';

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
  // Red for combine/rain, Orange/Yellow for traffic jam, Green for clear
  let markerColor = '#10b981'; // Default green
  if (type === 'combine' || type === 'rain') markerColor = '#ffb4ab'; // Red
  else if (isJam) markerColor = '#f59e0b'; // Orange

  return {
    id: log.cameraId,
    name: log.cameraName || log.cameraId,
    address: log.districtName || log.wardName || log.cameraId,
    lat: log.latitude,
    lng: log.longitude,
    status: `${log.isRaining ? `Mưa ${log.rainLevel}` : 'Không mưa'} - ${log.trafficLevel}`,
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
        html, body, #map { height: 100%; width: 100%; background-color: ; }
        /* Dark theme filters for map tiles */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', {
            zoomControl: false,
            maxBounds: [
                [10.35, 106.35], // Southwest
                [11.15, 107.05]  // Northeast
            ],
            maxBoundsViscosity: 1.0,
            minZoom: 10
        }).setView([10.7626, 106.6602], 11);

        // Google Maps with Traffic Tile Layer
        L.tileLayer('https://mt1.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        }).addTo(map);

        window.activeMarkers = [];
        window.markerMap = {};

        window.setMarkers = function(locsJson) {
            // Clear existing markers
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
    </script>
</body>
</html>
`;

// Main Map Landing Page Screen
export default function TabTwoScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [activeSegment, setActiveSegment] = useState<'rain' | 'traffic' | 'combine'>('rain');
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<MapLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locations, setLocations] = useState<MapLocation[]>([]);

  const { logs, getWeatherLogs } = useWeather();
  const { colors, isDark } = useTheme();
  const webViewRef = useRef<WebView>(null);

  // Load weather logs từ API
  useEffect(() => {
    getWeatherLogs(60, 500); // Lấy logs trong 60 phút, tối đa 500 records
  }, []);

  // Khi có data mới từ API, lấy log mới nhất của mỗi camera và convert sang MapLocation
  useEffect(() => {
    if (logs.length > 0) {
      const latestLogsMap = new Map<string, WeatherLog>();
      logs.forEach(log => {
        if (!latestLogsMap.has(log.cameraId)) {
          latestLogsMap.set(log.cameraId, log);
        }
      });
      const latestLogs = Array.from(latestLogsMap.values());
      setLocations(latestLogs.map(toMapLocation));
    }
  }, [logs]);

  const bottomBarHeight = 64 + insets.bottom;
  const fabsBottom = bottomBarHeight + 16;
  const infoPanelBottom = bottomBarHeight + 12;

  // Pulsing dot for "Cập nhật 5 phút trước"
  const dotOpacity = useSharedValue(0.5);
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const pulseDotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  // Location FAB press
  const locScale = useSharedValue(1);
  const locStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locScale.value }],
  }));

  const syncMarkers = () => {
    const filtered = locations.filter(loc => {
      if (activeSegment === 'combine') return true;
      return loc.type === activeSegment || loc.type === 'combine';
    });
    const locsString = JSON.stringify(filtered).replace(/'/g, "\\'");
    webViewRef.current?.injectJavaScript(`
      if (window.setMarkers) {
        window.setMarkers('${locsString}');
      }
      true;
    `);
  };

  useEffect(() => {
    syncMarkers();
  }, [activeSegment]);

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
    
    // Focus map and open popup
    webViewRef.current?.injectJavaScript(`
      if (window.focusLocation) {
        window.focusLocation('${loc.id}', ${loc.lat}, ${loc.lng}, 15);
      }
      true;
    `);
  };

  const handleLocationPress = () => {
    webViewRef.current?.injectJavaScript(`
      map.setView([10.7626, 106.6822], 11.5);
      true;
    `);
  };

  return (
    <View style={styles.container}>
      {/* 1. Real Map Layer using Leaflet via WebView */}
      <WebView
        ref={webViewRef}
        style={StyleSheet.absoluteFill}
        source={{ html: mapHtml(isDark) }}
        scrollEnabled={false}
        bounces={false}
        onLoadEnd={syncMarkers}
      />

      {/* 3. Top UI Layer (Search & Filters) */}
      <View style={[styles.topUiContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Search Input and Dropdown */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Icon name="search" color="#b9cac8" size={20} />
            <TextInput
              placeholder="Tìm camera, phường hoặc khu vực"
              placeholderTextColor="#b9cac8"
              style={styles.searchInput}
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={() => {
                if (searchText.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {searchText.length > 0 ? (
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
              >
                <Icon name="close" color="#849492" size={18} />
              </Pressable>
            ) : (
              <Pressable style={styles.micButton}>
                <Icon name="mic" color="#29fcf3" size={18} />
              </Pressable>
            )}
          </View>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {suggestions.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(loc)}
                  >
                    <Icon name="location_on" color="#29fcf3" size={18} />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionName}>{loc.name}</Text>
                      <Text style={styles.suggestionAddress}>{loc.address}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Status Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScrollView}
          contentContainerStyle={styles.chipsContainer}
        >
          {/* Raining chip từ API */}
          <View style={styles.statusChipRed}>
            <Icon name="rainy" color="#ffb4ab" size={14} />
            <Text style={styles.statusChipRedText}>
              Đang mưa: {locations.filter(l => l.type === 'rain' || l.type === 'combine').length} camera
            </Text>
          </View>

          {/* Jam chip từ API */}
          <View style={styles.statusChipRed}>
            <Icon name="traffic" color="#ffb4ab" size={14} />
            <Text style={styles.statusChipRedText}>
              Kẹt xe/chậm: {locations.filter(l => l.type === 'traffic' || l.type === 'combine').length} điểm
            </Text>
          </View>
        </ScrollView>

        {/* Segmented Picker */}
        <View style={styles.segmentedControl}>
          {(['rain', 'traffic', 'combine'] as const).map((seg) => {
            const labels = { rain: 'Mưa', traffic: 'Giao thông', combine: 'Kết hợp' };
            const isActive = activeSegment === seg;
            return (
              <Pressable
                key={seg}
                onPress={() => setActiveSegment(seg)}
                style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {labels[seg]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 4. Floating Action Buttons (FABs) */}
      <View style={[styles.fabsContainer, { bottom: fabsBottom }]}>
        <Pressable style={styles.fabItem}>
          <Icon name="map" color="#d4e4fa" size={20} />
        </Pressable>

        <Pressable style={styles.fabItem}>
          <Icon name="tune" color="#d4e4fa" size={20} />
        </Pressable>

        <Pressable style={styles.fabItem}>
          <Icon name="refresh" color="#d4e4fa" size={20} />
        </Pressable>

        <AnimatedPressable
          style={[styles.fabItem, styles.fabLocation, locStyle]}
          onPressIn={() => { locScale.value = withSpring(0.88, { damping: 12 }); }}
          onPressOut={() => { locScale.value = withSpring(1, { damping: 12 }); }}
          onPress={handleLocationPress}
        >
          <Icon name="my_location" color="#003735" size={22} />
        </AnimatedPressable>
      </View>

      {/* 5. Bottom Info Panel */}
      <View style={[styles.infoPanel, { bottom: infoPanelBottom }]}>
        <Animated.View style={[styles.infoPanelDot, pulseDotStyle]} />
        <View style={styles.infoPanelTextContainer}>
          <Text style={styles.infoPanelTitle}>Cập nhật 5 phút trước</Text>
          <Text style={styles.infoPanelSubtitle}>Nguồn: Cổng TTGT TP.HCM</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
  },
  // Top UI Layout
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
    backgroundColor: 'rgba(25, 30, 40, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
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
    color: '#d4e4fa',
    fontSize: 14,
    marginLeft: 10,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(25, 30, 40, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
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
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    color: '#d4e4fa',
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionAddress: {
    color: '#849492',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(255, 180, 171, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusChipRedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffb4ab',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 30, 40, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b9cac8',
  },
  segmentTextActive: {
    color: '#00f2ea',
    fontWeight: '700',
  },
  // Fabs Container
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
    backgroundColor: 'rgba(25, 30, 40, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#00f2ea',
    borderColor: 'transparent',
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  // Bottom Left Info Panel
  infoPanel: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 40, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
  infoPanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4e4fa',
  },
  infoPanelSubtitle: {
    fontSize: 10,
    color: '#b9cac8',
    marginTop: 2,
  },
});
