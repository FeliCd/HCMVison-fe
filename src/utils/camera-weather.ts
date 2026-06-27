import { Camera, WeatherLog } from '@/types/api';

export interface CameraWithWeather extends Camera {
  latestWeather?: WeatherLog;
  imageSources: CameraImageSources;
  isRaining?: boolean;
  rainLevel?: string;
  trafficLevel?: string;
  confidence?: number;
  timeAgo?: string;
}

export interface CameraImageSources {
  weatherImageUrl?: string;
}

export function mapLatestWeatherByCamera(logs: WeatherLog[]) {
  const latestByCamera = new Map<string, WeatherLog>();

  for (const log of logs) {
    if (!log.cameraId) continue;
    const existing = latestByCamera.get(log.cameraId);
    if (!existing) {
      latestByCamera.set(log.cameraId, log);
      continue;
    }

    const currentTime = Date.parse(log.timestampUtc || '');
    const existingTime = Date.parse(existing.timestampUtc || '');
    if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
      latestByCamera.set(log.cameraId, log);
    }
  }

  return latestByCamera;
}

export function getCameraImageSources(
  camera?: Camera | null,
  weather?: WeatherLog | null
): CameraImageSources {
  // Luôn dùng ảnh live từ camera bộ giao thông (refresh mỗi 15s)
  // WeatherLog chỉ cung cấp data phân tích (mưa, kẹt xe...), không dùng ảnh snapshot AI
  const liveImageUrl = camera?.streamUrl
    ? camera.streamUrl.replace(/^http:\/\//i, 'https://')
    : undefined;

  return {
    weatherImageUrl: liveImageUrl,
  };
}

export function mergeCamerasWithWeather(
  cameras: Camera[],
  logs: WeatherLog[]
): CameraWithWeather[] {
  const latestByCamera = mapLatestWeatherByCamera(logs);

  return cameras.map((camera) => {
    const latestWeather = latestByCamera.get(camera.id);
    return {
      ...camera,
      latestWeather,
      imageSources: getCameraImageSources(camera, latestWeather),
      isRaining: latestWeather?.isRaining,
      rainLevel: latestWeather?.rainLevel,
      trafficLevel: latestWeather?.trafficLevel,
      confidence: latestWeather?.confidence,
      timeAgo: latestWeather?.timeAgo,
    };
  });
}
