import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import * as Location from 'expo-location';
import apiClient from '@/services/api';

interface RouteData {
  id: string;
  distanceKm: string;
  durationMin: string;
  summary: string;
  isSafe: boolean;
  warnings: any[];
  badTrafficWarnings: any[];
}

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState('Vị trí hiện tại');
  const [to, setTo] = useState('');

  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
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

    try {
      let startCoord = null;
      let endCoord = null;

      // 1. Resolve start location
      if (from.toLowerCase() === 'vị trí hiện tại' || from.toLowerCase() === 'my location') {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Vui lòng cấp quyền vị trí để dùng "Vị trí hiện tại"');
          setLoading(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        startCoord = { lat: location.coords.latitude, lng: location.coords.longitude };
      } else {
        startCoord = await apiClient.geocodeAddress(from);
        if (!startCoord) {
          setErrorMsg(`Không tìm thấy địa chỉ: ${from}`);
          setLoading(false);
          return;
        }
      }

      // 2. Resolve end location
      endCoord = await apiClient.geocodeAddress(to);
      if (!endCoord) {
        setErrorMsg(`Không tìm thấy địa chỉ: ${to}`);
        setLoading(false);
        return;
      }

      // 3. Call OSRM for routes
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

      // 4. For each route, check safety with our backend
      const loadedRoutes: RouteData[] = [];
      
      for (let i = 0; i < osrmData.routes.length; i++) {
        const routeObj = osrmData.routes[i];
        
        // geometry.coordinates is array of [lng, lat]
        const coords = routeObj.geometry.coordinates;
        if (!coords || coords.length === 0) continue;

        const routePoints = coords.map((c: any) => ({ lat: c[1], lng: c[0] }));

        try {
          const checkRes = await apiClient.checkRoute({ routePoints });
          const safetyData = checkRes.data;

          const distanceKm = (routeObj.distance / 1000).toFixed(1);
          const durationMin = Math.round(routeObj.duration / 60).toString();
          
          // Generate a summary (e.g., street name if available, or generic)
          // OSRM provides legs[0].summary
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
          });
        } catch (err) {
          console.warn('Check route safety failed for a route', err);
        }
      }

      setRoutes(loadedRoutes);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Đã có lỗi xảy ra khi tìm đường');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>Tuyến đường</Animated.Text>

      {/* Input Section */}
      <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.inputCard}>
        <View style={styles.inputRow}>
          <View style={styles.inputDotGreen} />
          <TextInput
            style={styles.input}
            value={from}
            onChangeText={setFrom}
            placeholder="Điểm xuất phát"
            placeholderTextColor="#b9cac8"
            onSubmitEditing={handleSearch}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.inputRow}>
          <View style={styles.inputDotRed} />
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="Điểm đến"
            placeholderTextColor="#b9cac8"
            onSubmitEditing={handleSearch}
          />
        </View>
        
        {/* Swap Button */}
        <Pressable style={styles.swapButton} onPress={handleSwap}>
          <Icon name="refresh" color="#00f2ea" size={16} />
        </Pressable>

        {/* Search Button */}
        <Pressable style={styles.searchButton} onPress={handleSearch}>
          {loading ? (
            <ActivityIndicator size="small" color="#051424" />
          ) : (
            <Text style={styles.searchButtonText}>Tìm đường</Text>
          )}
        </Pressable>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {errorMsg ? (
           <Animated.View entering={FadeInUp.duration(400)} style={styles.errorBox}>
             <Icon name="warning" color="#fca5a5" size={20} />
             <Text style={styles.errorText}>{errorMsg}</Text>
           </Animated.View>
        ) : null}

        {routes.length > 0 && (
          <Animated.Text entering={FadeInUp.duration(500).delay(200)} style={styles.sectionTitle}>
            Đề xuất tuyến đường
          </Animated.Text>
        )}

        {routes.map((route, index) => {
          const isWarning = !route.isSafe || route.warnings.length > 0 || route.badTrafficWarnings.length > 0;
          
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
            <Animated.View key={route.id} entering={FadeInUp.duration(600).delay(300 + index * 150)} layout={Layout.springify()}>
              <Pressable style={[styles.routeCard, isWarning && styles.routeCardWarning]}>
                <View style={styles.routeHeader}>
                  <View>
                    <Text style={isWarning ? styles.routeTimeWarning : styles.routeTime}>{route.durationMin} phút</Text>
                    <Text style={styles.routeDistance}>{route.distanceKm} km • {route.summary}</Text>
                  </View>
                  <View style={isWarning ? styles.statusChipRed : styles.statusChipGreen}>
                    <Icon name={isWarning ? (route.warnings.length > 0 ? "rainy" : "traffic") : "traffic"} color={isWarning ? "#ffb4ab" : "#10b981"} size={12} />
                    <Text style={isWarning ? styles.statusChipRedText : styles.statusChipGreenText}>{shortStatus}</Text>
                  </View>
                </View>
                <View style={styles.routeDetails}>
                  <Text style={isWarning ? styles.routeDescWarning : styles.routeDesc}>{mainWarning}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#d4e4fa',
    marginBottom: 20,
    letterSpacing: -0.6,
  },
  inputCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.75)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
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
    color: '#d4e4fa',
    fontSize: 15,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    backgroundColor: 'rgba(25, 30, 40, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchButton: {
    backgroundColor: '#00f2ea',
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
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#b9cac8',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  routeCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#00f2ea',
  },
  routeTimeWarning: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffb4ab',
  },
  routeDistance: {
    fontSize: 13,
    color: '#b9cac8',
    marginTop: 4,
  },
  statusChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusChipGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  statusChipRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(255, 180, 171, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusChipRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffb4ab',
  },
  routeDetails: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeDesc: {
    fontSize: 14,
    color: '#d4e4fa',
    lineHeight: 22,
  },
  routeDescWarning: {
    fontSize: 14,
    color: '#ffb4ab',
    lineHeight: 22,
  },
  routeCardWarning: {
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
});
