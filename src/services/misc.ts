/**
 * misc.ts — Các hàm gọi API cho Favorites, Subscriptions và Chatbot.
 *
 * Nhóm chức năng:
 *  - Favorites      : Camera yêu thích của user
 *  - Subscriptions  : Đăng ký nhận cảnh báo mưa theo khu vực (phường/xã)
 *  - Chatbot        : Giao tiếp với AI assistant về tình trạng thời tiết/giao thông
 */
import { ChatbotResponse } from '@/types/api';
import { apiCore, withData } from './core';
import { normalizeFavorites, normalizeSubscriptions, field, asString } from './normalizers';

// ─── FAVORITES ────────────────────────────────────────────────────────────────

/** Lấy danh sách camera yêu thích của user đang đăng nhập */
export async function getFavorites() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Favorite',
    authPolicy: 'required',
  });
  return withData(response, normalizeFavorites(response.data));
}

/** Thêm camera vào danh sách yêu thích */
export async function addFavorite(cameraId: string) {
  return apiCore.request({
    method: 'POST',
    url: `/Favorite/${cameraId}`,
    authPolicy: 'required',
  });
}

/** Xoá camera khỏi danh sách yêu thích */
export async function removeFavorite(cameraId: string) {
  return apiCore.request({
    method: 'DELETE',
    url: `/Favorite/${cameraId}`,
    authPolicy: 'required',
  });
}

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

/** Lấy danh sách đăng ký cảnh báo mưa của user */
export async function getSubscriptions() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/subscriptions',
    authPolicy: 'required',
  });
  return withData(response, normalizeSubscriptions(response.data));
}

/**
 * Tạo đăng ký cảnh báo mưa mới cho một phường/xã.
 * thresholdProbability: ngưỡng xác suất mưa để gửi thông báo (0.0 → 1.0)
 */
export async function createSubscription(data: {
  wardId: string;
  thresholdProbability?: number;
}) {
  return apiCore.request({
    method: 'POST',
    url: '/subscriptions',
    data,
    authPolicy: 'required',
  });
}

/**
 * Cập nhật đăng ký cảnh báo:
 *  - thresholdProbability : điều chỉnh ngưỡng cảnh báo
 *  - isEnabled            : bật/tắt cảnh báo tạm thời
 */
export async function updateSubscription(
  id: string,
  data: { thresholdProbability?: number; isEnabled?: boolean }
) {
  return apiCore.request({
    method: 'PUT',
    url: `/subscriptions/${id}`,
    data,
    authPolicy: 'required',
  });
}

/** Xoá đăng ký cảnh báo */
export async function deleteSubscription(id: string) {
  return apiCore.request({
    method: 'DELETE',
    url: `/subscriptions/${id}`,
    authPolicy: 'required',
  });
}

// ─── CHATBOT ──────────────────────────────────────────────────────────────────

/** Kiểm tra trạng thái Chatbot AI (dùng cho debug) */
export async function debugChatbot() {
  return apiCore.request({
    method: 'GET',
    url: '/Chatbot/debug',
    authPolicy: 'public',
  });
}

/**
 * Gửi tin nhắn đến AI chatbot và nhận phản hồi.
 * Response được normalize để đảm bảo field `reply` luôn tồn tại,
 * kể cả khi backend trả về `message` thay vì `reply`.
 */
export async function sendChatbotMessage(message: string) {
  const response = await apiCore.request({
    method: 'POST',
    url: '/Chatbot/message',
    data: { message },
    authPolicy: 'public',
  });
  // Normalize: ưu tiên field 'reply', fallback về 'message', rồi mới dùng default
  const reply = asString(
    field(response.data, 'reply') ?? field(response.data, 'message'),
    'Xin lỗi, tôi chưa có phản hồi phù hợp.'
  );
  return withData<ChatbotResponse>(response, { reply, message: reply });
}
