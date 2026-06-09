import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function WarningScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.headerTitle}>Cảnh báo</Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Urgent Warning Card */}
        <View style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <View style={styles.urgentIconContainer}>
              <Icon name="notifications" color="#690005" size={24} />
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
            <Text style={styles.urgentButtonText}>Xem trên bản đồ</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Các cảnh báo khác</Text>

        {/* Normal Warning 1 */}
        <Pressable style={styles.warningCard}>
          <View style={styles.warningCardHeader}>
            <Icon name="traffic" color="#ffb4ab" size={20} />
            <Text style={styles.warningCardTitle}>Kẹt xe kéo dài</Text>
            <Text style={styles.warningCardTime}>15 phút trước</Text>
          </View>
          <Text style={styles.warningCardDesc}>
            Tuyến đường Cộng Hòa đang ùn tắc nghiêm trọng kéo dài 2km hướng về ngã tư An Sương.
          </Text>
        </Pressable>

        {/* Normal Warning 2 */}
        <Pressable style={styles.warningCard}>
          <View style={styles.warningCardHeader}>
            <Icon name="rainy" color="#f59e0b" size={20} />
            <Text style={styles.warningCardTitleAmber}>Mưa dông khu vực</Text>
            <Text style={styles.warningCardTime}>45 phút trước</Text>
          </View>
          <Text style={styles.warningCardDesc}>
            Mây dông đang phát triển tại Thủ Đức và Quận 9. Dự báo có mưa to trong 30 phút tới.
          </Text>
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
  content: {
    flex: 1,
  },
  urgentCard: {
    backgroundColor: '#93000a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffb4ab',
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  urgentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffb4ab',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffdad6',
  },
  urgentTime: {
    fontSize: 13,
    color: '#ffb4ab',
    marginTop: 4,
  },
  urgentDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: '#ffdad6',
    marginBottom: 16,
  },
  urgentButton: {
    backgroundColor: '#ffb4ab',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  urgentButtonText: {
    color: '#690005',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b9cac8',
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: 'rgba(22, 37, 41, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  warningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffb4ab',
  },
  warningCardTitleAmber: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  warningCardTime: {
    fontSize: 12,
    color: '#b9cac8',
  },
  warningCardDesc: {
    fontSize: 14,
    color: '#d4e4fa',
    lineHeight: 20,
    marginLeft: 28,
  },
});
