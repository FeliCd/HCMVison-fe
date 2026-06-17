import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { apiClient } from '@/services/api';
import { User } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('authToken');
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();

    // Register 401 callback
    apiClient.setUnauthorizedCallback(async () => {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/login');
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(username, password);
      const { token } = response.data as any;
      await apiClient.setToken(token);
      
      // The backend login response doesn't contain the full user object, so we fetch it
      const profileResponse = await apiClient.getProfile();
      const userData = profileResponse.data as User;
      
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      router.replace('/(tabs)/explore');
    } catch (err: any) {
      // Backend may return plain text string or JSON with message/title
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

  const register = useCallback(async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.register(username, email, password);
      // After register, auto-login
      try {
        await login(username, password);
      } catch {
        // If auto-login fails, just navigate to login page
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

  const logout = useCallback(async () => {
    await apiClient.clearToken();
    await AsyncStorage.removeItem('user');
    setUser(null);
    router.replace('/login');
  }, []);

  const clearError = useCallback(() => setError(null), []);

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
      },
    },
    children
  );
}
