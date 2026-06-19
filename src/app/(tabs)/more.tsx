import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Cài đặt & Thêm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.duration(500)} style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Icon name="account_circle" size={60} color="#94a3b8" />
            <View style={styles.editAvatarBadge}>
              <Icon name="edit" size={12} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.fullName || user?.username || 'HCMVision User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email || 'Chưa có email'}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <MenuRow icon="person_outline" title="Chỉnh sửa thông tin" />
          <MenuRow icon="lock_outline" title="Đổi mật khẩu" />
          <MenuRow
            icon="notifications_none"
            title="Cài đặt thông báo"
            onPress={() => router.push('/permission-notification')}
          />

          <MenuRow
            icon="admin_panel_settings"
            iconColor="#818cf8"
            title="Quản trị viên (Admin)"
            onPress={() => router.push('/admin')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <MenuRow icon="language" title="Ngôn ngữ" value="Tiếng Việt" />
          <MenuRow icon="dark_mode" title="Giao diện" value="Tự động" />
          <MenuRow icon="help_outline" title="Trợ giúp & Hỗ trợ" />
          <MenuRow icon="info_outline" title="Giới thiệu về HCMVision" value="v1.0.0" />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <Pressable
            style={[styles.logoutButton, isLoggingOut && styles.disabledButton]}
            disabled={isLoggingOut}
            onPress={handleLogout}
          >
            <Icon name="logout" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  value,
  iconColor = '#64748b',
  onPress,
}: {
  icon: IconName;
  title: string;
  value?: string;
  iconColor?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.menuRow, !onPress && styles.inactiveMenuRow]}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={styles.menuRowLeft}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.menuRowTitle}>{title}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {value ? <Text style={styles.menuRowValue}>{value}</Text> : null}
        <Icon name="chevron_right" size={20} color={onPress ? '#94a3b8' : '#475569'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
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
    fontWeight: '700',
    color: '#ffffff',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  inactiveMenuRow: {
    opacity: 0.75,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuRowTitle: {
    fontSize: 15,
    color: '#e2e8f0',
    fontWeight: '500',
    marginLeft: 12,
  },
  menuRowValue: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 8,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
});
