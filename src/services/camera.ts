import { apiCore, withData } from './core';
import { normalizeCameraList } from './normalizers';

export async function getCameras(search?: string, sortBy?: string, page = 1, pageSize = 10) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Camera',
    params: { search, sortBy, page, pageSize },
    authPolicy: 'public',
  });
  return withData(response, normalizeCameraList(response.data));
}

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

export async function deleteCamera(id: string) {
  return apiCore.request({ method: 'DELETE', url: `/Camera/${id}`, authPolicy: 'admin' });
}


export async function runAiTest(id: string, saveWeatherLog = false) {
  return apiCore.request({ method: 'POST', url: `/Camera/${id}/run-ai-test`, data: { saveWeatherLog }, authPolicy: 'admin' });
}
