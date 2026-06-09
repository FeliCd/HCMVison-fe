import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/icons';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Text style={styles.headerTitle}>Thêm</Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* User Profile Summary */}
        <Pressable style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Icon name="account_circle" color="#00f2ea" size={40} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Khách</Text>
            <Text style={styles.profileDesc}>Đăng nhập để nhận thông báo</Text>
          </View>
          <Icon name="arrow_forward" color="#b9cac8" size={20} />
        </Pressable>

        <Text style={styles.sectionTitle}>Tùy chọn</Text>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <MenuItem icon="notifications" title="Cài đặt thông báo" />
          <MenuItem icon="map" title="Khu vực quan tâm" />
          <MenuItem icon="tune" title="Giao diện & Bản đồ" />
        </View>

        <Text style={styles.sectionTitle}>Cộng đồng & Hỗ trợ</Text>

        <View style={styles.menuContainer}>
          <MenuItem icon="videocam" title="Đóng góp dữ liệu ngập" />
          <MenuItem icon="refresh" title="Về HCMRainVision" hideBorder />
        </View>
        
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, title, hideBorder = false }: { icon: IconName; title: string; hideBorder?: boolean }) {
  return (
    <Pressable style={[styles.menuItem, !hideBorder && styles.menuItemBorder]}>
      <View style={styles.menuIcon}>
        <Icon name={icon} color="#d4e4fa" size={20} />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <Icon name="arrow_forward" color="#849492" size={16} />
    </Pressable>
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
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)',
    marginBottom: 32,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 20, 36, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00f2ea',
  },
  profileDesc: {
    fontSize: 13,
    color: '#b9cac8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b9cac8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: 'rgba(22, 37, 41, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 20, 36, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#d4e4fa',
    fontWeight: '500',
  },
});
