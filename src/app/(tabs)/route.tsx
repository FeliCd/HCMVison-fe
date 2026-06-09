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
import { Icon } from '@/components/icons';

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const [from, setFrom] = useState('Vị trí hiện tại');
  const [to, setTo] = useState('');

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.headerTitle}>Tuyến đường</Text>

      {/* Input Section */}
      <View style={styles.inputCard}>
        <View style={styles.inputRow}>
          <Icon name="my_location" color="#00f2ea" size={18} />
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
          <Icon name="search" color="#ffb4ab" size={18} />
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="Điểm đến"
            placeholderTextColor="#b9cac8"
          />
        </View>
        
        {/* Swap Button */}
        <Pressable style={styles.swapButton}>
          <Icon name="refresh" color="#00f2ea" size={16} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.sectionTitle}>Đề xuất tuyến đường an toàn</Text>

        {/* Route Card 1 */}
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

        {/* Route Card 2 */}
        <Pressable style={styles.routeCard}>
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
    fontWeight: '700',
    color: '#d4e4fa',
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: 'rgba(22, 37, 41, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    color: '#d4e4fa',
    fontSize: 16,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 30,
    marginVertical: 4,
  },
  swapButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 20, 36, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b9cac8',
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: 'rgba(22, 37, 41, 0.6)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00f2ea',
  },
  routeTimeWarning: {
    fontSize: 20,
    fontWeight: '700',
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
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipGreenText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  statusChipRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipRedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffb4ab',
  },
  routeDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  routeDesc: {
    fontSize: 14,
    color: '#d4e4fa',
    lineHeight: 20,
  },
  routeDescWarning: {
    fontSize: 14,
    color: '#ffb4ab',
    lineHeight: 20,
  },
});
