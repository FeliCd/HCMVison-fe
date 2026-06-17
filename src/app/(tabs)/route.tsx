import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState('Vị trí hiện tại');
  const [to, setTo] = useState('');

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
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
          />
        </View>
        
        {/* Swap Button */}
        <Pressable style={styles.swapButton} onPress={handleSwap}>
          <Icon name="refresh" color="#00f2ea" size={16} />
        </Pressable>
      </Animated.View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.Text entering={FadeInUp.duration(500).delay(200)} style={styles.sectionTitle}>Đề xuất tuyến đường an toàn</Animated.Text>

        {/* Route Card 1 */}
        <Animated.View entering={FadeInUp.duration(600).delay(300)}>
          <Pressable style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View>
                <Text style={styles.routeTime}>25 phút</Text>
                <Text style={styles.routeDistance}>8.2 km • Qua Nguyễn Văn Linh</Text>
              </View>
              <View style={styles.statusChipGreen}>
                <Icon name="traffic" color="#10b981" size={12} />
                <Text style={styles.statusChipGreenText}>Thông thoáng</Text>
              </View>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeDesc}>Tuyến đường tối ưu nhất hiện tại. Không có ngập nước hoặc kẹt xe.</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Route Card 2 */}
        <Animated.View entering={FadeInUp.duration(600).delay(450)}>
          <Pressable style={[styles.routeCard, styles.routeCardWarning]}>
            <View style={styles.routeHeader}>
              <View>
                <Text style={styles.routeTimeWarning}>38 phút</Text>
                <Text style={styles.routeDistance}>7.5 km • Qua Huỳnh Tấn Phát</Text>
              </View>
              <View style={styles.statusChipRed}>
                <Icon name="rainy" color="#ffb4ab" size={12} />
                <Text style={styles.statusChipRedText}>Mưa lớn / Ngập</Text>
              </View>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeDescWarning}>Cảnh báo: Đoạn đường có điểm ngập sâu 20cm, hạn chế di chuyển.</Text>
            </View>
          </Pressable>
        </Animated.View>
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
  },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -18 }],
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
