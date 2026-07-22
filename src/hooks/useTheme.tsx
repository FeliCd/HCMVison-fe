/**
 * useTheme.tsx — Context quản lý theme (sáng/tối/theo hệ thống).
 *
 * Hệ thống theme 3 chế độ:
 *  - 'light'  : Bắt buộc giao diện sáng
 *  - 'dark'   : Bắt buộc giao diện tối
 *  - 'system' : Tự động theo cài đặt của thiết bị (mặc định)
 *
 * Lưu trữ tùy chọn vào AsyncStorage ('app_theme') để giữ nguyên sau khi restart app.
 *
 * Cung cấp:
 *  - ThemeProvider : Bao bọc app, quản lý state theme
 *  - useTheme()    : Hook trả về { theme, isDark, colors, setTheme }
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textMuted: string;
  primary: string;
  danger: string;
  dangerMuted: string;
  success: string;
  successMuted: string;
  border: string;
  card: string;
}

export const lightTheme: ThemeColors = {
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceHighlight: '#f8fafc',
  text: '#1e293b',
  textMuted: '#64748b',
  primary: '#0ea5e9',
  danger: '#ef4444',
  dangerMuted: '#fee2e2',
  success: '#10b981',
  successMuted: '#d1fae5',
  border: '#cbd5e1',
  card: '#ffffff',
};

export const darkTheme: ThemeColors = {
  background: '#051424', // or #0f172a
  surface: 'rgba(25, 30, 40, 0.65)',
  surfaceHighlight: '#1e293b',
  text: '#d4e4fa',
  textMuted: '#94a3b8',
  primary: '#00f2ea',
  danger: '#ef4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  success: '#10b981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  border: 'rgba(255, 255, 255, 0.14)',
  card: '#0f172a',
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');

  useEffect(() => {
    // Đọc theme đã lưu từ lần trước khi app khởi động
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
          setThemeState(storedTheme);
        }
      } catch (e) {
        console.error('Error loading theme:', e);
      }
    };
    loadTheme();
  }, []);

  /** Thay đổi theme và lưu vào AsyncStorage để giữ sau restart */
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  // Nếu chế độ 'system', đọc dark/light từ thiết bị; ngược lại dùng lựa chọn của user
  const isDark = theme === 'system' ? deviceColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Hook truy cập ThemeContext — phải dùng bên trong <ThemeProvider> */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
