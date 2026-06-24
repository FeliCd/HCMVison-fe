import { apiCore } from './core';

export async function register(username: string, email: string, password: string) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/register',
    data: { username, email, password },
    authPolicy: 'public',
  });
}

export async function login(username: string, password: string) {
  return apiCore.request<any>({
    method: 'POST',
    url: '/Auth/login',
    data: { username, password },
    authPolicy: 'public',
  });
}

export async function forgotPassword(email: string) {
  return apiCore.request({ method: 'POST', url: '/Auth/forgot-password', data: { email }, authPolicy: 'public' });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiCore.request({ method: 'POST', url: '/Auth/reset-password', data: { token, newPassword }, authPolicy: 'public' });
}

export async function getProfile() {
  return apiCore.request<any>({ method: 'GET', url: '/Auth/me', authPolicy: 'required' });
}

export async function updateProfile(data: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) {
  return apiCore.request({ method: 'PUT', url: '/Auth/me', data, authPolicy: 'required' });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return apiCore.request({ method: 'POST', url: '/Auth/change-password', data: { oldPassword, newPassword }, authPolicy: 'required' });
}

export async function saveDeviceToken(data: { fcmToken: string; deviceId: string; platform?: string; appVersion?: string }) {
  return apiCore.request({ method: 'POST', url: '/device-tokens', data, authPolicy: 'required' });
}

export async function deleteDeviceToken(data: { fcmToken: string }) {
  return apiCore.request({ method: 'DELETE', url: '/device-tokens', data, authPolicy: 'required' });
}
