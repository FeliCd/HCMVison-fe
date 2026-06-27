import { apiCore } from './core';

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
  return apiCore.request<any[]>({ method: 'GET', url: '/Location/wards', authPolicy: 'public' });
}

export async function getWardById(id: string) {
  return apiCore.request<any>({ method: 'GET', url: `/Location/wards/${id}`, authPolicy: 'public' });
}

export async function getDistricts() {
  return apiCore.request<any[]>({ method: 'GET', url: '/Location/districts', authPolicy: 'public' });
}

export async function getWardsByDistrict(districtName: string) {
  return apiCore.request<any[]>({ method: 'GET', url: `/Location/wards/by-district/${districtName}`, authPolicy: 'public' });
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
