/**
 * weather-display.ts — Tiện ích chuyển đổi dữ liệu thời tiết sang text hiển thị.
 *
 * Tất cả giá trị enum từ API (level string) được dịch sang tiếng Việt
 * để hiển thị trực tiếp trên UI mà không cần xử lý thêm ở component.
 */

/**
 * Chuyển đổi mức độ mưa sang tiếng Việt.
 * none → Không mưa | light → Mưa nhẹ | medium → Mưa vừa | heavy → Mưa lớn
 */
export function formatRainLevel(level?: string): string {
  const labels: Record<string, string> = {
    none: 'Không mưa',
    light: 'Mưa nhẹ',
    medium: 'Mưa vừa',
    heavy: 'Mưa lớn',
  };

  return labels[level || ''] || 'Chưa xác định';
}

/**
 * Chuyển đổi mức độ giao thông sang tiếng Việt.
 * clear → Thông thoáng | slow → Di chuyển chậm | jam → Ùn tắc | unknown → Chưa xác định
 */
export function formatTrafficLevel(level?: string): string {
  const labels: Record<string, string> = {
    clear: 'Thông thoáng',
    slow: 'Di chuyển chậm',
    jam: 'Ùn tắc',
    unknown: 'Chưa xác định',
  };

  return labels[level || ''] || 'Chưa xác định';
}

interface WeatherAiReasonInput {
  aiReason?: string;
  isRaining?: boolean;
  rainLevel?: string;
  trafficLevel?: string;
}

/**
 * Tạo mô tả thời tiết có thể đọc được từ dữ liệu AI.
 *
 * Ưu tiên:
 *  1. Dùng aiReason từ AI nếu không phải demo/placeholder text
 *  2. Tổng hợp từ isRaining + rainLevel + trafficLevel nếu AI reason không hữu ích
 */
export function formatWeatherAiReason(log: WeatherAiReasonInput): string {
  const reason = log.aiReason?.trim();
  const trafficText = formatTrafficLevel(log.trafficLevel).toLowerCase();

  // Bỏ qua demo text do AI tạo ra trong môi trường test
  if (reason && !reason.toLowerCase().startsWith('demo static weather:')) {
    return reason;
  }

  if (log.isRaining) {
    return `Phát hiện ${formatRainLevel(log.rainLevel).toLowerCase()}. Giao thông: ${trafficText}.`;
  }

  return `Không phát hiện mưa. Giao thông: ${trafficText}.`;
}
