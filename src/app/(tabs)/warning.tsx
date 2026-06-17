import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';

export default function WarningScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>Cảnh báo</Animated.Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Urgent Warning Card */}
        <Animated.View entering={FadeInUp.duration(700).delay(100)} style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentIconContainer}>
              <Icon name="notifications" color="#ffdad6" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.urgentTitle}>Ngập sâu diện rộng</Text>
              <Text style={styles.urgentTime}>Vừa xong • Mức độ: Nghiêm trọng</Text>
            </View>
          </View>
          <Text style={styles.urgentDesc}>
            Cảnh báo ngập nặng tại đường Huỳnh Tấn Phát, khu vực Quận 7. Độ sâu ước tính 40cm. Vui lòng tìm đường vòng.
          </Text>
          <Pressable style={styles.urgentButton}>
            <Icon name="map" color="#690005" size={16} />
            <Text style={styles.urgentButtonText}>Xem trên bản đồ</Text>
          </Pressable>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(500).delay(250)} style={styles.sectionTitle}>Các cảnh báo khác</Animated.Text>

        {/* Normal Warning 1 */}
        <Animated.View entering={FadeInUp.duration(600).delay(350)}>
          <Pressable style={[styles.warningCard, styles.warningCardRed]}>
            <View style={styles.warningCardHeader}>
              <View style={[styles.warningIconContainer, { backgroundColor: 'rgba(255, 180, 171, 0.12)', borderColor: 'rgba(255, 180, 171, 0.2)' }]}>
                <Icon name="traffic" color="#ffb4ab" size={18} />
              </View>
              <View style={styles.warningCardTextContainer}>
                <Text style={styles.warningCardTitle}>Kẹt xe kéo dài</Text>
                <Text style={styles.warningCardTime}>15 phút trước</Text>
              </View>
            </View>
            <Text style={styles.warningCardDesc}>
              Tuyến đường Cộng Hòa đang ùn tắc nghiêm trọng kéo dài 2km hướng về ngã tư An Sương.
            </Text>
          </Pressable>
        </Animated.View>

        {/* Normal Warning 2 */}
        <Animated.View entering={FadeInUp.duration(600).delay(500)}>
          <Pressable style={[styles.warningCard, styles.warningCardAmber]}>
            <View style={styles.warningCardHeader}>
              <View style={[styles.warningIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <Icon name="rainy" color="#f59e0b" size={18} />
              </View>
              <View style={styles.warningCardTextContainer}>
                <Text style={styles.warningCardTitleAmber}>Mưa dông khu vực</Text>
                <Text style={styles.warningCardTime}>45 phút trước</Text>
              </View>
            </View>
            <Text style={styles.warningCardDesc}>
              Mây dông đang phát triển tại Thủ Đức và Quận 9. Dự báo có mưa to trong 30 phút tới.
            </Text>
          </Pressable>
        </Animated.View>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 20, letterSpacing: -0.6 },
  content: { flex: 1 },
  urgentCard: {
    backgroundColor: 'rgba(147, 0, 10, 0.35)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.25)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  urgentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 180, 171, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  urgentTitle: { fontSize: 18, fontWeight: '800', color: '#ffdad6' },
  urgentTime: { fontSize: 12, color: '#ffb4ab', marginTop: 4, fontWeight: '500' },
  urgentDesc: { fontSize: 14, lineHeight: 22, color: '#ffdad6', marginBottom: 16 },
  urgentButton: {
    flexDirection: 'row',
    backgroundColor: '#ffb4ab',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  urgentButtonText: { color: '#690005', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#b9cac8', marginBottom: 14, letterSpacing: 0.2 },
  warningCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  warningCardRed: {
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  warningCardAmber: {
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  warningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  warningCardTextContainer: { flex: 1 },
  warningCardTitle: { fontSize: 16, fontWeight: '700', color: '#ffb4ab' },
  warningCardTitleAmber: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  warningCardTime: { fontSize: 12, color: '#b9cac8', marginTop: 2 },
  warningCardDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22, marginLeft: 54 },
});
