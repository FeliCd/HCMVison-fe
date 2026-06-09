import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';

import { Icon } from '@/components/icons';

const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; }
        html, body, #map { height: 100%; width: 100%; background-color: #051424; }
        /* Dark theme filters for map tiles */
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
            maxBounds: [
                [10.35, 106.35], // Southwest
                [11.15, 107.05]  // Northeast
            ],
            maxBoundsViscosity: 1.0,
            minZoom: 10
        }).setView([10.7626, 106.6602], 11);

        // OpenStreetMap Free Tile Layer
        L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Custom markers
        var redIcon = L.divIcon({className: 'custom-icon', html: '<div style="background-color:#ffb4ab;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>'});
        var greenIcon = L.divIcon({className: 'custom-icon', html: '<div style="background-color:#6ffbbe;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>'});
        var blueIcon = L.divIcon({className: 'custom-icon', html: '<div style="background-color:#adc6ff;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>'});

        L.marker([10.7769, 106.7009], {icon: redIcon}).addTo(map).bindPopup("Chợ Bến Thành<br>Mưa lớn - Kẹt xe");
        L.marker([10.7626, 106.6822], {icon: greenIcon}).addTo(map).bindPopup("Đại học Khoa học Tự nhiên<br>Đường thoáng");
        L.marker([10.7966, 106.7224], {icon: blueIcon}).addTo(map).bindPopup("Landmark 81<br>Mưa nhỏ");
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

  const bottomBarHeight = 60 + insets.bottom;
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

  return (
    <View style={styles.container}>
      {/* 1. Real Map Layer using Leaflet via WebView */}
      <WebView
        style={StyleSheet.absoluteFillObject}
        source={{ html: mapHtml }}
        scrollEnabled={false}
        bounces={false}
      />

      {/* 3. Top UI Layer (Search & Filters) */}
      <View style={[styles.topUiContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" color="#b9cac8" size={20} />
          <TextInput
            placeholder="Tìm camera, phường hoặc khu vực"
            placeholderTextColor="#b9cac8"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
          <Pressable style={styles.micButton}>
            <Icon name="mic" color="#29fcf3" size={18} />
          </Pressable>
        </View>

        {/* Status Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScrollView}
          contentContainerStyle={styles.chipsContainer}
        >
          {/* Raining chip */}
          <View style={styles.statusChipRed}>
            <Icon name="rainy" color="#ffb4ab" size={14} />
            <Text style={styles.statusChipRedText}>Đang mưa: 12 camera</Text>
          </View>

          {/* Jam chip */}
          <View style={styles.statusChipRed}>
            <Icon name="traffic" color="#ffb4ab" size={14} />
            <Text style={styles.statusChipRedText}>Kẹt xe/chậm: 8 điểm</Text>
          </View>
        </ScrollView>

        {/* Segmented Picker */}
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setActiveSegment('rain')}
            style={[
              styles.segmentBtn,
              activeSegment === 'rain' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'rain' && styles.segmentTextActive,
              ]}
            >
              Mưa
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('traffic')}
            style={[
              styles.segmentBtn,
              activeSegment === 'traffic' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'traffic' && styles.segmentTextActive,
              ]}
            >
              Giao thông
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSegment('combine')}
            style={[
              styles.segmentBtn,
              activeSegment === 'combine' && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'combine' && styles.segmentTextActive,
              ]}
            >
              Kết hợp
            </Text>
          </Pressable>
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

        <Pressable style={[styles.fabItem, styles.fabLocation]}>
          <Icon name="my_location" color="#003735" size={22} />
        </Pressable>
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
    gap: 8,
  },
  searchBar: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    color: '#d4e4fa',
    fontSize: 15,
    marginLeft: 8,
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  micButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(39, 54, 71, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(147, 0, 10, 0.2)',
    borderColor: 'rgba(255, 180, 171, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusChipRedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffb4ab',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(0, 242, 234, 0.15)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#b9cac8',
  },
  segmentTextActive: {
    color: '#00f2ea',
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
    borderRadius: 22,
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  fabLocation: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00f2ea',
    marginTop: 4,
    shadowColor: '#00f2ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  // Bottom Left Info Panel
  infoPanel: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    maxWidth: 200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  infoPanelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6ffbbe',
    shadowColor: '#6ffbbe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  infoPanelTextContainer: {
    flex: 1,
  },
  infoPanelTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4e4fa',
  },
  infoPanelSubtitle: {
    fontSize: 9,
    color: '#b9cac8',
    marginTop: 1,
  },
});
