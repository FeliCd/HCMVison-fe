import { saveDeviceToken, deleteDeviceToken } from '@/services/auth';
import { getToken } from '@/services/core';
import { syncCurrentUserLocationAsync } from '@/services/location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsType from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';



const DEVICE_ID_STORAGE_KEY = 'hcmvision.deviceId';
const FCM_TOKEN_STORAGE_KEY = 'hcmvision.fcmToken';
const ANDROID_CHANNEL_ID = 'rain_alerts';
const NOTIFICATION_NAVIGATION_DELAY_MS = 300;
const NOTIFICATION_NAVIGATION_RETRY_MS = 350;
const NOTIFICATION_NAVIGATION_MAX_ATTEMPTS = 8;

type SyncOptions = {
  requestPermission?: boolean;
};

type NotificationCameraRoute = {
  pathname: '/cameras';
  params: { wardId: string };
};

type RemovableSubscription = {
  remove: () => void;
};

const noopSubscription: RemovableSubscription = {
  remove: () => {},
};

const isExpoGo = Constants.appOwnership === 'expo';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications = (Platform.OS !== 'web' && !isExpoGo) ? require('expo-notifications') : null;
let pendingNotificationRoute: NotificationCameraRoute | null = null;
let notificationNavigationTimer: ReturnType<typeof setTimeout> | null = null;

if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // Expo SDK 56 uses banner/list for foreground presentation.
        // The backend still sends a Notification payload so the OS can show tray notifications when the app is killed.
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Notifications.setNotificationHandler is not supported in this environment:', e);
  }
}



function createFallbackDeviceId() {
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function getStoredDeviceIdAsync() {
  return AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
}

async function getStoredFcmTokenAsync() {
  return AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
}

export async function getOrCreateDeviceIdAsync() {
  const storedDeviceId = await getStoredDeviceIdAsync();
  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = createFallbackDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  return deviceId;
}

async function ensureAndroidNotificationChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Rain alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00f2ea',
  });
}

async function hasNotificationPermissionAsync(requestPermission: boolean) {
  const currentPermission = await Notifications.getPermissionsAsync();
  if (currentPermission.status === 'granted') {
    return true;
  }

  if (!requestPermission) {
    return false;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.status === 'granted';
}

function getNativeTokenString(token: NotificationsType.DevicePushToken) {
  return typeof token.data === 'string' ? token.data : null;
}

function normalizeNotificationDataString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getWardIdFromDeeplink(value: unknown) {
  const deeplink = normalizeNotificationDataString(value);
  if (!deeplink) {
    return null;
  }

  const match = deeplink.match(/(?:^|\/)weather\/ward\/([^/?#]+)/i);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]).trim() || null;
  } catch {
    return match[1].trim() || null;
  }
}

function createNotificationRoute(wardId: string): NotificationCameraRoute {
  return {
    pathname: '/cameras',
    params: { wardId },
  };
}

export function consumePendingNotificationRoute() {
  const route = pendingNotificationRoute;
  pendingNotificationRoute = null;
  return route;
}

function scheduleNotificationNavigation(route: NotificationCameraRoute, attempt = 0) {
  pendingNotificationRoute = route;

  if (notificationNavigationTimer) {
    clearTimeout(notificationNavigationTimer);
  }

  const delay = attempt === 0 ? NOTIFICATION_NAVIGATION_DELAY_MS : NOTIFICATION_NAVIGATION_RETRY_MS;
  notificationNavigationTimer = setTimeout(() => {
    try {
      router.replace(route);
      pendingNotificationRoute = null;
    } catch (error) {
      if (attempt < NOTIFICATION_NAVIGATION_MAX_ATTEMPTS) {
        scheduleNotificationNavigation(route, attempt + 1);
        return;
      }

      console.warn('Failed to navigate from notification response.', error);
    }
  }, delay);
}

export async function registerForPushNotificationsAsync(options: SyncOptions = {}) {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications usually require a physical device or a simulator with push support.');
  }

  await ensureAndroidNotificationChannelAsync();

  const permissionGranted = await hasNotificationPermissionAsync(options.requestPermission ?? true);
  if (!permissionGranted) {
    return null;
  }

  const devicePushToken = await Notifications.getDevicePushTokenAsync();
  const fcmToken = getNativeTokenString(devicePushToken);

  if (!fcmToken) {
    console.warn('Native device push token is not a string on this platform.');
    return null;
  }

  return fcmToken;
}

export async function saveDevicePushTokenAsync(fcmToken: string) {
  const deviceId = await getOrCreateDeviceIdAsync();

  await saveDeviceToken({
    fcmToken,
    deviceId,
    platform: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'unknown',
    appVersion: Constants.expoConfig?.version,
  });

  // Keep a local copy only to revoke this exact backend token during explicit logout.
  await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
}

export async function syncDeviceTokenAsync(options: SyncOptions = {}) {
  const authToken = await getToken();
  if (!authToken) {
    return null;
  }

  const fcmToken = await registerForPushNotificationsAsync(options);
  if (!fcmToken) {
    return null;
  }

  await saveDevicePushTokenAsync(fcmToken);
  return fcmToken;
}

export async function revokeCurrentDeviceTokenAsync() {
  const storedToken = await getStoredFcmTokenAsync();
  const fcmToken =
    storedToken ?? (await registerForPushNotificationsAsync({ requestPermission: false }));

  if (!fcmToken) {
    return;
  }

  await deleteDeviceToken({ fcmToken });
  await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

export function addPushTokenRefreshListener(): RemovableSubscription {
  if (Platform.OS === 'web' || isExpoGo) {
    return noopSubscription;
  }

  try {
    return Notifications.addPushTokenListener((token: NotificationsType.DevicePushToken) => {
      const fcmToken = getNativeTokenString(token);
      if (!fcmToken) {
        return;
      }

      void getToken().then((authToken: string | null) => {
        if (!authToken) {
          return;
        }

        void saveDevicePushTokenAsync(fcmToken).catch((error) => {
          console.warn('Failed to save refreshed FCM token.', error);
        });
      });
    });
  } catch (error) {
    console.warn('Push token refresh listener is unavailable in this runtime.', error);
    return noopSubscription;
  }
}

export function addAuthenticatedAppStateSyncListener() {
  return AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      return;
    }

    // App close/kill is not logout. We only refresh the registration when the app becomes active again.
    void syncDeviceTokenAsync({ requestPermission: false }).catch((error) => {
      console.warn('Failed to refresh FCM token on app resume.', error);
    });

    void syncCurrentUserLocationAsync({ requestPermission: false }).catch((error) => {
      console.warn('Failed to refresh current location on app resume.', error);
    });
  });
}

function getWardIdFromNotification(response: NotificationsType.NotificationResponse) {
  const data = response.notification.request.content.data ?? {};
  const wardId = normalizeNotificationDataString(data.wardId);
  return wardId ?? getWardIdFromDeeplink(data.deeplink) ?? getWardIdFromDeeplink(data.url);
}

export function handleNotificationResponse(response: NotificationsType.NotificationResponse | null) {
  if (!response) {
    return;
  }

  const wardId = getWardIdFromNotification(response);
  if (!wardId) {
    return;
  }

  scheduleNotificationNavigation(createNotificationRoute(wardId));
}

function getLastNotificationResponseSafely() {
  try {
    return Notifications.getLastNotificationResponse();
  } catch (error) {
    console.warn('Initial notification response is unavailable in this runtime.', error);
    return null;
  }
}

export function addNotificationTapListener(): RemovableSubscription {
  if (Platform.OS === 'web' || isExpoGo) {
    return noopSubscription;
  }

  handleNotificationResponse(getLastNotificationResponseSafely());

  try {
    return Notifications.addNotificationResponseReceivedListener((response: NotificationsType.NotificationResponse) => {
      handleNotificationResponse(response);
    });
  } catch (error) {
    console.warn('Notification tap listener is unavailable in this runtime.', error);
    return noopSubscription;
  }
}
