import { apiCore } from './core';
import { asArray, asNumber, asString, field } from './normalizers';
import * as ExpoLocation from 'expo-location';
import type { District, Ward } from '@/types/api';

type SyncLocationOptions = {
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
  matchType: 'contains' | 'nearest';
  distanceMeters: number;
};

type RawDistrict = string | (Partial<District> & { districtId?: string; districtName?: string });
type RawWard = Partial<Ward> & { wardId?: string; wardName?: string };

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

export interface AddressSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

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


export async function getWards() {
  const response = await apiCore.request({ method: 'GET', url: '/Location/wards', authPolicy: 'public' });
  return { ...response, data: normalizeWards(response.data) };
}

export async function getWardById(id: string) {
  return apiCore.request<any>({ method: 'GET', url: `/Location/wards/${id}`, authPolicy: 'public' });
}

export async function getDistricts() {
  const response = await apiCore.request({ method: 'GET', url: '/Location/districts', authPolicy: 'public' });
  return { ...response, data: normalizeDistricts(response.data) };
}

export async function getWardsByDistrict(districtName: string) {
  const response = await apiCore.request({
    method: 'GET',
    url: `/Location/wards/by-district/${encodeURIComponent(districtName)}`,
    authPolicy: 'public',
  });
  return { ...response, data: normalizeWards(response.data) };
}

export async function resolveWardByCoordinates(latitude: number, longitude: number) {
  const response = await apiCore.request<ResolvedWard>({
    method: 'GET',
    url: '/Location/resolve-ward',
    params: { latitude, longitude },
    authPolicy: 'public',
  });
  return response.data;
}

export async function updateMyLocation(data: SyncedLocation) {
  return apiCore.request({
    method: 'POST',
    url: '/Auth/location',
    data,
    authPolicy: 'required',
  });
}

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

  const authToken = await apiCore.getToken();
  if (authToken) {
    await updateMyLocation(location);
  }

  return location;
}

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

export async function getOSRMRoutes(startLng: number, startLat: number, endLng: number, endLat: number): Promise<any> {
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
