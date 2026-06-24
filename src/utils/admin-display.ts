import { AdminAccountAuditLog, AdminRole, AdminUserStatus, IngestionJob } from '@/types/api';

export function formatAdminRole(role: AdminRole): string {
  return role === 'Admin' ? 'Quản trị viên' : 'Người dùng';
}

export function formatAdminUserStatus(status: AdminUserStatus): string {
  return status === 'Active' ? 'Hoạt động' : 'Đã khóa';
}

export function formatCameraStatus(status: string): string {
  const labels: Record<string, string> = {
    Active: 'Hoạt động',
    Inactive: 'Tạm dừng',
    Offline: 'Ngoại tuyến',
    Maintenance: 'Bảo trì',
  };

  return labels[status] || 'Không xác định';
}

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
