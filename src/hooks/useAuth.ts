/**
 * useAuth.ts — Context và hook quản lý xác thực người dùng.
 *
 * Cung cấp:
 *  - AuthProvider  : Bọc toàn bộ app, quản lý state user và token
 *  - useAuth()     : Hook để component con truy cập thông tin auth
 *
 * Luồng App khởi động (restore session):
 *  App mount → đọc 'user' và 'authToken' từ AsyncStorage
 *            → nếu cả 2 tồn tại → set user (đã đăng nhập)
 *            → setIsLoading(false) → app render màn hình phù hợp
 *
 * Luồng Đăng nhập:
 *  login(username, pw) → POST /Auth/login → lấy JWT token
 *                      → lưu token vào AsyncStorage + memory
 *                      → GET /Auth/me → lấy thông tin user
 *                      → lưu user vào AsyncStorage + state
 *                      → sync FCM token (push notification)
 *                      → sync vị trí GPS
 *                      → redirect: Admin → /admin, User → /(tabs)/explore
 *
 * Luồng Đăng ký:
 *  register() → POST /Auth/register → tự động gọi login() → redirect
 *
 * Luồng Đăng xuất:
 *  logout() → xoá FCM token khỏi server → xoá token + user → redirect /login
 *
 * Luồng 401 Auto-logout:
 *  Bất kỳ request nào trả 401 → onUnauthorized callback → xoá user → redirect /login
 */
import { setUnauthorizedCallback, setToken, clearToken } from '@/services/core';
import { login as apiLogin, getProfile, register as apiRegister } from '@/services/auth';
import { revokeCurrentDeviceTokenAsync, syncDeviceTokenAsync } from '@/services/NotificationManager';
import { syncCurrentUserLocationAsync } from '@/services/location';

import { User } from '@/types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Context types ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  loadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Hook truy cập AuthContext — phải dùng bên trong <AuthProvider> */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ─── AuthProvider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Restore session khi app khởi động ──────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('authToken');
        // Chỉ restore nếu cả user lẫn token đều còn tồn tại trong storage
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Bỏ qua lỗi đọc storage — user sẽ cần đăng nhập lại
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();

    // Đăng ký callback 401: khi bất kỳ request nào nhận 401,
    // xoá thông tin user và chuyển về trang login
    setUnauthorizedCallback(async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/login');
    });
  }, []);

  // ── Đăng nhập ──────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiLogin(username, password);
      const { token } = response.data as any;
      await setToken(token);

      // Backend chỉ trả token khi login, phải fetch profile riêng để lấy user info
      const profileResponse = await getProfile();
      const userData = profileResponse.data as User;

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Sync FCM push token — không chặn login nếu thất bại
      void syncDeviceTokenAsync({ requestPermission: false }).catch((syncError) => {
        console.warn('Failed to sync push token after login', syncError);
      });

      // Sync vị trí GPS — không chặn login nếu thất bại
      void syncCurrentUserLocationAsync({ requestPermission: false }).catch((syncError) => {
        console.warn('Failed to sync location after login', syncError);
      });

      // Redirect dựa trên role
      if (userData.role === 'Admin') {
        router.replace('/admin' as any);
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch (err: any) {
      // Backend có thể trả lỗi dưới nhiều format khác nhau — xử lý tất cả
      const responseData = err.response?.data;
      let msg: string;
      if (typeof responseData === 'string') {
        msg = responseData;
      } else if (responseData?.message) {
        msg = responseData.message;
      } else if (responseData?.title) {
        msg = responseData.title;
      } else {
        msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      }
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Đăng ký ────────────────────────────────────────────────────────────────
  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiRegister(username, email, password);
      // Sau khi đăng ký thành công → tự động đăng nhập luôn
      try {
        await login(username, password);
      } catch {
        // Nếu auto-login thất bại → chuyển trang login để user tự đăng nhập
        router.replace('/login');
      }
    } catch (err: any) {
      const responseData = err.response?.data;
      let msg: string;
      if (typeof responseData === 'string') {
        msg = responseData;
      } else if (responseData?.message) {
        msg = responseData.message;
      } else if (responseData?.title) {
        msg = responseData.title;
      } else {
        msg = 'Đăng ký thất bại. Vui lòng thử lại.';
      }
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // ── Đăng xuất ──────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Xoá FCM token khỏi server để ngừng nhận notification
    try {
      await revokeCurrentDeviceTokenAsync();
    } catch (logoutError) {
      console.warn('Failed to revoke push token during logout', logoutError);
    }

    await clearToken();
    await AsyncStorage.removeItem('user');
    setUser(null);
    router.replace('/login');
  }, []);

  /** Xoá thông báo lỗi (dùng khi user đóng error toast) */
  const clearError = useCallback(() => setError(null), []);

  /** Refresh thông tin user từ server (dùng sau khi cập nhật profile) */
  const loadUser = useCallback(async () => {
    try {
      const profileResponse = await getProfile();
      const userData = profileResponse.data as User;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.warn('Failed to load user profile', err);
    }
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        clearError,
        loadUser,
      },
    },
    children
  );
}
