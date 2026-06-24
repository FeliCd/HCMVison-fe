import { Camera, WeatherLog } from '@/types/api';

export interface CameraWithWeather extends Camera {
  latestWeather?: WeatherLog;
  displayImageUrl?: string;
  isRaining?: boolean;
  rainLevel?: string;
  trafficLevel?: string;
  confidence?: number;
  timeAgo?: string;
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

export function getCameraDisplayImage(camera?: Camera | null, weather?: WeatherLog | null) {
  if (weather?.imageUrl && !weather.imageIsRedacted && !weather.imageDeletedAtUtc) {
    return weather.imageUrl;
  }

  if (camera?.demoImageUrl) {
    return camera.demoImageUrl;
  }

  return undefined;
}

export function mergeCamerasWithWeather(cameras: Camera[], logs: WeatherLog[]): CameraWithWeather[] {
  const latestByCamera = mapLatestWeatherByCamera(logs);

  return cameras.map((camera) => {
    const latestWeather = latestByCamera.get(camera.id);
    return {
      ...camera,
      latestWeather,
      displayImageUrl: getCameraDisplayImage(camera, latestWeather),
      isRaining: latestWeather?.isRaining,
      rainLevel: latestWeather?.rainLevel,
      trafficLevel: latestWeather?.trafficLevel,
      confidence: latestWeather?.confidence,
      timeAgo: latestWeather?.timeAgo,
    };
  });
}
