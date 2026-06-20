import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, theme } = useTheme();

  const displayName = user?.fullName || user?.username || 'Người dùng';
  const displayEmail = user?.email || '';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  const themeDisplayNames: Record<string, string> = {
    light: 'Sáng',
    dark: 'Tối',
    system: 'Tự động',
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    header: { backgroundColor: colors.surfaceHighlight, borderBottomColor: colors.border },
    text: { color: colors.text },
    textMuted: { color: colors.textMuted },
    sectionTitle: { color: colors.textMuted },
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    rowBorder: { borderTopColor: colors.border },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>Cài đặt & Thêm</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Profile Section */}
        <Animated.View entering={FadeInUp.duration(500)} style={[styles.profileSection, dynamicStyles.card]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.successMuted, borderColor: colors.primary }]}>
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>{avatarLetter}</Text>
            </View>
            <View style={[styles.editAvatarBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <Icon name="edit" size={12} color="#ffffff" />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, dynamicStyles.text]}>{displayName}</Text>
            {displayEmail ? <Text style={[styles.profileEmail, dynamicStyles.textMuted]}>{displayEmail}</Text> : null}
            {user?.role === 'Admin' && (
              <View style={[styles.adminBadge, { backgroundColor: 'rgba(129, 140, 248, 0.1)', borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
                <Icon name="admin_panel_settings" size={12} color="#818cf8" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Menu Sections */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)} style={[styles.menuSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Tài khoản</Text>
          <MenuRow icon="person_outline" title="Chỉnh sửa thông tin" onPress={() => router.push('/profile/edit' as any)} colors={colors} />
          <MenuRow icon="lock_outline" title="Đổi mật khẩu" onPress={() => router.push('/profile/change-password' as any)} colors={colors} hasTopBorder />
          <MenuRow icon="notifications_none" title="Cài đặt thông báo" onPress={() => router.push('/profile/subscriptions' as any)} colors={colors} hasTopBorder />

          {user?.role === 'Admin' && (
            <Pressable
              style={[styles.menuRow, dynamicStyles.rowBorder]}
              onPress={() => router.push('/admin')}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
                  <Icon name="admin_panel_settings" size={22} color="#818cf8" />
                </View>
                <Text style={[styles.menuRowTitle, dynamicStyles.text]}>Quản trị viên (Admin)</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={[styles.menuSection, dynamicStyles.card]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Ứng dụng</Text>
          <MenuRow icon="smart_toy" title="Trợ lý AI (Chatbot)" onPress={() => router.push('/chatbot' as any)} colors={colors} />
          <MenuRow icon="language" title="Ngôn ngữ" value="Tiếng Việt" onPress={() => {}} colors={colors} hasTopBorder />
          <MenuRow icon="dark_mode" title="Giao diện" value={themeDisplayNames[theme]} onPress={() => router.push('/profile/theme-settings' as any)} colors={colors} hasTopBorder />
          <MenuRow icon="help_outline" title="Trợ giúp & Hỗ trợ" onPress={() => {}} colors={colors} hasTopBorder />
          <MenuRow icon="info_outline" title="Giới thiệu về HCMVision" value="v1.0.0" onPress={() => {}} colors={colors} hasTopBorder />
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInUp.duration(500).delay(300)}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>Đăng xuất</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, title, value, onPress, colors, hasTopBorder = false }: any) {
  return (
    <Pressable style={[styles.menuRow, hasTopBorder && { borderTopWidth: 1, borderTopColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuRowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
          <Icon name={icon} size={22} color={colors.textMuted} />
        </View>
        <Text style={[styles.menuRowTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.menuRowRight}>
        {value && <Text style={[styles.menuRowValue, { color: colors.textMuted }]}>{value}</Text>}
        <Icon name="chevron_right" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
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
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '700',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8',
  },
  menuSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuRowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuRowValue: {
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
});