import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/useAuth';
import {
  addNotificationTapListener,
  addPushTokenRefreshListener,
} from '@/services/NotificationManager';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const tapSubscription = addNotificationTapListener();
    const tokenSubscription = addPushTokenRefreshListener();

    return () => {
      tapSubscription.remove();
      tokenSubscription.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}
