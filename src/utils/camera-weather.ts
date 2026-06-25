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

function isExpired(expiresAt?: string) {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  return !Number.isNaN(timestamp) && timestamp <= Date.now();
}

export function getCameraImageSources(
  camera?: Camera | null,
  weather?: WeatherLog | null
): CameraImageSources {
  const weatherImageUrl =
    weather?.imageUrl &&
    !weather.imageDeletedAtUtc &&
    !isExpired(weather.imageExpiresAtUtc)
      ? weather.imageUrl
      : undefined;

  // Nếu không có ảnh thời tiết từ AI, dùng ảnh live từ streamUrl (đổi sang https)
  let finalImageUrl = weatherImageUrl;
  if (!finalImageUrl && camera?.streamUrl) {
    finalImageUrl = camera.streamUrl.replace(/^http:\/\//i, 'https://');
  }

  return {
    weatherImageUrl: finalImageUrl,
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
