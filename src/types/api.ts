// ==================== AUTH MODELS ====================

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: 'User' | 'Admin';
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

// ==================== CAMERA MODELS ====================

export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  wardName?: string;
  status: 'Active' | 'Inactive' | 'Offline';
  streamUrl?: string;
  streamType?: string;
  demoImageUrl?: string;
  lastUpdatedAt?: string;
}

export interface CameraListResponse {
  data: Camera[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateCameraRequest {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  streamUrl: string;
  streamType?: string;
}

export interface UpdateCameraRequest {
  name: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  status?: string;
  streamUrl?: string;
}

// ==================== WEATHER MODELS ====================

export interface WeatherData {
  timestamp: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
  rainingCameras: number;
  isRaining: boolean;
}

export interface WeatherLog {
  id: string;
  cameraId: string;
  cameraName?: string;
  wardName?: string;
  districtName?: string;
  latitude: number;
  longitude: number;
  isRaining: boolean;
  rainLevel: string;
  trafficLevel: string;
  confidence: number;
  timestampUtc?: string;
  timeAgo: string;
  imageUrl?: string;
  rawImageUrl?: string;
  imageExpiresAtUtc?: string;
  imageDeletedAtUtc?: string;
  imageIsRedacted?: boolean;
  aiModel?: string;
  aiReason?: string;
}

export interface WeatherLogsResponse {
  count: number;
  minutes: number;
  limit: number;
  onlyWithImages: boolean;
  data: WeatherLog[];
}

export interface RainingCamera {
  cameraId: string;
  cameraName: string;
  latitude: number;
  longitude: number;
  wardId?: string;
  cameraStatus?: string;
  isRaining: boolean;
  rainLevel: string;
  trafficLevel: string;
  confidence: number;
  lastRainAtUtc: string;
  imageUrl?: string;
  rawImageUrl?: string;
  imageExpiresAtUtc?: string;
  imageDeletedAtUtc?: string;
  imageIsRedacted?: boolean;
}

export interface RainingCamerasResponse {
  count: number;
  minutes: number;
  timeLimitUtc: string;
  data: RainingCamera[];
}

export interface WeatherReportRequest {
  cameraId?: string;
  isRaining: boolean;
  note?: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface CheckRouteRequest {
  currentLatitude?: number;
  currentLongitude?: number;
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  routePoints?: RoutePoint[];
}

export interface CheckRouteResponse {
  result: {
    isSafe: boolean;
    riskLevel: string;
    summary: string;
    recommendation: string;
  };
  rainInfo: {
    warningCount: number;
    destinationRainHits: number;
    rainingCameraCountLast30m: number;
    warnings: {
      lat: number;
      lng: number;
      cameraId?: string;
      message: string;
      rainLevel?: string;
      trafficLevel?: string;
    }[];
  };
}

export interface HeatmapData {
  points: {
    lat: number;
    lng: number;
    intensity: number;
  }[];
  timestamp: string;
}

// ==================== LOCATION MODELS ====================

export interface Ward {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  latitude: number;
  longitude: number;
}

export interface District {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

// ==================== FAVORITE MODELS ====================

export interface Favorite {
  cameraId: string;
  camera: Camera;
  createdAt: string;
}

export interface FavoriteListResponse {
  items: Favorite[];
  total: number;
}

// ==================== SUBSCRIPTION MODELS ====================

export interface AlertSubscription {
  subscriptionId: string;
  wardId?: string;
  wardName?: string;
  districtName?: string;
  thresholdProbability: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface CreateSubscriptionRequest {
  wardId: string;
  thresholdProbability?: number;
}

export interface UpdateSubscriptionRequest {
  thresholdProbability?: number;
  isEnabled?: boolean;
}

export interface SubscriptionListResponse {
  items: AlertSubscription[];
  total: number;
}

// ==================== ADMIN MODELS ====================

export interface AdminStats {
  totalCameras: number;
  activeCameras: number;
  offlineCameras: number;
  totalUsers: number;
  activeUsers: number;
  averageRainProbability: number;
  rainingCameras: number;
  totalReports: number;
  totalWeatherLogs?: number;
  lastUpdateTime: string;
  systemStatus?: string;
}

export type AdminRole = 'User' | 'Admin';

export type AdminUserStatus = 'Active' | 'Banned';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: AdminRole;
  status: AdminUserStatus;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUsersQuery {
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'username';
  role?: AdminRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  data?: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminAccountAuditLog {
  id: string;
  actorUserId: number;
  actorUsername: string;
  targetUserId: number;
  targetUsername: string;
  action: 'RoleChanged' | 'StatusChanged' | string;
  previousValue: string;
  newValue: string;
  createdAt: string;
}

export interface AdminAuditLogResponse {
  items: AdminAccountAuditLog[];
}

export interface FailedCamera {
  cameraId: string;
  cameraName: string;
  lastError: string;
  lastErrorTime: string;
  failureCount: number;
}

export interface CameraHealth {
  cameraId: string;
  cameraName: string;
  status: 'Active' | 'Maintenance' | 'Offline' | string;
  uptime: number;
  lastSeen: string;
  reason?: string;
  streamUrl?: string;
}

export interface CameraHealthSummary {
  totalCameras: number;
  active: number;
  offline: number;
  maintenance: number;
  testMode: number;
  checkedAt: string;
  note?: string;
}

export interface CameraHealthResponse {
  summary: CameraHealthSummary;
  details: CameraHealth[];
  cameras: CameraHealth[];
}

export interface IngestionJob {
  jobId: string;
  jobType?: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Unknown' | string;
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  endedAt?: string;
  errorMessage?: string;
  totalAttempts?: number;
  successfulAttempts?: number;
  failedAttempts?: number;
  avgLatency?: number;
}

export interface IngestionJobsResponse {
  items: IngestionJob[];
  jobs?: IngestionJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface IngestionStatsResponse {
  period: string;
  jobs: {
    total: number;
    completed: number;
    failed: number;
    successRate: number;
  };
  attempts: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    averageLatency: number;
  };
  problematicCameras: {
    cameraId: string;
    totalAttempts: number;
    failedAttempts: number;
    errorRate: number;
    averageLatency: number;
  }[];
}

export interface AuditLog {
  id: string;
  userId: number;
  username: string;
  action: string;
  targetType: string;
  targetId: string;
  timestamp: string;
  details?: string;
}

// ==================== CHATBOT MODELS ====================

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatbotMessageRequest {
  message: string;
}

export interface ChatbotResponse {
  reply: string;
  message: string;
  suggestions?: string[];
}

// ==================== COMMON RESPONSE MODELS ====================

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  statusCode: number;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
