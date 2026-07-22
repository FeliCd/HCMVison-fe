/**
 * route-guards.tsx — Các component bảo vệ route theo quyền.
 *
 * RequireAuth  : Redirect về /login nếu chưa đăng nhập
 * RequireAdmin : Redirect về /login nếu chưa đăng nhập, hoặc về /(tabs)/explore nếu không có quyền Admin
 *
 * Trong khi kiểm tra quyền (đang load), hiển thị loading spinner.
 */
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

/**
 * Bảo vệ route: chỉ cho vào nếu đã đăng nhập.
 * Trong lúc kiểm tra (isLoading) → hiển thị spinner.
 * Chưa đăng nhập → redirect /login và render null để tránh flash UI.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingState text="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Bảo vệ route: chỉ cho vào nếu đã đăng nhập VÀ có quyền Admin.
 * Chưa đăng nhập → redirect /login.
 * Đăng nhập nhưng không phải Admin → redirect /(tabs)/explore.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/(tabs)/explore');
    }
  }, [isAdmin, isAuthenticated, isLoading]);

  if (isLoading) {
    return <LoadingState text="Đang kiểm tra quyền truy cập..." />;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}

function LoadingState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color="#00f2ea" />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#051424',
    gap: 12,
  },
  text: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
