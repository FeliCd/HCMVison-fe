import { AdminRole, AdminUsersQuery } from '@/types/api';
import { apiCore, withData } from './core';
import {
  normalizeAdminStats,
  normalizeAdminUsers,
  normalizeAdminUser,
  normalizeAdminAuditLogs,
  normalizeFailedCameras,
  normalizeCameraHealth,
  normalizeIngestionJobs,
  normalizeIngestionStats,
} from './normalizers';

export async function getAdminStats() {
  const response = await apiCore.request({ method: 'GET', url: '/Admin/stats', authPolicy: 'admin' });
  return withData(response, normalizeAdminStats(response.data));
}

export async function getAuditData() {
  return apiCore.request<any[]>({ method: 'GET', url: '/Admin/audit-data', authPolicy: 'admin' });
}

export async function getUsers({
  search,
  sortBy = 'newest',
  role,
  isActive,
  page = 1,
  pageSize = 20,
}: AdminUsersQuery = {}) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/users',
    params: { search, sortBy, role, isActive, page, pageSize },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminUsers(response.data));
}

export async function updateUserStatus(id: number, isActive: boolean) {
  const response = await apiCore.request({
    method: 'PATCH',
    url: `/Admin/users/${id}/status`,
    data: { isActive },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminUser(response.data));
}

export async function updateUserRole(id: number, role: AdminRole) {
  const response = await apiCore.request({
    method: 'PATCH',
    url: `/Admin/users/${id}/role`,
    data: { role },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminUser(response.data));
}

export async function getAdminAuditLogs(limit = 10) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/audit-logs',
    params: { limit },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminAuditLogs(response.data));
}

export async function getRainFrequencyStats() {
  return apiCore.request({ method: 'GET', url: '/Admin/stats/rain-frequency', authPolicy: 'admin' });
}

export async function getFailedCameras() {
  const response = await apiCore.request({ method: 'GET', url: '/Admin/stats/failed-cameras', authPolicy: 'admin' });
  return withData(response, normalizeFailedCameras(response.data));
}

export async function checkCameraHealth() {
  const response = await apiCore.request({ method: 'GET', url: '/Admin/stats/check-camera-health', authPolicy: 'admin' });
  return withData(response, normalizeCameraHealth(response.data));
}

export async function getIngestionJobs(page = 1, pageSize = 20, status?: string) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/ingestion-jobs',
    params: { page, pageSize, status },
    authPolicy: 'admin',
  });
  return withData(response, normalizeIngestionJobs(response.data));
}

export async function getIngestionJobDetail(jobId: string) {
  return apiCore.request({ method: 'GET', url: `/Admin/ingestion-jobs/${jobId}`, authPolicy: 'admin' });
}

export async function getIngestionStats(days = 7) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/ingestion-stats',
    params: { days },
    authPolicy: 'admin',
  });
  return withData(response, normalizeIngestionStats(response.data));
}
