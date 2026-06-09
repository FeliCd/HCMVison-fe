import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function ManageUsersScreen() {
  const insets = useSafeAreaInsets();

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
          <TextInput style={styles.searchInput} placeholder="Tìm kiếm tài khoản..." placeholderTextColor="#849492" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>N</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>nguyenvana</Text>
            <Text style={styles.userRole}>Người dùng • Đăng nhập 2 giờ trước</Text>
          </View>
          <Icon name="more_vert" color="#849492" size={24} />
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>admin_root</Text>
            <Text style={styles.userRoleAdmin}>Quản trị viên • Online</Text>
          </View>
          <Icon name="more_vert" color="#849492" size={24} />
        </View>
      </ScrollView>
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
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(22, 37, 41, 0.5)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00f2ea', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#003735', fontSize: 18, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#d4e4fa', marginBottom: 2 },
  userRole: { fontSize: 12, color: '#b9cac8' },
  userRoleAdmin: { fontSize: 12, color: '#00f2ea' },
});
