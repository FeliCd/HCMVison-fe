import { getUsers, updateUserStatus, updateUserRole } from '@/services/admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';

import { AdminRole, AdminUser } from '@/types/api';
import { formatAdminRole, formatAdminUserStatus } from '@/utils/admin-display';
import { getApiErrorMessage } from '@/utils/api-error';

type RoleFilter = 'all' | AdminRole;
type StatusFilter = 'all' | 'active' | 'banned';

const pageSize = 20;

export default function ManageUsersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText]);

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () =>
      (
        await getUsers({
          search: debouncedSearch || undefined,
          role: roleFilter === 'all' ? undefined : roleFilter,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
          page,
          pageSize,
        })
      ).data,
  });

  const invalidateUsers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] }),
    ]);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      updateUserStatus(id, isActive),
    onSuccess: async () => {
      setSelectedUser(null);
      await invalidateUsers();
    },
    onError: (error) => {
      Alert.alert('Không thể cập nhật trạng thái', getApiErrorMessage(error, 'Không thể cập nhật dữ liệu. Vui lòng thử lại.'));
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: AdminRole }) => updateUserRole(id, role),
    onSuccess: async () => {
      setSelectedUser(null);
      await invalidateUsers();
    },
    onError: (error) => {
      Alert.alert('Không thể cập nhật quyền', getApiErrorMessage(error, 'Không thể cập nhật dữ liệu. Vui lòng thử lại.'));
    },
  });

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedIsCurrentUser = selectedUser?.id === currentUser?.id;
  const isMutating = statusMutation.isPending || roleMutation.isPending;

  const confirmStatusChange = (account: AdminUser) => {
    const nextIsActive = !account.isActive;
    const action = nextIsActive ? 'mở khóa' : 'khóa';

    Alert.alert(
      `${action.charAt(0).toUpperCase()}${action.slice(1)} tài khoản`,
      `Bạn có chắc chắn muốn ${action} tài khoản "${account.username}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: nextIsActive ? 'Mở khóa' : 'Khóa',
          style: nextIsActive ? 'default' : 'destructive',
          onPress: () => statusMutation.mutate({ id: account.id, isActive: nextIsActive }),
        },
      ]
    );
  };

  const confirmRoleChange = (account: AdminUser, role: AdminRole) => {
    if (role === account.role) return;

    Alert.alert(
      'Xác nhận thay đổi quyền',
      `Đổi quyền của "${account.username}" thành ${formatAdminRole(role).toLowerCase()}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => roleMutation.mutate({ id: account.id, role }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Quản lý tài khoản</Text>
          <Text style={styles.headerSubtitle}>{total} tài khoản</Text>
        </View>
        <Pressable style={styles.headerButton} onPress={() => usersQuery.refetch()}>
          <Icon name="refresh" color="#d4e4fa" size={22} />
        </Pressable>
      </View>

      <View style={styles.filterArea}>
        <View style={styles.searchBar}>
          <Icon name="search" color="#849492" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên đăng nhập hoặc email"
            placeholderTextColor="#849492"
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {usersQuery.isFetching ? <ActivityIndicator color="#00f2ea" size="small" /> : null}
        </View>

        <FilterGroup
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'Admin', label: 'Quản trị viên' },
            { value: 'User', label: 'Người dùng' },
          ]}
          selected={roleFilter}
          onSelect={(value) => {
            setRoleFilter(value as RoleFilter);
            setPage(1);
          }}
        />
        <FilterGroup
          options={[
            { value: 'all', label: 'Mọi trạng thái' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'banned', label: 'Đã khóa' },
          ]}
          selected={statusFilter}
          onSelect={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
        />
      </View>

      {usersQuery.isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#00f2ea" />
          <Text style={styles.stateText}>Đang tải danh sách tài khoản...</Text>
        </View>
      ) : usersQuery.isError ? (
        <View style={styles.centerState}>
          <Icon name="warning" color="#fca5a5" size={28} />
          <Text style={styles.stateText}>Không tải được danh sách tài khoản.</Text>
          <Pressable style={styles.retryButton} onPress={() => usersQuery.refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {users.length ? (
            users.map((account) => (
              <Pressable key={account.id} style={styles.userRow} onPress={() => setSelectedUser(account)}>
                <View style={[styles.avatar, !account.isActive && styles.avatarLocked]}>
                  <Text style={styles.avatarText}>{account.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userCopy}>
                  <View style={styles.userTitleRow}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {account.fullName || account.username}
                    </Text>
                    {account.id === currentUser?.id ? <Text style={styles.currentUser}>Bạn</Text> : null}
                  </View>
                  <Text style={styles.email} numberOfLines={1}>
                    {account.email}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={formatAdminRole(account.role)} tone={account.role === 'Admin' ? 'admin' : 'neutral'} />
                    <Badge
                      label={formatAdminUserStatus(account.status)}
                      tone={account.isActive ? 'active' : 'locked'}
                    />
                  </View>
                </View>
                <Icon name="more_vert" color="#849492" size={22} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>Không tìm thấy tài khoản phù hợp.</Text>
          )}

          {total > pageSize ? (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
                disabled={page === 1}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Icon name="arrow_back" color={page === 1 ? '#475569' : '#d4e4fa'} size={18} />
              </Pressable>
              <Text style={styles.pageText}>
                Trang {page}/{totalPages}
              </Text>
              <Pressable
                style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
                disabled={page >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <Icon name="arrow_forward" color={page >= totalPages ? '#475569' : '#d4e4fa'} size={18} />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        transparent
        visible={selectedUser !== null}
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedUser(null)} />
          {selectedUser ? (
            <View style={styles.modalPanel}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedUser.username}</Text>
                  <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                </View>
                <Pressable style={styles.closeButton} onPress={() => setSelectedUser(null)}>
                  <Icon name="close" color="#d4e4fa" size={20} />
                </Pressable>
              </View>

              {selectedIsCurrentUser ? (
                <Text style={styles.selfNotice}>Bạn không thể thay đổi quyền hoặc trạng thái tài khoản của chính mình.</Text>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Phân quyền</Text>
                  <View style={styles.roleOptions}>
                    {(['User', 'Admin'] as AdminRole[]).map((role) => {
                      const isSelected = selectedUser.role === role;
                      return (
                        <Pressable
                          key={role}
                          style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                          disabled={isMutating}
                          onPress={() => confirmRoleChange(selectedUser, role)}
                        >
                          <Text style={[styles.roleOptionText, isSelected && styles.roleOptionTextSelected]}>
                            {formatAdminRole(role)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    style={[styles.statusAction, selectedUser.isActive ? styles.lockAction : styles.unlockAction]}
                    disabled={isMutating}
                    onPress={() => confirmStatusChange(selectedUser)}
                  >
                    {isMutating ? (
                      <ActivityIndicator color="#f8fafc" size="small" />
                    ) : (
                      <>
                        <Icon name="lock_outline" color="#f8fafc" size={19} />
                        <Text style={styles.statusActionText}>
                          {selectedUser.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function FilterGroup({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterGroup}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            style={[styles.filterChip, isSelected && styles.filterChipSelected]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Badge({ label, tone }: { label: string; tone: 'admin' | 'neutral' | 'active' | 'locked' }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0b1120',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  headerTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  filterArea: { padding: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: { flex: 1, color: '#e2e8f0', fontSize: 14 },
  filterGroup: { gap: 8 },
  filterChip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipSelected: { backgroundColor: 'rgba(0,242,234,0.14)', borderWidth: 1, borderColor: 'rgba(0,242,234,0.3)' },
  filterChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  filterChipTextSelected: { color: '#67e8f9' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  stateText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(0,242,234,0.12)' },
  retryText: { color: '#67e8f9', fontWeight: '800', fontSize: 13 },
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 8,
    backgroundColor: 'rgba(22,37,41,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,242,234,0.14)' },
  avatarLocked: { backgroundColor: 'rgba(248,113,113,0.15)' },
  avatarText: { color: '#d4e4fa', fontSize: 17, fontWeight: '800' },
  userCopy: { flex: 1, minWidth: 0 },
  userTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  userName: { flexShrink: 1, color: '#e2e8f0', fontSize: 15, fontWeight: '800' },
  currentUser: { color: '#67e8f9', fontSize: 11, fontWeight: '700' },
  email: { marginTop: 2, color: '#94a3b8', fontSize: 12 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badge_admin: { backgroundColor: 'rgba(165,180,252,0.15)' },
  badge_neutral: { backgroundColor: 'rgba(148,163,184,0.14)' },
  badge_active: { backgroundColor: 'rgba(52,211,153,0.14)' },
  badge_locked: { backgroundColor: 'rgba(248,113,113,0.14)' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeText_admin: { color: '#c7d2fe' },
  badgeText_neutral: { color: '#cbd5e1' },
  badgeText_active: { color: '#86efac' },
  badgeText_locked: { color: '#fca5a5' },
  emptyText: { color: '#94a3b8', textAlign: 'center', paddingTop: 42, fontSize: 14 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10 },
  pageButton: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  pageButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.03)' },
  pageText: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,6,23,0.74)' },
  modalPanel: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800' },
  modalEmail: { marginTop: 4, color: '#94a3b8', fontSize: 13 },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  selfNotice: { marginTop: 20, color: '#fbbf24', fontSize: 13, lineHeight: 20 },
  modalLabel: { marginTop: 22, marginBottom: 9, color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  roleOptions: { flexDirection: 'row', gap: 10 },
  roleOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  roleOptionSelected: { backgroundColor: 'rgba(165,180,252,0.18)', borderWidth: 1, borderColor: 'rgba(165,180,252,0.4)' },
  roleOptionText: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  roleOptionTextSelected: { color: '#e0e7ff' },
  statusAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, marginTop: 14, borderRadius: 8 },
  lockAction: { backgroundColor: '#b91c1c' },
  unlockAction: { backgroundColor: '#047857' },
  statusActionText: { color: '#f8fafc', fontSize: 14, fontWeight: '800' },
});
