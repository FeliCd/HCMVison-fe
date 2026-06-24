import { apiCore } from './core';

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
