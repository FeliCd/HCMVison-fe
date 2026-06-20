import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';

import { apiClient } from '@/services/api';

const DEVICE_ID_STORAGE_KEY = 'hcmvision.deviceId';
const FCM_TOKEN_STORAGE_KEY = 'hcmvision.fcmToken';
const ANDROID_CHANNEL_ID = 'rain_alerts';

type SyncOptions = {
  requestPermission?: boolean;
};

type RemovableSubscription = {
  remove: () => void;
};

const noopSubscription: RemovableSubscription = {
  remove: () => {},
};

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
    sound: 'default',
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

function getNativeTokenString(token: Notifications.DevicePushToken) {
  return typeof token.data === 'string' ? token.data : null;
}

export async function registerForPushNotificationsAsync(options: SyncOptions = {}) {
  if (Platform.OS === 'web') {
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

  await apiClient.saveDeviceToken({
    fcmToken,
    deviceId,
    platform: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : 'unknown',
    appVersion: Constants.expoConfig?.version,
  });

  // Keep a local copy only to revoke this exact backend token during explicit logout.
  await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
}

export async function syncDeviceTokenAsync(options: SyncOptions = {}) {
  const authToken = await apiClient.getToken();
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

  await apiClient.deleteDeviceToken({ fcmToken });
  await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

export function addPushTokenRefreshListener(): RemovableSubscription {
  if (Platform.OS === 'web') {
    return noopSubscription;
  }

  try {
    return Notifications.addPushTokenListener((token) => {
      const fcmToken = getNativeTokenString(token);
      if (!fcmToken) {
        return;
      }

      void apiClient.getToken().then((authToken) => {
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
  });
}

function getWardIdFromNotification(response: Notifications.NotificationResponse) {
  const wardId = response.notification.request.content.data?.wardId;
  return typeof wardId === 'string' && wardId.trim().length > 0 ? wardId.trim() : null;
}

export function handleNotificationResponse(response: Notifications.NotificationResponse | null) {
  if (!response) {
    return;
  }

  const wardId = getWardIdFromNotification(response);
  if (!wardId) {
    return;
  }

  router.push({
    pathname: '/cameras',
    params: { wardId },
  });
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
  if (Platform.OS === 'web') {
    return noopSubscription;
  }

  handleNotificationResponse(getLastNotificationResponseSafely());

  try {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });
  } catch (error) {
    console.warn('Notification tap listener is unavailable in this runtime.', error);
    return noopSubscription;
  }
}
