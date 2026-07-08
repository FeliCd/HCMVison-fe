import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminBottomBar } from '@/components/admin-bottom-bar';
import { Icon, IconName } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';

interface SettingLink {
  icon: IconName;
  title: string;
  subtitle: string;
  href: string;
}

const userFeatures: SettingLink[] = [
  { icon: 'map', title: 'Bản đồ', subtitle: 'Theo dõi camera theo khu vực', href: '/(tabs)/explore' },
  { icon: 'directions_car', title: 'Tuyến đường', subtitle: 'Kiểm tra rủi ro khi di chuyển', href: '/(tabs)/route' },
  { icon: 'videocam', title: 'Camera', subtitle: 'Xem ảnh và trạng thái camera', href: '/(tabs)/system-status' },
  { icon: 'notifications', title: 'Cảnh báo', subtitle: 'Xem cảnh báo công khai', href: '/(tabs)/warning' },
  { icon: 'smart_toy', title: 'Trợ lý AI', subtitle: 'Hỏi đáp mưa và giao thông', href: '/chatbot' },
  { icon: 'person_outline', title: 'Hồ sơ', subtitle: 'Cập nhật thông tin cá nhân', href: '/profile/edit' },
  { icon: 'notifications_none', title: 'Đăng ký cảnh báo', subtitle: 'Quản lý khu vực nhận tin', href: '/profile/subscriptions' },
  { icon: 'dark_mode', title: 'Giao diện', subtitle: 'Chọn chế độ hiển thị', href: '/profile/theme-settings' },
];

const adminFeatures: SettingLink[] = [
  { icon: 'person_outline', title: 'Quản lý tài khoản', subtitle: 'Khóa, mở khóa và phân quyền', href: '/admin/manage-users' },
  { icon: 'wifi', title: 'Sức khỏe hệ thống', subtitle: 'Theo dõi camera và stream', href: '/admin/system-health' },
  { icon: 'update', title: 'Đồng bộ dữ liệu', subtitle: 'Theo dõi các phiên quét camera', href: '/admin/ingestion' },
  { icon: 'smart_toy', title: 'Kiểm tra AI', subtitle: 'Chạy phân tích thử cho camera', href: '/admin/test-ai' },
  { icon: 'videocam', title: 'Quản lý camera', subtitle: 'Thêm, sửa và cập nhật stream', href: '/admin/manage-cameras' },
];

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const displayName = user?.fullName || user?.username || 'Quản trị viên';

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi HCMVision?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Cài đặt quản trị</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Tài khoản quản trị'}</Text>
            <View style={styles.roleBadge}>
              <Icon name="admin_panel_settings" color="#a5b4fc" size={14} />
              <Text style={styles.roleText}>Quản trị viên</Text>
            </View>
          </View>
        </View>

        <SettingSection title="Chức năng người dùng" items={userFeatures} />
        <SettingSection title="Quản trị hệ thống" items={adminFeatures} />

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" color="#fca5a5" size={20} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AdminBottomBar active="settings" />
    </View>
  );
}

function SettingSection({ title, items }: { title: string; items: SettingLink[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionList}>
        {items.map((item, index) => (
          <Pressable
            key={item.href}
            style={[styles.row, index > 0 && styles.rowBorder]}
            onPress={() => router.push(item.href as never)}
          >
            <View style={styles.rowIcon}>
              <Icon name={item.icon} color="#93c5fd" size={20} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
            <Icon name="chevron_right" color="#64748b" size={20} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#111827',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '800',
  },
  content: {
    padding: 16,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#131c2c',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.22)',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(165,180,252,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.32)',
  },
  avatarText: {
    color: '#c7d2fe',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  profileEmail: {
    marginTop: 3,
    color: '#94a3b8',
    fontSize: 13,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  roleText: {
    color: '#c7d2fe',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 9,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionList: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#131c2c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 70,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(147,197,253,0.1)',
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomSpacer: {
    height: 96,
  },
});
