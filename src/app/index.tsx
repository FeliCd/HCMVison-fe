import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { consumePendingNotificationRoute } from '@/services/NotificationManager';
import { isOnboardingCompleteAsync } from '@/services/onboarding';
import WelcomeScreen from './(onboarding)/welcome';

type InitialRoute = ReturnType<typeof consumePendingNotificationRoute> | '/(tabs)/explore' | 'welcome';

export default function HomeScreen() {
  const [initialRoute, setInitialRoute] = useState<InitialRoute | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const notificationRoute = consumePendingNotificationRoute();
      if (notificationRoute) {
        if (isMounted) {
          setInitialRoute(notificationRoute);
        }
        return;
      }

      const onboardingComplete = await isOnboardingCompleteAsync();
      const lateNotificationRoute = consumePendingNotificationRoute();
      if (lateNotificationRoute) {
        if (isMounted) {
          setInitialRoute(lateNotificationRoute);
        }
        return;
      }

      if (isMounted) {
        setInitialRoute(onboardingComplete ? '/(tabs)/explore' : 'welcome');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (initialRoute === 'welcome') {
    return <WelcomeScreen />;
  }

  if (initialRoute) {
    return <Redirect href={initialRoute as any} />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#00f2ea" />
      <Text style={styles.text}>Đang mở bản đồ...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
