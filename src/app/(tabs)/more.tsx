import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/icons';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Cài đặt & Thêm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Section */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Icon name="account_circle" size={60} color="#94a3b8" />
            <View style={styles.editAvatarBadge}>
              <Icon name="edit" size={12} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Nguyễn Văn A</Text>
            <Text style={styles.profileEmail}>nguyenvana@example.com</Text>
          </View>
        </Animated.View>

        {/* Menu Sections */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <MenuRow icon="person_outline" title="Chỉnh sửa thông tin" />
          <MenuRow icon="lock_outline" title="Đổi mật khẩu" />
          <MenuRow icon="notifications_none" title="Cài đặt thông báo" />
          
          <Pressable 
            style={styles.menuRow}
            onPress={() => router.push('/admin')}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.iconContainer}>
                <Icon name="admin_panel_settings" size={22} color="#818cf8" />
              </View>
              <Text style={styles.menuRowTitle}>Quản trị viên (Admin)</Text>
            </View>
            <Icon name="chevron_right" size={20} color="#94a3b8" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <MenuRow icon="language" title="Ngôn ngữ" value="Tiếng Việt" />
          <MenuRow icon="dark_mode" title="Giao diện" value="Tự động" />
          <MenuRow icon="help_outline" title="Trợ giúp & Hỗ trợ" />
          <MenuRow icon="info_outline" title="Giới thiệu về HCMVision" value="v1.0.0" />
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <Pressable style={styles.logoutButton}>
            <Icon name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, title, value }: { icon: IconName; title: string; value?: string }) {
  return (
    <Pressable style={styles.menuRow}>
      <View style={styles.menuRowLeft}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={22} color="#64748b" />
        </View>
        <Text style={styles.menuRowTitle}>{title}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {value && <Text style={styles.menuRowValue}>{value}</Text>}
        <Icon name="chevron_right" size={20} color="#94a3b8" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
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
