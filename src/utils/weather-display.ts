export function formatRainLevel(level?: string): string {
  const labels: Record<string, string> = {
    none: 'Không mưa',
    light: 'Mưa nhẹ',
    medium: 'Mưa vừa',
    heavy: 'Mưa lớn',
  };

  return labels[level || ''] || 'Chưa xác định';
}

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

export function formatWeatherAiReason(log: WeatherAiReasonInput): string {
  const reason = log.aiReason?.trim();
  const trafficText = formatTrafficLevel(log.trafficLevel).toLowerCase();

  if (reason && !reason.toLowerCase().startsWith('demo static weather:')) {
    return reason;
  }

  if (log.isRaining) {
    return `Phát hiện ${formatRainLevel(log.rainLevel).toLowerCase()}. Giao thông: ${trafficText}.`;
  }

  return `Không phát hiện mưa. Giao thông: ${trafficText}.`;
}
