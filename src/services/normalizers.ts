/**
 * normalizers.ts — Bộ công cụ chuẩn hoá dữ liệu từ API.
 *
 * TẠI SAO CẦN NORMALIZE?
 * Backend có thể trả về dữ liệu với:
 *  - Tên field không nhất quán (cameraId / camera_id / CameraId)
 *  - Thiếu field (undefined thay vì giá trị mặc định)
 *  - Kiểu dữ liệu sai (số dưới dạng string)
 *  - URL ảnh dạng relative hoặc http thay vì https
 *
 * Mọi service function đều normalize kết quả trước khi trả về,
 * đảm bảo component nhận được data đúng type và luôn có giá trị hợp lệ.
 */
import {
  AdminAccountAuditLog,
  AdminAuditLogResponse,
  AdminAiAuditReport,
  AdminAiAuditReportsResponse,
  AdminStats,
  AdminUser,
  AdminUsersResponse,
  AlertSubscription,
  Camera,
  CameraHealth,
  CameraHealthResponse,
  CameraListResponse,
  CameraStatusItem,
  CameraStatusResponse,
  FailedCamera,
  Favorite,
  FavoriteListResponse,
  IngestionJob,
  IngestionJobsResponse,
  IngestionStatsResponse,
  RainingCamera,
  RainingCamerasResponse,
  WeatherLog,
  WeatherLogsResponse,
} from '@/types/api';
import { API_ORIGIN } from './core';

// ─── PRIMITIVE HELPERS ────────────────────────────────────────────────────────

/**
 * Tìm giá trị của một field trong object, thử cả camelCase và PascalCase.
 * Ví dụ: field(obj, 'cameraId') sẽ tìm 'cameraId', 'CameraId' và ngược lại.
 * Hỗ trợ truyền nhiều key để thử lần lượt (fallback chain).
 */
export function field<T = unknown>(value: unknown, ...keys: string[]): T | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key] as T;
    const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
    if (record[lowerKey] !== undefined && record[lowerKey] !== null) return record[lowerKey] as T;
    const upperKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (record[upperKey] !== undefined && record[upperKey] !== null) return record[upperKey] as T;
  }
  return undefined;
}

/**
 * Trích xuất mảng từ payload với fallback linh hoạt:
 *  - Nếu value đã là array → trả về luôn
 *  - Nếu không → thử tìm array lồng theo từng key được cung cấp
 *  - Không tìm được → trả về []
 */
export function asArray<T = unknown>(value: unknown, ...keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  for (const key of keys) {
    const nested = field<unknown>(value, key);
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
}

/**
 * Chuyển đổi giá trị sang number an toàn.
 * Hỗ trợ: số hợp lệ, string số ('42', '3.14').
 * Trả về fallback (mặc định 0) với: null, undefined, NaN, Infinity, string không phải số.
 */
export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/**
 * Chuyển đổi giá trị sang boolean an toàn.
 * Hỗ trợ: boolean thực, string 'true'/'false' (không phân biệt hoa thường).
 * Trả về fallback (mặc định false) với null/undefined.
 */
export function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
}

/**
 * Chuyển đổi giá trị sang string an toàn.
 * null/undefined trả về fallback (mặc định ''), mọi giá trị khác được String() coerce.
 */
export function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

/**
 * Chuyển đổi URL ảnh về dạng absolute https.
 * Xử lý 3 trường hợp:
 *  1. Đã là absolute URL → giữ nguyên, chỉ upgrade http→https với onrender.com
 *  2. Relative path bắt đầu bằng '/' → thêm API_ORIGIN vào trước
 *  3. Relative path không có '/' → thêm API_ORIGIN/ vào trước
 */
export function toAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    // Upgrade http → https cho domain của server production
    return trimmed.replace(/^http:\/\/hcmvision-api\.onrender\.com/i, 'https://hcmvision-api.onrender.com');
  }

  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  return `${API_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
}

export function normalizeCamera(raw: unknown): Camera {
  return {
    id: asString(field(raw, 'id')),
    name: asString(field(raw, 'name')),
    latitude: asNumber(field(raw, 'latitude')),
    longitude: asNumber(field(raw, 'longitude')),
    wardId: field<string>(raw, 'wardId'),
    wardName: field<string>(raw, 'wardName'),
    districtName: field<string>(raw, 'districtName'),
    status: (field<string>(raw, 'status') || 'Offline') as Camera['status'],
    streamUrl: field<string>(raw, 'streamUrl'),
    streamType: field<string>(raw, 'streamType'),
    lastUpdatedAt: field<string>(raw, 'lastUpdatedAt'),
  };
}

export function normalizeCameraList(payload: unknown): CameraListResponse {
  const data = asArray(payload, 'data', 'items').map(normalizeCamera).filter((camera) => camera.id);
  const total = asNumber(field(payload, 'total'), data.length);
  const page = asNumber(field(payload, 'page'), 1);
  const pageSize = asNumber(field(payload, 'pageSize'), data.length || 10);

  return { data, total, page, pageSize };
}

export function normalizeCameraStatusItem(raw: unknown): CameraStatusItem {
  const cameraId = asString(field(raw, 'cameraId') ?? field(raw, 'id'));
  const streamUrl = field<string>(raw, 'streamUrl');
  const imageUrl = field<string>(raw, 'imageUrl') ?? streamUrl;

  return {
    cameraId,
    cameraName: asString(field(raw, 'cameraName') ?? field(raw, 'name'), cameraId),
    latitude: asNumber(field(raw, 'latitude')),
    longitude: asNumber(field(raw, 'longitude')),
    wardId: field<string>(raw, 'wardId'),
    wardName: field<string>(raw, 'wardName'),
    districtName: field<string>(raw, 'districtName'),
    streamUrl,
    streamType: field<string>(raw, 'streamType'),
    cameraStatus: asString(field(raw, 'cameraStatus') ?? field(raw, 'status'), 'Offline'),
    hasFreshWeatherData: asBool(field(raw, 'hasFreshWeatherData')),
    weatherStatusText: field<string>(raw, 'weatherStatusText'),
    isRaining: asBool(field(raw, 'isRaining')),
    rainLevel: field<string>(raw, 'rainLevel'),
    trafficLevel: field<string>(raw, 'trafficLevel'),
    isTrafficJammed: asBool(field(raw, 'isTrafficJammed')),
    confidence: field(raw, 'confidence') === undefined ? undefined : asNumber(field(raw, 'confidence')),
    lastUpdatedAtUtc: field<string>(raw, 'lastUpdatedAtUtc') ?? field<string>(raw, 'lastUpdatedAt'),
    timeAgo: field<string>(raw, 'timeAgo'),
    imageUrl: toAbsoluteImageUrl(imageUrl),
    rawImageUrl: toAbsoluteImageUrl(field<string>(raw, 'rawImageUrl')),
    imageIsRedacted: field(raw, 'imageIsRedacted') === undefined ? undefined : asBool(field(raw, 'imageIsRedacted')),
    isFavorite: field(raw, 'isFavorite') === undefined ? undefined : asBool(field(raw, 'isFavorite')),
  };
}

export function normalizeCameraStatusResponse(payload: unknown): CameraStatusResponse {
  const data = asArray(payload, 'data', 'items', 'cameras')
    .map(normalizeCameraStatusItem)
    .filter((camera) => camera.cameraId);
  const filtersRaw = field<Record<string, unknown>>(payload, 'filters');

  return {
    data,
    total: asNumber(field(payload, 'total'), data.length),
    page: asNumber(field(payload, 'page'), 1),
    pageSize: asNumber(field(payload, 'pageSize'), data.length || 20),
    timeLimitUtc: field<string>(payload, 'timeLimitUtc'),
    filters: filtersRaw
      ? {
          wardId: field<string>(filtersRaw, 'wardId'),
          districtName: field<string>(filtersRaw, 'districtName'),
          rain: field<any>(filtersRaw, 'rain'),
          traffic: field<any>(filtersRaw, 'traffic'),
          favoriteOnly: asBool(field(filtersRaw, 'favoriteOnly')),
        }
      : undefined,
  };
}

export function normalizeWeatherLog(raw: unknown): WeatherLog {
  return {
    id: asString(field(raw, 'id')),
    cameraId: asString(field(raw, 'cameraId')),
    cameraName: field<string>(raw, 'cameraName'),
    wardName: field<string>(raw, 'wardName'),
    districtName: field<string>(raw, 'districtName'),
    latitude: asNumber(field(raw, 'latitude')),
    longitude: asNumber(field(raw, 'longitude')),
    isRaining: asBool(field(raw, 'isRaining')),
    rainLevel: asString(field(raw, 'rainLevel'), 'none'),
    trafficLevel: asString(field(raw, 'trafficLevel'), 'clear'),
    confidence: asNumber(field(raw, 'confidence')),
    timestampUtc: field<string>(raw, 'timestampUtc') || field<string>(raw, 'timestamp'),
    timeAgo: asString(field(raw, 'timeAgo'), 'Vừa xong'),
    imageUrl: toAbsoluteImageUrl(field<string>(raw, 'imageUrl')),
    rawImageUrl: toAbsoluteImageUrl(field<string>(raw, 'rawImageUrl')),
    imageExpiresAtUtc: field<string>(raw, 'imageExpiresAtUtc'),
    imageDeletedAtUtc: field<string>(raw, 'imageDeletedAtUtc'),
    imageIsRedacted: asBool(field(raw, 'imageIsRedacted')),
    aiModel: field<string>(raw, 'aiModel'),
    aiReason: field<string>(raw, 'aiReason'),
  };
}

export function normalizeWeatherLogs(payload: unknown): WeatherLogsResponse {
  const data = asArray(payload, 'data', 'items', 'logs', 'results')
    .map(normalizeWeatherLog)
    .filter((log) => log.cameraId);

  return {
    count: asNumber(field(payload, 'count'), data.length),
    minutes: asNumber(field(payload, 'minutes'), 0),
    limit: asNumber(field(payload, 'limit'), data.length),
    onlyWithImages: asBool(field(payload, 'onlyWithImages')),
    data,
  };
}

export function normalizeRainingCamera(raw: unknown): RainingCamera {
  return {
    cameraId: asString(field(raw, 'cameraId')),
    cameraName: asString(field(raw, 'cameraName')),
    latitude: asNumber(field(raw, 'latitude')),
    longitude: asNumber(field(raw, 'longitude')),
    wardId: field<string>(raw, 'wardId'),
    cameraStatus: field<string>(raw, 'cameraStatus'),
    isRaining: asBool(field(raw, 'isRaining'), true),
    rainLevel: asString(field(raw, 'rainLevel'), 'light'),
    trafficLevel: asString(field(raw, 'trafficLevel'), 'clear'),
    confidence: asNumber(field(raw, 'confidence')),
    lastRainAtUtc: asString(field(raw, 'lastRainAtUtc')),
    imageUrl: toAbsoluteImageUrl(field<string>(raw, 'imageUrl')),
    rawImageUrl: toAbsoluteImageUrl(field<string>(raw, 'rawImageUrl')),
    imageExpiresAtUtc: field<string>(raw, 'imageExpiresAtUtc'),
    imageDeletedAtUtc: field<string>(raw, 'imageDeletedAtUtc'),
    imageIsRedacted: asBool(field(raw, 'imageIsRedacted')),
  };
}

export function normalizeRainingCameras(payload: unknown): RainingCamerasResponse {
  const data = asArray(payload, 'data', 'items', 'cameras')
    .map(normalizeRainingCamera)
    .filter((camera) => camera.cameraId);

  return {
    count: asNumber(field(payload, 'count'), data.length),
    minutes: asNumber(field(payload, 'minutes'), 30),
    timeLimitUtc: asString(field(payload, 'timeLimitUtc')),
    data,
  };
}

export function normalizeFavorite(raw: unknown): Favorite {
  const cameraRaw = field(raw, 'camera') ?? raw;
  const camera = normalizeCamera(cameraRaw);
  return {
    cameraId: asString(field(raw, 'cameraId'), camera.id),
    camera,
    createdAt: asString(field(raw, 'createdAt')),
  };
}

export function normalizeFavorites(payload: unknown): FavoriteListResponse {
  const items = asArray(payload, 'items', 'data').map(normalizeFavorite).filter((item) => item.cameraId);
  return { items, total: asNumber(field(payload, 'total'), items.length) };
}

export function normalizeSubscription(raw: unknown): AlertSubscription {
  return {
    subscriptionId: asString(field(raw, 'subscriptionId') ?? field(raw, 'id')),
    wardId: field<string>(raw, 'wardId'),
    wardName: field<string>(raw, 'wardName'),
    districtName: field<string>(raw, 'districtName'),
    thresholdProbability: asNumber(field(raw, 'thresholdProbability'), 0.7),
    isEnabled: asBool(field(raw, 'isEnabled'), true),
    createdAt: asString(field(raw, 'createdAt')),
  };
}

export function normalizeSubscriptions(payload: unknown) {
  const items = asArray(payload, 'items', 'data').map(normalizeSubscription);
  return { items, total: asNumber(field(payload, 'total'), items.length) };
}

export function normalizeAdminStats(payload: unknown): AdminStats {
  return {
    totalCameras: asNumber(field(payload, 'totalCameras')),
    activeCameras: asNumber(field(payload, 'activeCameras') ?? field(payload, 'active')),
    offlineCameras: asNumber(field(payload, 'offlineCameras') ?? field(payload, 'offline')),
    totalUsers: asNumber(field(payload, 'totalUsers')),
    activeUsers: asNumber(field(payload, 'activeUsers')),
    averageRainProbability: asNumber(field(payload, 'averageRainProbability')),
    rainingCameras: asNumber(field(payload, 'rainingCameras')),
    totalReports: asNumber(field(payload, 'totalReports') ?? field(payload, 'totalUserReports')),
    totalWeatherLogs: asNumber(field(payload, 'totalWeatherLogs')),
    lastUpdateTime: asString(field(payload, 'lastUpdateTime') ?? field(payload, 'lastSystemScan')),
    systemStatus: asString(field(payload, 'systemStatus')),
  };
}

export function normalizeAdminUser(raw: unknown): AdminUser {
  const isActive = asBool(field(raw, 'isActive'), true);
  const role = asString(field(raw, 'role'), 'User') === 'Admin' ? 'Admin' : 'User';
  return {
    id: asNumber(field(raw, 'id')),
    username: asString(field(raw, 'username')),
    email: asString(field(raw, 'email')),
    fullName: field<string>(raw, 'fullName'),
    role,
    status: isActive ? 'Active' : 'Banned',
    isActive,
    createdAt: asString(field(raw, 'createdAt')),
  };
}

export function normalizeAdminUsers(payload: unknown): AdminUsersResponse {
  const items = asArray(payload, 'items', 'data').map(normalizeAdminUser);
  return {
    items,
    data: items,
    total: asNumber(field(payload, 'total'), items.length),
    page: asNumber(field(payload, 'page'), 1),
    pageSize: asNumber(field(payload, 'pageSize'), items.length || 20),
  };
}

export function normalizeAdminAuditLog(raw: unknown): AdminAccountAuditLog {
  return {
    id: asString(field(raw, 'id')),
    actorUserId: asNumber(field(raw, 'actorUserId')),
    actorUsername: asString(field(raw, 'actorUsername')),
    targetUserId: asNumber(field(raw, 'targetUserId')),
    targetUsername: asString(field(raw, 'targetUsername')),
    action: asString(field(raw, 'action')),
    previousValue: asString(field(raw, 'previousValue')),
    newValue: asString(field(raw, 'newValue')),
    createdAt: asString(field(raw, 'createdAt')),
  };
}

export function normalizeAdminAuditLogs(payload: unknown): AdminAuditLogResponse {
  return {
    items: asArray(payload, 'items', 'data').map(normalizeAdminAuditLog),
  };
}

export function normalizeAdminAiAuditReport(raw: unknown): AdminAiAuditReport {
  const cameraId = asString(field(raw, 'cameraId'));

  return {
    reportId: asNumber(field(raw, 'reportId') ?? field(raw, 'id')),
    cameraId,
    cameraName: field<string>(raw, 'cameraName'),
    userSaid: asString(field(raw, 'userSaid')),
    aiSaid: asString(field(raw, 'aiSaid')),
    aiRainLevel: field<string>(raw, 'aiRainLevel'),
    aiTrafficLevel: field<string>(raw, 'aiTrafficLevel'),
    aiConfidence: asNumber(field(raw, 'aiConfidence')),
    imageUrl: toAbsoluteImageUrl(field<string>(raw, 'imageUrl')),
    reportTime: asString(field(raw, 'reportTime') ?? field(raw, 'timestamp')),
    note: field<string>(raw, 'note'),
  };
}

export function normalizeAdminAiAuditReports(payload: unknown): AdminAiAuditReportsResponse {
  const items = asArray(payload, 'items', 'data').map(normalizeAdminAiAuditReport);

  return {
    items,
    total: asNumber(field(payload, 'total'), items.length),
  };
}

export function normalizeFailedCamera(raw: unknown): FailedCamera {
  return {
    cameraId: asString(field(raw, 'cameraId') ?? field(raw, 'id')),
    cameraName: asString(field(raw, 'cameraName') ?? field(raw, 'name')),
    lastError: asString(field(raw, 'lastError') ?? field(raw, 'status'), 'Không có dữ liệu mới'),
    lastErrorTime: asString(field(raw, 'lastErrorTime') ?? field(raw, 'lastChecked')),
    failureCount: asNumber(field(raw, 'failureCount'), 1),
  };
}

export function normalizeCameraHealth(payload: unknown): CameraHealthResponse {
  const rawSummary = field<Record<string, unknown>>(payload, 'summary') ?? {};
  const summary = {
    totalCameras: asNumber(field(rawSummary, 'totalCameras')),
    active: asNumber(field(rawSummary, 'active')),
    offline: asNumber(field(rawSummary, 'offline')),
    maintenance: asNumber(field(rawSummary, 'maintenance')),
    testMode: asNumber(field(rawSummary, 'testMode')),
    checkedAt: asString(field(rawSummary, 'checkedAt')),
    note: field<string>(rawSummary, 'note'),
  };
  const details: CameraHealth[] = asArray(payload, 'details', 'cameras').map((item) => ({
    cameraId: asString(field(item, 'cameraId') ?? field(item, 'id')),
    cameraName: asString(field(item, 'cameraName') ?? field(item, 'name')),
    status: asString(field(item, 'status')),
    uptime: asNumber(field(item, 'uptime')),
    lastSeen: asString(field(item, 'lastSeen') ?? field(item, 'lastChecked')),
    reason: field<string>(item, 'reason'),
    streamUrl: field<string>(item, 'streamUrl'),
  }));

  return {
    summary,
    details,
    cameras: details,
  };
}

export function normalizeFailedCameras(payload: unknown) {
  const items = asArray(payload, 'items', 'data', 'cameras').map(normalizeFailedCamera);
  return {
    items,
    data: items,
    cameras: items,
    totalFailed: asNumber(field(payload, 'totalFailed'), items.length),
  };
}

export function normalizeIngestionJob(raw: unknown): IngestionJob {
  const startedAt = field<string>(raw, 'startedAt') ?? field<string>(raw, 'createdAt');
  const endedAt = field<string>(raw, 'endedAt') ?? field<string>(raw, 'completedAt');
  return {
    jobId: asString(field(raw, 'jobId')),
    jobType: field<string>(raw, 'jobType'),
    status: asString(field(raw, 'status'), 'Unknown') as IngestionJob['status'],
    progress: asNumber(field(raw, 'progress')),
    createdAt: asString(startedAt),
    startedAt: asString(startedAt),
    completedAt: endedAt,
    endedAt,
    errorMessage: field<string>(raw, 'errorMessage') ?? field<string>(raw, 'notes'),
    totalAttempts: asNumber(field(raw, 'totalAttempts')),
    successfulAttempts: asNumber(field(raw, 'successfulAttempts')),
    failedAttempts: asNumber(field(raw, 'failedAttempts')),
    avgLatency: asNumber(field(raw, 'avgLatency')),
  };
}

export function normalizeIngestionJobs(payload: unknown): IngestionJobsResponse {
  const items = asArray(payload, 'items', 'jobs', 'data').map(normalizeIngestionJob);
  return {
    items,
    jobs: items,
    total: asNumber(field(payload, 'total') ?? field(payload, 'totalCount'), items.length),
    page: asNumber(field(payload, 'page'), 1),
    pageSize: asNumber(field(payload, 'pageSize'), items.length || 20),
    totalPages: asNumber(field(payload, 'totalPages'), 1),
  };
}

export function normalizeIngestionStats(payload: unknown): IngestionStatsResponse {
  const jobs = field<Record<string, unknown>>(payload, 'jobs') ?? {};
  const attempts = field<Record<string, unknown>>(payload, 'attempts') ?? {};

  return {
    period: asString(field(payload, 'period')),
    jobs: {
      total: asNumber(field(jobs, 'total')),
      completed: asNumber(field(jobs, 'completed')),
      failed: asNumber(field(jobs, 'failed')),
      successRate: asNumber(field(jobs, 'successRate')),
    },
    attempts: {
      total: asNumber(field(attempts, 'total')),
      successful: asNumber(field(attempts, 'successful')),
      failed: asNumber(field(attempts, 'failed')),
      successRate: asNumber(field(attempts, 'successRate')),
      averageLatency: asNumber(field(attempts, 'avgLatency') ?? field(attempts, 'averageLatency')),
    },
    problematicCameras: asArray(payload, 'problematicCameras').map((camera) => ({
      cameraId: asString(field(camera, 'cameraId')),
      totalAttempts: asNumber(field(camera, 'totalAttempts')),
      failedAttempts: asNumber(field(camera, 'failedAttempts')),
      errorRate: asNumber(field(camera, 'errorRate')),
      averageLatency: asNumber(field(camera, 'avgLatency') ?? field(camera, 'averageLatency')),
    })),
  };
}
