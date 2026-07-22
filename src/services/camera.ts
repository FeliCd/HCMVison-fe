/**
 * camera.ts — Các hàm gọi API liên quan đến camera giao thông.
 *
 * Có 2 loại endpoint camera:
 *  1. /Camera          – CRUD camera (chỉ admin mới dùng được)
 *  2. /Camera/status   – Lấy trạng thái realtime kèm thời tiết / giao thông (public/optional)
 *
 * Kết quả đều được normalize qua `normalizers.ts` trước khi trả về,
 * đảm bảo type-safe và nhất quán dù API backend có thay đổi format.
 */
import { apiCore, withData } from './core';
import { normalizeCameraList, normalizeCameraStatusResponse } from './normalizers';
import { CameraStatusQuery } from '@/types/api';

/**
 * Lấy danh sách camera (có phân trang, tìm kiếm).
 * Dùng cho trang admin quản lý camera.
 */
export async function getCameras(
  search?: string,
  sortBy?: string,
  page = 1,
  pageSize = 10
) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Camera',
    params: { search, sortBy, page, pageSize },
    authPolicy: 'public',
  });
  // Normalize để đảm bảo các trường id, name, lat/lng, status luôn có giá trị hợp lệ
  return withData(response, normalizeCameraList(response.data));
}

/**
 * Lấy trạng thái realtime của các camera kèm dữ liệu thời tiết và giao thông.
 * Đây là endpoint chính dùng ở màn hình Explore và bản đồ.
 *
 * Các filter được hỗ trợ:
 *  - wardId / districtName : lọc theo khu vực địa lý
 *  - rain                  : 'all' | 'raining' | 'not_raining'
 *  - traffic               : 'all' | 'jammed' | 'not_jammed'
 *  - favoriteOnly          : chỉ lấy camera đã yêu thích (cần auth)
 *
 * authPolicy tự động tăng lên 'required' khi favoriteOnly=true
 * vì cần token để server biết danh sách yêu thích của user.
 */
export async function getCameraStatus(query: CameraStatusQuery = {}) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Camera/status',
    params: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      wardId: query.wardId,
      districtName: query.districtName,
      rain: query.rain ?? 'all',
      traffic: query.traffic ?? 'all',
      favoriteOnly: query.favoriteOnly ?? false,
    },
    // Cần token nếu lọc yêu thích, còn lại chỉ cần 'optional' để cá nhân hoá
    authPolicy: query.favoriteOnly ? 'required' : 'optional',
  });
  return withData(response, normalizeCameraStatusResponse(response.data));
}

/** Tạo camera mới (chỉ admin) */
export async function createCamera(data: {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  streamUrl: string;
  streamType?: string;
}) {
  return apiCore.request({ method: 'POST', url: '/Camera', data, authPolicy: 'admin' });
}

/** Cập nhật thông tin camera (chỉ admin) */
export async function updateCamera(
  id: string,
  data: {
    name: string;
    latitude: number;
    longitude: number;
    wardId?: string;
    status?: string;
    streamUrl?: string;
  }
) {
  return apiCore.request({ method: 'PUT', url: `/Camera/${id}`, data, authPolicy: 'admin' });
}

/** Xoá camera khỏi hệ thống (chỉ admin) */
export async function deleteCamera(id: string) {
  return apiCore.request({ method: 'DELETE', url: `/Camera/${id}`, authPolicy: 'admin' });
}

/**
 * Kích hoạt AI phân tích thời tiết / giao thông cho camera cụ thể (chỉ admin).
 * Dùng trong trang admin > test AI.
 */
export async function runAiTest(id: string, saveWeatherLog = false) {
  return apiCore.request({
    method: 'POST',
    url: `/Camera/${id}/run-ai-test`,
    data: { saveWeatherLog },
    authPolicy: 'admin',
  });
}
