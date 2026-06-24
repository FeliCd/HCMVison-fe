import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

import {
  AdminAccountAuditLog,
  AdminAuditLogResponse,
  AdminRole,
  AdminStats,
  AdminUser,
  AdminUsersQuery,
  AdminUsersResponse,
  CameraHealth,
  CameraHealthResponse,
  AlertSubscription,
  Camera,
  CameraListResponse,
  ChatbotResponse,
  Favorite,
  FavoriteListResponse,
  FailedCamera,
  IngestionJob,
  IngestionJobsResponse,
  IngestionStatsResponse,
  RainingCamera,
  RainingCamerasResponse,
  WeatherLog,
  WeatherLogsResponse,
} from '@/types/api';

export type AuthPolicy = 'public' | 'optional' | 'required' | 'admin';

type RequestConfig = AxiosRequestConfig & { authPolicy?: AuthPolicy };

const getApiBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5057/api';

  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2');
  }

  if (!url.endsWith('/api') && !url.endsWith('/api/')) {
    url = url.replace(/\/$/, '') + '/api';
  }

  return url.replace(/\/$/, '');
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, '');

function field<T = unknown>(value: unknown, ...keys: string[]): T | undefined {
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

function asArray<T = unknown>(value: unknown, ...keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  for (const key of keys) {
    const nested = field<unknown>(value, key);
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return fallback;
}

function asString(value: unknown, fallback = ''): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export function toAbsoluteImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\/hcmvision-api\.onrender\.com/i, 'https://hcmvision-api.onrender.com');
  }

  if (trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  return `${API_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
}

function withData<T>(response: AxiosResponse, data: T): AxiosResponse<T> {
  return { ...response, data };
}

export function normalizeCamera(raw: unknown): Camera {
  return {
    id: asString(field(raw, 'id')),
    name: asString(field(raw, 'name')),
    latitude: asNumber(field(raw, 'latitude')),
    longitude: asNumber(field(raw, 'longitude')),
    wardId: field<string>(raw, 'wardId'),
    wardName: field<string>(raw, 'wardName'),
    status: (field<string>(raw, 'status') || 'Offline') as Camera['status'],
    streamUrl: field<string>(raw, 'streamUrl'),
    streamType: field<string>(raw, 'streamType'),
    demoImageUrl: toAbsoluteImageUrl(field<string>(raw, 'demoImageUrl')),
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

function normalizeFavorite(raw: unknown): Favorite {
  const cameraRaw = field(raw, 'camera') ?? raw;
  const camera = normalizeCamera(cameraRaw);
  return {
    cameraId: asString(field(raw, 'cameraId'), camera.id),
    camera,
    createdAt: asString(field(raw, 'createdAt')),
  };
}

function normalizeFavorites(payload: unknown): FavoriteListResponse {
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

function normalizeSubscriptions(payload: unknown) {
  const items = asArray(payload, 'items', 'data').map(normalizeSubscription);
  return { items, total: asNumber(field(payload, 'total'), items.length) };
}

function normalizeAdminStats(payload: unknown): AdminStats {
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

function normalizeAdminUser(raw: unknown): AdminUser {
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

function normalizeAdminUsers(payload: unknown): AdminUsersResponse {
  const items = asArray(payload, 'items', 'data').map(normalizeAdminUser);
  return {
    items,
    data: items,
    total: asNumber(field(payload, 'total'), items.length),
    page: asNumber(field(payload, 'page'), 1),
    pageSize: asNumber(field(payload, 'pageSize'), items.length || 20),
  };
}

function normalizeAdminAuditLog(raw: unknown): AdminAccountAuditLog {
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

function normalizeAdminAuditLogs(payload: unknown): AdminAuditLogResponse {
  return {
    items: asArray(payload, 'items', 'data').map(normalizeAdminAuditLog),
  };
}

function normalizeFailedCamera(raw: unknown): FailedCamera {
  return {
    cameraId: asString(field(raw, 'cameraId') ?? field(raw, 'id')),
    cameraName: asString(field(raw, 'cameraName') ?? field(raw, 'name')),
    lastError: asString(field(raw, 'lastError') ?? field(raw, 'status'), 'Không có dữ liệu mới'),
    lastErrorTime: asString(field(raw, 'lastErrorTime') ?? field(raw, 'lastChecked')),
    failureCount: asNumber(field(raw, 'failureCount'), 1),
  };
}

function normalizeCameraHealth(payload: unknown): CameraHealthResponse {
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

function normalizeFailedCameras(payload: unknown) {
  const items = asArray(payload, 'items', 'data', 'cameras').map(normalizeFailedCamera);
  return {
    items,
    data: items,
    cameras: items,
    totalFailed: asNumber(field(payload, 'totalFailed'), items.length),
  };
}

function normalizeIngestionJob(raw: unknown): IngestionJob {
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

function normalizeIngestionJobs(payload: unknown): IngestionJobsResponse {
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

function normalizeIngestionStats(payload: unknown): IngestionStatsResponse {
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

class ApiClient {
  private readonly client: AxiosInstance;
  private token: string | null = null;
  private onUnauthorized?: () => void;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const requestConfig = config as RequestConfig;
        const policy = requestConfig.authPolicy ?? 'public';

        if (policy !== 'public') {
          const token = await this.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        return config;
      },
      (error) => {
        throw error;
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RequestConfig & { _retry?: boolean };
        const policy = originalRequest?.authPolicy ?? 'public';

        if (
          error.response?.status === 401 &&
          !originalRequest?._retry &&
          (policy === 'required' || policy === 'admin')
        ) {
          originalRequest._retry = true;
          await this.clearToken();
          this.onUnauthorized?.();
        }

        throw error;
      }
    );
  }

  private request<T = unknown>(config: RequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>({
      ...config,
      authPolicy: config.authPolicy ?? 'public',
    } as RequestConfig);
  }

  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  async register(username: string, email: string, password: string) {
    return this.request({
      method: 'POST',
      url: '/Auth/register',
      data: { username, email, password },
      authPolicy: 'public',
    });
  }

  async login(username: string, password: string) {
    return this.request({
      method: 'POST',
      url: '/Auth/login',
      data: { username, password },
      authPolicy: 'public',
    });
  }

  async forgotPassword(email: string) {
    return this.request({ method: 'POST', url: '/Auth/forgot-password', data: { email }, authPolicy: 'public' });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request({ method: 'POST', url: '/Auth/reset-password', data: { token, newPassword }, authPolicy: 'public' });
  }

  async getProfile() {
    return this.request<any>({ method: 'GET', url: '/Auth/me', authPolicy: 'required' });
  }

  async updateProfile(data: { fullName?: string; phoneNumber?: string; avatarUrl?: string }) {
    return this.request({ method: 'PUT', url: '/Auth/me', data, authPolicy: 'required' });
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request({ method: 'POST', url: '/Auth/change-password', data: { oldPassword, newPassword }, authPolicy: 'required' });
  }

  async saveDeviceToken(data: { fcmToken: string; deviceId: string; platform?: string; appVersion?: string }) {
    return this.request({ method: 'POST', url: '/device-tokens', data, authPolicy: 'required' });
  }

  async deleteDeviceToken(data: { fcmToken: string }) {
    return this.request({ method: 'DELETE', url: '/device-tokens', data, authPolicy: 'required' });
  }

  async getCameras(search?: string, sortBy?: string, page = 1, pageSize = 10) {
    const response = await this.request({
      method: 'GET',
      url: '/Camera',
      params: { search, sortBy, page, pageSize },
      authPolicy: 'public',
    });
    return withData(response, normalizeCameraList(response.data));
  }

  async createCamera(data: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    wardId?: string;
    streamUrl: string;
    streamType?: string;
  }) {
    return this.request({ method: 'POST', url: '/Camera', data, authPolicy: 'admin' });
  }

  async updateCamera(
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
    return this.request({ method: 'PUT', url: `/Camera/${id}`, data, authPolicy: 'admin' });
  }

  async deleteCamera(id: string) {
    return this.request({ method: 'DELETE', url: `/Camera/${id}`, authPolicy: 'admin' });
  }

  async uploadDemoImage(id: string, file: FormData) {
    return this.request({
      method: 'POST',
      url: `/Camera/${id}/demo-image`,
      data: file,
      headers: { 'Content-Type': 'multipart/form-data' },
      authPolicy: 'admin',
    });
  }

  async setDemoImage(id: string, fileName: string) {
    return this.request({ method: 'PUT', url: `/Camera/${id}/demo-image`, data: { fileName }, authPolicy: 'admin' });
  }

  async restoreStream(id: string, data: { streamUrl: string; streamType?: string }) {
    return this.request({ method: 'PUT', url: `/Camera/${id}/restore-stream`, data, authPolicy: 'admin' });
  }

  async runAiTest(id: string, saveWeatherLog = false) {
    return this.request({ method: 'POST', url: `/Camera/${id}/run-ai-test`, data: { saveWeatherLog }, authPolicy: 'admin' });
  }

  async getLatestWeather() {
    const response = await this.request({ method: 'GET', url: '/Weather/latest', authPolicy: 'public' });
    return withData(response, asArray(response.data, 'data').map(normalizeWeatherLog));
  }

  async getWeatherLogs(minutes = 180, limit = 100, onlyWithImages = false) {
    const response = await this.request({
      method: 'GET',
      url: '/Weather/logs',
      params: { minutes, limit, onlyWithImages },
      authPolicy: 'public',
    });
    return withData(response, normalizeWeatherLogs(response.data));
  }

  async getRainingCamerasCount(minutes = 30) {
    return this.request({ method: 'GET', url: '/Weather/raining-cameras/count', params: { minutes }, authPolicy: 'public' });
  }

  async getRainingCameras(minutes = 30) {
    const response = await this.request({ method: 'GET', url: '/Weather/raining-cameras', params: { minutes }, authPolicy: 'public' });
    return withData(response, normalizeRainingCameras(response.data));
  }

  async testWeatherAI(imageFile: FormData, saveLog = false) {
    return this.request({
      method: 'POST',
      url: '/Weather/test-ai',
      data: imageFile,
      params: { SaveLog: saveLog },
      headers: { 'Content-Type': 'multipart/form-data' },
      authPolicy: 'admin',
    });
  }

  async reportWeather(data: { cameraId?: string; isRaining: boolean; note?: string }) {
    return this.request({ method: 'POST', url: '/Weather/report', data, authPolicy: 'required' });
  }

  async checkRoute(data: {
    currentLatitude?: number;
    currentLongitude?: number;
    originLatitude?: number;
    originLongitude?: number;
    destinationLatitude?: number;
    destinationLongitude?: number;
    routePoints?: { lat: number; lng: number }[];
  }) {
    return this.request<any>({ method: 'POST', url: '/Weather/check-route', data, authPolicy: 'optional' });
  }

  async getWeatherHeatmap() {
    return this.request<any>({ method: 'GET', url: '/Weather/heatmap', authPolicy: 'public' });
  }

  async getWards() {
    return this.request<any[]>({ method: 'GET', url: '/Location/wards', authPolicy: 'public' });
  }

  async getWardById(id: string) {
    return this.request<any>({ method: 'GET', url: `/Location/wards/${id}`, authPolicy: 'public' });
  }

  async getDistricts() {
    return this.request<any[]>({ method: 'GET', url: '/Location/districts', authPolicy: 'public' });
  }

  async getWardsByDistrict(districtName: string) {
    return this.request<any[]>({ method: 'GET', url: `/Location/wards/by-district/${districtName}`, authPolicy: 'public' });
  }

  async getFavorites() {
    const response = await this.request({ method: 'GET', url: '/Favorite', authPolicy: 'required' });
    return withData(response, normalizeFavorites(response.data));
  }

  async addFavorite(cameraId: string) {
    return this.request({ method: 'POST', url: `/Favorite/${cameraId}`, authPolicy: 'required' });
  }

  async removeFavorite(cameraId: string) {
    return this.request({ method: 'DELETE', url: `/Favorite/${cameraId}`, authPolicy: 'required' });
  }

  async getSubscriptions() {
    const response = await this.request({ method: 'GET', url: '/subscriptions', authPolicy: 'required' });
    return withData(response, normalizeSubscriptions(response.data));
  }

  async createSubscription(data: { wardId: string; thresholdProbability?: number }) {
    return this.request({ method: 'POST', url: '/subscriptions', data, authPolicy: 'required' });
  }

  async updateSubscription(id: string, data: { thresholdProbability?: number; isEnabled?: boolean }) {
    return this.request({ method: 'PUT', url: `/subscriptions/${id}`, data, authPolicy: 'required' });
  }

  async deleteSubscription(id: string) {
    return this.request({ method: 'DELETE', url: `/subscriptions/${id}`, authPolicy: 'required' });
  }

  async debugChatbot() {
    return this.request({ method: 'GET', url: '/Chatbot/debug', authPolicy: 'public' });
  }

  async sendChatbotMessage(message: string) {
    const response = await this.request({ method: 'POST', url: '/Chatbot/message', data: { message }, authPolicy: 'public' });
    const reply = asString(field(response.data, 'reply') ?? field(response.data, 'message'), 'Xin lỗi, tôi chưa có phản hồi phù hợp.');
    return withData<ChatbotResponse>(response, { reply, message: reply });
  }

  async getAdminStats() {
    const response = await this.request({ method: 'GET', url: '/Admin/stats', authPolicy: 'admin' });
    return withData(response, normalizeAdminStats(response.data));
  }

  async getAuditData() {
    return this.request<any[]>({ method: 'GET', url: '/Admin/audit-data', authPolicy: 'admin' });
  }

  async getUsers({
    search,
    sortBy = 'newest',
    role,
    isActive,
    page = 1,
    pageSize = 20,
  }: AdminUsersQuery = {}) {
    const response = await this.request({
      method: 'GET',
      url: '/Admin/users',
      params: { search, sortBy, role, isActive, page, pageSize },
      authPolicy: 'admin',
    });
    return withData(response, normalizeAdminUsers(response.data));
  }

  async updateUserStatus(id: number, isActive: boolean) {
    const response = await this.request({
      method: 'PATCH',
      url: `/Admin/users/${id}/status`,
      data: { isActive },
      authPolicy: 'admin',
    });
    return withData(response, normalizeAdminUser(response.data));
  }

  async updateUserRole(id: number, role: AdminRole) {
    const response = await this.request({
      method: 'PATCH',
      url: `/Admin/users/${id}/role`,
      data: { role },
      authPolicy: 'admin',
    });
    return withData(response, normalizeAdminUser(response.data));
  }

  async getAdminAuditLogs(limit = 10) {
    const response = await this.request({
      method: 'GET',
      url: '/Admin/audit-logs',
      params: { limit },
      authPolicy: 'admin',
    });
    return withData(response, normalizeAdminAuditLogs(response.data));
  }

  async getRainFrequencyStats() {
    return this.request({ method: 'GET', url: '/Admin/stats/rain-frequency', authPolicy: 'admin' });
  }

  async getFailedCameras() {
    const response = await this.request({ method: 'GET', url: '/Admin/stats/failed-cameras', authPolicy: 'admin' });
    return withData(response, normalizeFailedCameras(response.data));
  }

  async checkCameraHealth() {
    const response = await this.request({ method: 'GET', url: '/Admin/stats/check-camera-health', authPolicy: 'admin' });
    return withData(response, normalizeCameraHealth(response.data));
  }

  async getIngestionJobs(page = 1, pageSize = 20, status?: string) {
    const response = await this.request({
      method: 'GET',
      url: '/Admin/ingestion-jobs',
      params: { page, pageSize, status },
      authPolicy: 'admin',
    });
    return withData(response, normalizeIngestionJobs(response.data));
  }

  async getIngestionJobDetail(jobId: string) {
    return this.request({ method: 'GET', url: `/Admin/ingestion-jobs/${jobId}`, authPolicy: 'admin' });
  }

  async getIngestionStats(days = 7) {
    const response = await this.request({
      method: 'GET',
      url: '/Admin/ingestion-stats',
      params: { days },
      authPolicy: 'admin',
    });
    return withData(response, normalizeIngestionStats(response.data));
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
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

  async getOSRMRoutes(startLng: number, startLat: number, endLng: number, endLat: number): Promise<any> {
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
}

export const apiClient = new ApiClient();
