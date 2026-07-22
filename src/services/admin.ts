/**
 * admin.ts — Các hàm gọi API cho trang quản trị (Admin Dashboard).
 *
 * Tất cả endpoint đều yêu cầu authPolicy: 'admin' —
 * chỉ tài khoản có role Admin mới được phép gọi.
 *
 * Nhóm chức năng:
 *  - Stats & Reports  : Thống kê hệ thống, tần suất mưa, audit AI
 *  - Users            : Quản lý tài khoản người dùng
 *  - Camera Health    : Kiểm tra sức khoẻ camera, danh sách camera lỗi
 *  - Ingestion Jobs   : Theo dõi tiến trình ingestion dữ liệu từ camera
 */
import { AdminRole, AdminUsersQuery } from '@/types/api';
import { apiCore, withData } from './core';
import {
  normalizeAdminStats,
  normalizeAdminUsers,
  normalizeAdminUser,
  normalizeAdminAiAuditReports,
  normalizeAdminAuditLogs,
  normalizeFailedCameras,
  normalizeCameraHealth,
  normalizeIngestionJobs,
  normalizeIngestionStats,
} from './normalizers';

// ─── STATS & REPORTS ──────────────────────────────────────────────────────────

/** Lấy thống kê tổng quan hệ thống: số camera, user, log thời tiết... */
export async function getAdminStats() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/stats',
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminStats(response.data));
}

/**
 * Lấy báo cáo audit AI: các trường hợp AI phân tích sai
 * so với báo cáo thủ công của user.
 */
export async function getAuditData() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/audit-data',
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminAiAuditReports(response.data));
}

/** Lấy thống kê tần suất mưa theo thời gian */
export async function getRainFrequencyStats() {
  return apiCore.request({
    method: 'GET',
    url: '/Admin/stats/rain-frequency',
    authPolicy: 'admin',
  });
}

// ─── USERS ────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tài khoản người dùng (có phân trang, tìm kiếm, lọc).
 * Hỗ trợ tìm theo tên/email, lọc theo role, trạng thái, sắp xếp theo ngày.
 */
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

/** Cập nhật trạng thái hoạt động (khoá/mở khoá) tài khoản người dùng */
export async function updateUserStatus(id: number, isActive: boolean) {
  const response = await apiCore.request({
    method: 'PATCH',
    url: `/Admin/users/${id}/status`,
    data: { isActive },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminUser(response.data));
}

/** Thay đổi role của người dùng (User ↔ Admin) */
export async function updateUserRole(id: number, role: AdminRole) {
  const response = await apiCore.request({
    method: 'PATCH',
    url: `/Admin/users/${id}/role`,
    data: { role },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminUser(response.data));
}

/** Lấy lịch sử thay đổi tài khoản (ai đã thay đổi quyền/trạng thái của ai) */
export async function getAdminAuditLogs(limit = 10) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/audit-logs',
    params: { limit },
    authPolicy: 'admin',
  });
  return withData(response, normalizeAdminAuditLogs(response.data));
}

// ─── CAMERA HEALTH ────────────────────────────────────────────────────────────

/** Lấy danh sách camera đang bị lỗi / không phản hồi */
export async function getFailedCameras() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/stats/failed-cameras',
    authPolicy: 'admin',
  });
  return withData(response, normalizeFailedCameras(response.data));
}

/**
 * Kiểm tra sức khoẻ toàn bộ camera:
 * trả về summary (online/offline/maintenance count) và chi tiết từng camera.
 */
export async function checkCameraHealth() {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/stats/check-camera-health',
    authPolicy: 'admin',
  });
  return withData(response, normalizeCameraHealth(response.data));
}

// ─── INGESTION JOBS ───────────────────────────────────────────────────────────

/**
 * Lấy danh sách ingestion job (các tác vụ thu thập ảnh từ camera).
 * Hỗ trợ lọc theo status: Pending | Processing | Completed | Failed
 */
export async function getIngestionJobs(page = 1, pageSize = 20, status?: string) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/ingestion-jobs',
    params: { page, pageSize, status },
    authPolicy: 'admin',
  });
  return withData(response, normalizeIngestionJobs(response.data));
}

/** Lấy chi tiết một ingestion job cụ thể */
export async function getIngestionJobDetail(jobId: string) {
  return apiCore.request({
    method: 'GET',
    url: `/Admin/ingestion-jobs/${jobId}`,
    authPolicy: 'admin',
  });
}

/**
 * Lấy thống kê ingestion trong N ngày gần nhất:
 * tổng job, thành công/thất bại, latency trung bình, camera có vấn đề.
 */
export async function getIngestionStats(days = 7) {
  const response = await apiCore.request({
    method: 'GET',
    url: '/Admin/ingestion-stats',
    params: { days },
    authPolicy: 'admin',
  });
  return withData(response, normalizeIngestionStats(response.data));
}
