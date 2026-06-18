import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';
import { AdminUser } from '@/types/api';

export default function ManageUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [banLoading, setBanLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string) => {
    setLoading(true);
    try {
      const res = await apiClient.getUsers(search, 'newest', 1, 30);
      const data = res.data;
      const list: AdminUser[] = Array.isArray(data)
        ? data
        : data.items || data.data || [];
      setUsers(list);
    } catch (e: any) {
      console.error('getUsers error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim().length >= 2 || text.trim().length === 0) {
      fetchUsers(text.trim() || undefined);
    }
  };

  const handleBan = async (user: AdminUser) => {
    if (user.status === 'Banned') {
      Alert.alert('Thông báo', 'Tài khoản này đã bị khoá.');
      return;
    }
    Alert.alert(
      'Xác nhận khoá tài khoản',
      `Bạn có chắc muốn khoá tài khoản "${user.username}"?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Khoá',
          style: 'destructive',
          onPress: async () => {
            setBanLoading(user.id);
            try {
              await apiClient.banUser(user.id);
              setUsers((prev) =>
                prev.map((u) => u.id === user.id ? { ...u, status: 'Banned' } : u)
              );
            } catch (e: any) {
              Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể khoá tài khoản');
            } finally {
              setBanLoading(null);
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: string) => role === 'Admin' ? '#818cf8' : '#b9cac8';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>Quản lý Người dùng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" color="#849492" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tài khoản..."
            placeholderTextColor="#849492"
            value={searchText}
            onChangeText={handleSearch}
          />
          {loading && <ActivityIndicator size="small" color="#00f2ea" />}
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.loadingText}>Đang tải danh sách người dùng...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {users.length === 0 ? (
            <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={[styles.avatar, { backgroundColor: user.status === 'Banned' ? 'rgba(255,180,171,0.2)' : 'rgba(0, 242, 234, 0.15)' }]}>
                  <Text style={[styles.avatarText, { color: user.status === 'Banned' ? '#ffb4ab' : '#00f2ea' }]}>
                    {user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.username}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.roleBadge, { borderColor: getRoleColor(user.role) + '40', backgroundColor: getRoleColor(user.role) + '15' }]}>
                      <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>{user.role}</Text>
                    </View>
                    {user.status === 'Banned' && (
                      <View style={styles.bannedBadge}>
                        <Text style={styles.bannedText}>Đã khoá</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Pressable
                  style={[styles.actionBtn, user.status === 'Banned' && styles.actionBtnDisabled]}
                  onPress={() => handleBan(user)}
                  disabled={banLoading === user.id || user.status === 'Banned'}
                >
                  {banLoading === user.id ? (
                    <ActivityIndicator size="small" color="#ffb4ab" />
                  ) : (
                    <Icon
                      name={user.status === 'Banned' ? 'lock_outline' : 'more_vert'}
                      color={user.status === 'Banned' ? '#64748b' : '#849492'}
                      size={22}
                    />
                  )}
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#d4e4fa' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 37, 41, 0.8)', paddingHorizontal: 16, borderRadius: 12, height: 44, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  searchInput: { flex: 1, color: '#d4e4fa', fontSize: 14 },
  scrollContent: { padding: 16, gap: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#d4e4fa', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#849492', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  roleText: { fontSize: 11, fontWeight: '600' },
  bannedBadge: { backgroundColor: 'rgba(255,180,171,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,180,171,0.3)' },
  bannedText: { fontSize: 11, fontWeight: '600', color: '#ffb4ab' },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  actionBtnDisabled: { opacity: 0.4 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  emptyText: { color: '#64748b', textAlign: 'center', paddingTop: 40, fontSize: 14 },
});
