import { apiCore, withData } from './core';
import { normalizeWeatherLog, normalizeWeatherLogs, normalizeRainingCameras } from './normalizers';

export async function getLatestWeather() {
  const response = await apiCore.request({ method: 'GET', url: '/Weather/latest', authPolicy: 'public' });
  const data = response.data as Record<string, unknown>;
  const items = Array.isArray(data.data) ? data.data : [];
  return withData(response, items.map(normalizeWeatherLog));
}

export async function getWeatherLogs(minutes = 180, limit = 100, onlyWithImages = false) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Weather/logs',
    params: { minutes, limit, onlyWithImages },
    authPolicy: 'public',
  });
  return withData(response, normalizeWeatherLogs(response.data));
}

export async function getRainingCamerasCount(minutes = 30) {
  return apiCore.request({ method: 'GET', url: '/Weather/raining-cameras/count', params: { minutes }, authPolicy: 'public' });
}

export async function getRainingCameras(minutes = 30) {
  const response = await apiCore.request({ method: 'GET', url: '/Weather/raining-cameras', params: { minutes }, authPolicy: 'public' });
  return withData(response, normalizeRainingCameras(response.data));
}

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

export async function reportWeather(data: { cameraId?: string; isRaining: boolean; note?: string }) {
  return apiCore.request({ method: 'POST', url: '/Weather/report', data, authPolicy: 'required' });
}

export async function checkRoute(data: {
  currentLatitude?: number;
  currentLongitude?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  routePoints?: { lat: number; lng: number }[];
}) {
  return apiCore.request<any>({ method: 'POST', url: '/Weather/check-route', data, authPolicy: 'optional' });
}

export async function getWeatherHeatmap() {
  return apiCore.request<any>({ method: 'GET', url: '/Weather/heatmap', authPolicy: 'public' });
}
