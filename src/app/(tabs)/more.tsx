import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/icons';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const displayName = user?.fullName || user?.username || 'Người dùng';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Cài đặt & Thêm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Profile Section */}
        <Animated.View entering={FadeInUp.duration(500)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
            <View style={styles.editAvatarBadge}>
              <Icon name="edit" size={12} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            {displayEmail ? <Text style={styles.profileEmail}>{displayEmail}</Text> : null}
            {user?.role === 'Admin' && (
              <View style={styles.adminBadge}>
                <Icon name="admin_panel_settings" size={12} color="#818cf8" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Menu Sections */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <MenuRow icon="person_outline" title="Chỉnh sửa thông tin" />
          <MenuRow icon="lock_outline" title="Đổi mật khẩu" />
          <MenuRow icon="notifications_none" title="Cài đặt thông báo" />

          {user?.role === 'Admin' && (
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
          )}
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
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
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
    fontWeight: '800',
    color: '#d4e4fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    marginBottom: 20,
    marginTop: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 242, 234, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 234, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00f2ea',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00f2ea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d4e4fa',
  },
  profileEmail: {
    fontSize: 13,
    color: '#b9cac8',
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
  },
  menuSection: {
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 20, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuRowTitle: {
    fontSize: 15,
    color: '#d4e4fa',
    fontWeight: '500',
  },
  menuRowValue: {
    fontSize: 13,
    color: '#64748b',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
});
