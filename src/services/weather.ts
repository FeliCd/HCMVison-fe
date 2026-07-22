/**
 * weather.ts — Các hàm gọi API liên quan đến thời tiết và điều kiện đường phố.
 *
 * Endpoints chính:
 *  - /Weather/latest          → Dữ liệu thời tiết mới nhất từ toàn bộ camera
 *  - /Weather/logs            → Lịch sử log thời tiết có ảnh AI
 *  - /Weather/raining-cameras → Danh sách camera đang phát hiện mưa
 *  - /Weather/heatmap         → Dữ liệu điểm nóng mưa cho bản đồ nhiệt
 *  - /Weather/check-route     → Kiểm tra tuyến đường có mưa / kẹt xe không
 *  - /Weather/report          → User báo cáo thủ công tình trạng mưa
 *  - /Weather/test-ai         → Admin test AI với ảnh tùy chọn
 *
 * Kết quả trả về đều qua normalize để đảm bảo type-safe.
 */
import { apiCore, withData } from './core';
import { normalizeWeatherLog, normalizeWeatherLogs, normalizeRainingCameras } from './normalizers';

/**
 * Lấy dữ liệu thời tiết mới nhất từ tất cả camera.
 * Response là mảng WeatherLog — mỗi item là snapshot mới nhất của 1 camera.
 */
export async function getLatestWeather() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Weather/latest',
    authPolicy: 'public',
  });
  // API trả về { data: [...] }, cần map từng item qua normalizeWeatherLog
  const data = response.data as Record<string, unknown>;
  const items = Array.isArray(data.data) ? data.data : [];
  return withData(response, items.map(normalizeWeatherLog));
}

/**
 * Lấy lịch sử log thời tiết trong khoảng thời gian nhất định.
 *
 * @param minutes       Số phút nhìn về quá khứ (mặc định 180 phút = 3 giờ)
 * @param limit         Số lượng log tối đa trả về
 * @param onlyWithImages Chỉ lấy log có ảnh AI (dùng trong trang rain-list)
 */
export async function getWeatherLogs(minutes = 180, limit = 100, onlyWithImages = false) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Weather/logs',
    params: { minutes, limit, onlyWithImages },
    authPolicy: 'public',
  });
  return withData(response, normalizeWeatherLogs(response.data));
}

/** Đếm số camera đang phát hiện mưa trong N phút gần nhất */
export async function getRainingCamerasCount(minutes = 30) {
  return apiCore.request({
    method: 'GET',
    url: '/Weather/raining-cameras/count',
    params: { minutes },
    authPolicy: 'public',
  });
}

/**
 * Lấy danh sách camera đang phát hiện mưa.
 * Dùng để hiển thị list và bản đồ cảnh báo mưa.
 */
export async function getRainingCameras(minutes = 30) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Weather/raining-cameras',
    params: { minutes },
    authPolicy: 'public',
  });
  return withData(response, normalizeRainingCameras(response.data));
}

/**
 * Admin test AI phân tích thời tiết với ảnh tùy chọn.
 * Upload ảnh dạng multipart/form-data.
 */
export async function testWeatherAI(imageFile: FormData, saveLog = false) {
  return apiCore.request({
    method: 'POST',
    url: '/Weather/test-ai',
    data: imageFile,
    params: { SaveLog: saveLog },
    headers: { 'Content-Type': 'multipart/form-data' },
    authPolicy: 'admin',
  });
}

/**
 * User báo cáo thủ công tình trạng thời tiết tại vị trí / camera cụ thể.
 * Dữ liệu này được dùng để audit AI và cải thiện mô hình.
 */
export async function reportWeather(data: {
  cameraId?: string;
  isRaining: boolean;
  note?: string;
}) {
  return apiCore.request({
    method: 'POST',
    url: '/Weather/report',
    data,
    authPolicy: 'required',
  });
}

/**
 * Kiểm tra tuyến đường có bị ảnh hưởng bởi mưa / kẹt xe không.
 * Có thể truyền vào theo 2 cách:
 *  1. origin + destination coords (server tự tính route)
 *  2. mảng routePoints (client đã có route từ OSRM)
 *
 * authPolicy 'optional' vì không bắt buộc đăng nhập nhưng có token thì tốt hơn.
 */
export async function checkRoute(data: {
  currentLatitude?: number;
  currentLongitude?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  routePoints?: { lat: number; lng: number }[];
}) {
  return apiCore.request<any>({
    method: 'POST',
    url: '/Weather/check-route',
    data,
    authPolicy: 'optional',
  });
}

/** Lấy dữ liệu heatmap mưa để vẽ bản đồ nhiệt */
export async function getWeatherHeatmap() {
  return apiCore.request<any>({
    method: 'GET',
    url: '/Weather/heatmap',
    authPolicy: 'public',
  });
}
