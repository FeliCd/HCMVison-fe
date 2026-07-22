/**
 * api-error.ts — Tiện ích trích xuất thông báo lỗi từ Axios error response.
 *
 * Backend có thể trả lỗi theo nhiều format khác nhau:
 *  1. String thuần: response.data = "Username không tồn tại"
 *  2. Object có field message: response.data = { message: "..." }
 *  3. Không có response (network error, timeout): dùng fallback
 *
 * Ưu tiên: string response → object.message → fallback
 */
export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi không xác định.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;

  // Ưu tiên 1: Backend trả về string thuần
  if (typeof data === 'string' && data.trim()) return data;

  // Ưu tiên 2: Backend trả về object { message: "..." }
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
