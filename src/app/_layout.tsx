/**
 * _layout.tsx — Root layout của toàn bộ app.
 *
 * Cây Provider (từ ngoài vào trong):
 *  ThemeProvider        → quản lý theme sáng/tối
 *    AppQueryProvider   → TanStack Query client (cache API calls)
 *      AuthProvider     → trạng thái auth user
 *        NotificationLifecycle → đăng ký event notification
 *          Stack        → navigation stack chính
 *
 * NotificationLifecycle:
 *  Mount: đăng ký listener cho tap notification và push token refresh
 *  Unmount: hủy đăng ký (cleanup tự động)
 */
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { AppQueryProvider } from '@/providers/query-provider';
import {
  addAuthenticatedAppStateSyncListener,
  addNotificationTapListener,
  addPushTokenRefreshListener,
} from '@/services/NotificationManager';

LogBox.ignoreLogs([
  '[Reanimated] Property "opacity" of AnimatedComponent(View) may be overwritten by a layout animation.',
]);

/**
 * Component rừng — chỉ chạy side effect và cleanup, không render UI.
 * - addNotificationTapListener      : xử lý khi user tap vào thông báo push
 * - addPushTokenRefreshListener     : lắng nghe FCM token mới và sync lên server
 * - addAuthenticatedAppStateSyncListener : sync khi app foreground (gửi lại GPS, token)
 */
function NotificationLifecycle() {
  useEffect(() => {
    const tapSubscription = addNotificationTapListener();
    const tokenSubscription = addPushTokenRefreshListener();
    const appStateSubscription = addAuthenticatedAppStateSyncListener();

    return () => {
      tapSubscription.remove();
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AppQueryProvider>
        <AuthProvider>
          <NotificationLifecycle />
          <ExpoThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }} />
          </ExpoThemeProvider>
        </AuthProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}
