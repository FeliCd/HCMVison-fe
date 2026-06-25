export function getApiErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi không xác định.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const response = (error as { response?: { data?: unknown } }).response;
  const data = response?.data;
  if (typeof data === 'string' && data.trim()) return data;

  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  return fallback;
}
