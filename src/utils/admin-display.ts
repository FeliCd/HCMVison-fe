/**
 * admin-display.ts — Tiện ích định dạng dữ liệu admin sang text hiển thị tiếng Việt.
 *
 * Dùng cho trang Admin Dashboard: bảng user, audit log, camera status, ingestion jobs.
 */
import { AdminAccountAuditLog, AdminRole, AdminUserStatus, IngestionJob } from '@/types/api';

/** Chuyển role sang tiếng Việt: Admin → Quản trị viên | User → Người dùng */
export function formatAdminRole(role: AdminRole): string {
  return role === 'Admin' ? 'Quản trị viên' : 'Người dùng';
}

/** Chuyển trạng thái tài khoản sang tiếng Việt: Active → Hoạt động | Inactive → Đã khóa */
export function formatAdminUserStatus(status: AdminUserStatus): string {
  return status === 'Active' ? 'Hoạt động' : 'Đã khóa';
}

/**
 * Chuyển trạng thái camera sang tiếng Việt.
 * Active | Inactive | Offline | Maintenance → tên hiển thị tương ứng
 */
export function formatCameraStatus(status: string): string {
  const labels: Record<string, string> = {
    Active: 'Hoạt động',
    Inactive: 'Tạm dừng',
    Offline: 'Ngoại tuyến',
    Maintenance: 'Bảo trì',
  };

  return labels[status] || 'Không xác định';
}

/**
 * Chuyển trạng thái ingestion job sang tiếng Việt.
 * Pending | Processing/Running | Completed | Failed | Unknown
 */
export function formatIngestionStatus(status: IngestionJob['status']): string {
  const labels: Record<string, string> = {
    Pending: 'Đang chờ',
    Processing: 'Đang xử lý',
    Running: 'Đang xử lý',
    Completed: 'Hoàn tất',
    Failed: 'Thất bại',
    Unknown: 'Không xác định',
  };

  return labels[status] || status;
}

/**
 * Tạo mô tả dễ đọc cho audit log hành động của admin.
 * Hỗ trợ 2 loại hành động:
 *  - RoleChanged    : X đã đổi quyền của Y từ A sang B
 *  - StatusChanged  : X đã khóa/mở khóa tài khoản Y
 */
export function formatAdminAuditLog(log: AdminAccountAuditLog): string {
  if (log.action === 'RoleChanged') {
    return `${log.actorUsername} đã đổi quyền của ${log.targetUsername} từ ${formatAdminRole(
      log.previousValue === 'Admin' ? 'Admin' : 'User'
    )} sang ${formatAdminRole(log.newValue === 'Admin' ? 'Admin' : 'User')}.`;
  }

  if (log.action === 'StatusChanged') {
    const action = log.newValue === 'Active' ? 'mở khóa' : 'khóa';
    return `${log.actorUsername} đã ${action} tài khoản ${log.targetUsername}.`;
  }

  return `${log.actorUsername} đã cập nhật tài khoản ${log.targetUsername}.`;
}
