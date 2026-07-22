/**
 * camera-weather.ts — Tiện ích kết hợp dữ liệu camera với log thời tiết.
 *
 * Vấn đề cần giải quyết:
 *  API camera (/Camera) và API thời tiết (/Weather/logs) là 2 endpoint riêng.
 *  Để hiển thị trạng thái mưa/giao thông trên từng camera,
 *  cần join dữ liệu bằng cameraId.
 *
 * Luồng:
 *  cameras[] + weatherLogs[] → mapLatestWeatherByCamera() → Map<cameraId, WeatherLog>
 *                            → mergeCamerasWithWeather() → CameraWithWeather[]
 */
import { Camera, WeatherLog } from '@/types/api';

/** Camera đã được gắn thêm thông tin thời tiết mới nhất */
export interface CameraWithWeather extends Camera {
  latestWeather?: WeatherLog;
  imageSources: CameraImageSources;
  isRaining?: boolean;
  rainLevel?: string;
  trafficLevel?: string;
  confidence?: number;
  timeAgo?: string;
}

/** URL ảnh dùng để hiển thị trong camera card */
export interface CameraImageSources {
  weatherImageUrl?: string;
}

/**
 * Tạo Map từ danh sách WeatherLog, giữ lại log MỚI NHẤT cho mỗi camera.
 * Sử dụng timestampUtc để so sánh thời gian.
 * Dùng Map để tra cứu O(1) thay vì O(n) mỗi lần join.
 */
export function mapLatestWeatherByCamera(logs: WeatherLog[]) {
  const latestByCamera = new Map<string, WeatherLog>();

  for (const log of logs) {
    if (!log.cameraId) continue;
    const existing = latestByCamera.get(log.cameraId);
    if (!existing) {
      latestByCamera.set(log.cameraId, log);
      continue;
    }

    // So sánh timestamp, giữ lại log mới hơn
    const currentTime = Date.parse(log.timestampUtc || '');
    const existingTime = Date.parse(existing.timestampUtc || '');
    if (!Number.isNaN(currentTime) && (Number.isNaN(existingTime) || currentTime > existingTime)) {
      latestByCamera.set(log.cameraId, log);
    }
  }

  return latestByCamera;
}

/**
 * Lấy URL ảnh để hiển thị trong camera card.
 *
 * Lưu ý thiết kế: Luôn dùng ảnh live từ camera giao thông (refresh mỗi ~15s).
 * Không dùng ảnh snapshot từ WeatherLog vì có thể đã hết hạn hoặc bị xoá.
 * WeatherLog chỉ cung cấp dữ liệu phân tích (mưa, kẹt xe...).
 */
export function getCameraImageSources(
  camera?: Camera | null,
  weather?: WeatherLog | null
): CameraImageSources {
  const liveImageUrl = camera?.streamUrl
    ? camera.streamUrl.replace(/^http:\/\//i, 'https://')
    : undefined;

  return {
    weatherImageUrl: liveImageUrl,
  };
}

/**
 * Join danh sách camera với WeatherLog tương ứng.
 * Trả về CameraWithWeather[] để component có thể hiển thị trạng thái đầy đủ.
 */
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
