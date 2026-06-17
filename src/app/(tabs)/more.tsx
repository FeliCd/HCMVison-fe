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
    fontWeight: '800',
    color: '#d4e4fa',
    marginBottom: 24,
    letterSpacing: -0.6,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d4e4fa',
  },
  profileDesc: {
    fontSize: 13,
    color: '#b9cac8',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b9cac8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 10,
    backgroundColor: 'rgba(5, 20, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#d4e4fa',
    fontWeight: '600',
  },
});
