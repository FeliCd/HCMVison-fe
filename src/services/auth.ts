/**
 * auth.ts — Các hàm gọi API liên quan đến xác thực người dùng.
 *
 * Tất cả đều dùng `apiCore.request()` từ core.ts — không tạo thêm axios instance.
 *
 * Auth policy được áp dụng:
 *  - Đăng ký / đăng nhập / quên mật khẩu / reset mật khẩu → 'public' (không cần token)
 *  - Lấy profile / cập nhật / đổi mật khẩu / device token  → 'required' (phải có token)
 */
import { apiCore } from './core';

/** Đăng ký tài khoản mới */
export async function register(username: string, email: string, password: string) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/register',
    data: { username, email, password },
    authPolicy: 'public',
  });
}

/** Đăng nhập, trả về JWT token */
export async function login(username: string, password: string) {
  return apiCore.request<any>({
    method: 'POST',
    url: '/Auth/login',
    data: { username, password },
    authPolicy: 'public',
  });
}

/** Gửi email reset mật khẩu (không cần đăng nhập) */
export async function forgotPassword(email: string) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/forgot-password',
    data: { email },
    authPolicy: 'public',
  });
}

/** Đặt lại mật khẩu bằng token từ email (không cần đăng nhập) */
export async function resetPassword(token: string, newPassword: string) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/reset-password',
    data: { token, newPassword },
    authPolicy: 'public',
  });
}

/** Lấy thông tin profile của user đang đăng nhập */
export async function getProfile() {
  return apiCore.request<any>({
    method: 'GET',
    url: '/Auth/me',
    authPolicy: 'required',
  });
}

/** Cập nhật thông tin profile (họ tên, số điện thoại, avatar) */
export async function updateProfile(data: {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}) {
  return apiCore.request({
    method: 'PUT',
    url: '/Auth/me',
    data,
    authPolicy: 'required',
  });
}

/** Đổi mật khẩu — phải cung cấp mật khẩu cũ để xác nhận */
export async function changePassword(oldPassword: string, newPassword: string) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/change-password',
    data: { oldPassword, newPassword },
    authPolicy: 'required',
  });
}

/**
 * Đăng ký FCM token với server để nhận push notification.
 * Gọi sau khi đăng nhập thành công hoặc khi token được refresh.
 */
export async function saveDeviceToken(data: {
  fcmToken: string;
  deviceId: string;
  platform?: string;
  appVersion?: string;
}) {
  return apiCore.request({
    method: 'POST',
    url: '/device-tokens',
    data,
    authPolicy: 'required',
  });
}

/**
 * Xoá FCM token khỏi server khi đăng xuất.
 * Ngăn server gửi notification cho thiết bị này sau khi logout.
 */
export async function deleteDeviceToken(data: { fcmToken: string }) {
  return apiCore.request({
    method: 'DELETE',
    url: '/device-tokens',
    data,
    authPolicy: 'required',
  });
}
