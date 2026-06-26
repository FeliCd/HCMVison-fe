<<<<<<< HEAD
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
=======
import { DarkTheme, DefaultTheme, ThemeProvider as ExpoThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { LogBox, useColorScheme } from 'react-native';
>>>>>>> 31a032803982e8d4df712da53c55cf25ecd0a7d7

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { AppQueryProvider } from '@/providers/query-provider';

LogBox.ignoreLogs([
  '[Reanimated] Property "opacity" of AnimatedComponent(View) may be overwritten by a layout animation.',
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <AppQueryProvider>
        <AuthProvider>
          <ExpoThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />
            <Stack screenOptions={{ headerShown: false }} />
          </ExpoThemeProvider>
        </AuthProvider>
      </AppQueryProvider>
    </ThemeProvider>
  );
}
