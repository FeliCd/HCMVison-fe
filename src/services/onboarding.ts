import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETE_STORAGE_KEY = 'hcmvision.onboardingComplete';

export async function isOnboardingCompleteAsync() {
  return (await AsyncStorage.getItem(ONBOARDING_COMPLETE_STORAGE_KEY)) === 'true';
}

export async function markOnboardingCompleteAsync() {
  await AsyncStorage.setItem(ONBOARDING_COMPLETE_STORAGE_KEY, 'true');
}

export async function resetOnboardingCompleteAsync() {
  await AsyncStorage.removeItem(ONBOARDING_COMPLETE_STORAGE_KEY);
}
