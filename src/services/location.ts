/**
 * location.ts — Các hàm liên quan đến địa lý và vị trí người dùng.
 *
 * Nhóm chức năng:
 *  1. API server  : Lấy danh sách quận/phường, tìm phường theo tọa độ
 *  2. GPS         : Lấy vị trí thiết bị, đồng bộ lên server
 *  3. Nominatim   : Geocoding địa chỉ văn bản → tọa độ (bên ngoài VN OpenStreetMap)
 *  4. OSRM        : Tính tuyến đường lái xe (bên ngoài project-osrm.org)
 */
import { apiCore } from './core';
import { asArray, asNumber, asString, field } from './normalizers';
import * as ExpoLocation from 'expo-location';
import type { District, Ward } from '@/types/api';

type SyncLocationOptions = {
  /** Nếu true, sẽ hiển thị popup xin quyền GPS nếu chưa được cấp */
  requestPermission?: boolean;
};

type SyncedLocation = {
  latitude: number;
  longitude: number;
};

export type ResolvedWard = {
  wardId: string;
  wardName: string;
  districtName?: string;
  /** 'contains' = tọa độ nằm trong polygon phường; 'nearest' = phường gần nhất */
  matchType: 'contains' | 'nearest';
  distanceMeters: number;
};

// ─── Các kiểu thô từ API (trước khi normalize) ───────────────────────────────
type RawDistrict = string | (Partial<District> & { districtId?: string; districtName?: string });
type RawWard = Partial<Ward> & { wardId?: string; wardName?: string };

// ─── Internal normalizers (chỉ dùng trong file này) ──────────────────────────

/** Normalize một quận từ định dạng API (có thể là string hoặc object) */
function normalizeDistrict(raw: RawDistrict): District | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { id: name, name, latitude: 0, longitude: 0 } : null;
  }

  const name = asString(field(raw, 'name', 'districtName')).trim();
  const id = asString(field(raw, 'id', 'districtId'), name).trim();

  return id && name
    ? {
        id,
        name,
        latitude: asNumber(field(raw, 'latitude')),
        longitude: asNumber(field(raw, 'longitude')),
      }
    : null;
}

/** Normalize một phường từ định dạng API */
function normalizeWard(raw: RawWard): Ward | null {
  const id = asString(field(raw, 'id', 'wardId')).trim();
  const name = asString(field(raw, 'name', 'wardName')).trim();
  const districtName = asString(field(raw, 'districtName')).trim();

  return id && name
    ? {
        id,
        name,
        districtId: asString(field(raw, 'districtId'), districtName).trim(),
        districtName,
        latitude: asNumber(field(raw, 'latitude')),
        longitude: asNumber(field(raw, 'longitude')),
      }
    : null;
}

function normalizeDistricts(payload: unknown): District[] {
  return asArray<RawDistrict>(payload)
    .map(normalizeDistrict)
    .filter((district): district is District => Boolean(district));
}

function normalizeWards(payload: unknown): Ward[] {
  return asArray<RawWard>(payload)
    .map(normalizeWard)
    .filter((ward): ward is Ward => Boolean(ward));
}

// ─── Address Search (Nominatim) ───────────────────────────────────────────────

export interface AddressSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

/**
 * Tìm kiếm địa chỉ trong TP.HCM bằng Nominatim (OpenStreetMap).
 * Giới hạn bounding box trong phạm vi TP.HCM để kết quả chính xác hơn.
 * Trả về tối đa 5 gợi ý.
 */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${query}, Hồ Chí Minh`
      )}&format=json&limit=5&viewbox=106.35,10.35,107.05,11.15&bounded=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HCMVision/1.0',
        },
      }
    );
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
      const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
      const shortName = parts.slice(0, 3).join(', ');
      return {
        displayName: item.display_name || query,
        shortName,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch (e) {
    console.error('Address search error:', e);
    return [];
  }
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

/** Lấy toàn bộ danh sách phường/xã trong hệ thống */
export async function getWards() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Location/wards',
    authPolicy: 'public',
  });
  return { ...response, data: normalizeWards(response.data) };
}

/** Lấy thông tin một phường cụ thể theo ID */
export async function getWardById(id: string) {
  return apiCore.request<any>({ method: 'GET', url: `/Location/wards/${id}`, authPolicy: 'public' });
}

/** Lấy danh sách tất cả quận trong hệ thống */
export async function getDistricts() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Location/districts',
    authPolicy: 'public',
  });
  return { ...response, data: normalizeDistricts(response.data) };
}

/** Lấy danh sách phường thuộc một quận cụ thể */
export async function getWardsByDistrict(districtName: string) {
  const response = await apiCore.request({
    method: 'GET',
    url: `/Location/wards/by-district/${encodeURIComponent(districtName)}`,
    authPolicy: 'public',
  });
  return { ...response, data: normalizeWards(response.data) };
}

/**
 * Tìm phường gần nhất / chứa tọa độ GPS đã cho.
 * Dùng để hiển thị tên khu vực khi user đang ở đó.
 */
export async function resolveWardByCoordinates(latitude: number, longitude: number) {
  const response = await apiCore.request<ResolvedWard>({
    method: 'GET',
    url: '/Location/resolve-ward',
    params: { latitude, longitude },
    authPolicy: 'public',
  });
  return response.data;
}

/** Cập nhật vị trí hiện tại của user lên server (dùng cho tính năng cảnh báo mưa gần vị trí) */
export async function updateMyLocation(data: SyncedLocation) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/location',
    data,
    authPolicy: 'required',
  });
}

/**
 * Đồng bộ vị trí GPS hiện tại của user lên server.
 *
 * Luồng:
 *  1. Kiểm tra quyền GPS hiện tại
 *  2. Nếu chưa có và requestPermission=true → hiện popup xin quyền
 *  3. Không có quyền → trả về null
 *  4. Lấy vị trí hiện tại (fallback về vị trí cuối cùng nếu GPS chậm)
 *  5. Nếu user đã đăng nhập (có token) → gọi API cập nhật vị trí lên server
 *  6. Trả về tọa độ { latitude, longitude }
 */
export async function syncCurrentUserLocationAsync(options: SyncLocationOptions = {}) {
  const currentPermission = await ExpoLocation.getForegroundPermissionsAsync();
  let permissionGranted = currentPermission.status === 'granted';

  if (!permissionGranted && options.requestPermission) {
    const requestedPermission = await ExpoLocation.requestForegroundPermissionsAsync();
    permissionGranted = requestedPermission.status === 'granted';
  }

  if (!permissionGranted) {
    return null;
  }

  const currentLocation =
    await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced })
      .catch(() => ExpoLocation.getLastKnownPositionAsync({}));

  if (!currentLocation) {
    return null;
  }

  const location = {
    latitude: currentLocation.coords.latitude,
    longitude: currentLocation.coords.longitude,
  };

  // Chỉ đồng bộ lên server nếu user đang đăng nhập
  const authToken = await apiCore.getToken();
  if (authToken) {
    await updateMyLocation(location);
  }

  return location;
}

/**
 * Geocode địa chỉ văn bản → tọa độ lat/lng bằng Nominatim.
 * Dùng trong tính năng tìm kiếm điểm xuất phát / đích trên bản đồ.
 * Giới hạn tìm kiếm trong TP.HCM, Vietnam.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${address}, Ho Chi Minh City, Vietnam`
      )}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'HCMVision/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (e) {
    console.error('Geocoding error:', e);
    return null;
  }
}

/**
 * Tính tuyến đường lái xe giữa 2 điểm bằng OSRM (Open Source Routing Machine).
 * Lưu ý: tham số theo thứ tự lng, lat (không phải lat, lng).
 * Trả về GeoJSON geometry để vẽ polyline trên bản đồ, kèm các tuyến thay thế.
 */
export async function getOSRMRoutes(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): Promise<any> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&alternatives=true`
    );
    return await response.json();
  } catch (e) {
    console.error('OSRM error:', e);
    return null;
  }
}
