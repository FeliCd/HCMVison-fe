import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance } from 'axios';

import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  let url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5057/api';
  
  // Handle Android Emulator localhost issue
  if (Platform.OS === 'android' && url.includes('localhost')) {
    url = url.replace('localhost', '10.0.2.2');
  }
  
  // Ensure it ends with /api
  if (!url.endsWith('/api') && !url.endsWith('/api/')) {
    url = url.replace(/\/$/, '') + '/api';
  }
  
  return url;
};

const API_BASE_URL = getApiBaseUrl();


class ApiClient {
  private readonly client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        throw error;
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          // Clear token and redirect to login
          await this.clearToken();
          // Trigger logout event
          this.onUnauthorized?.();
        }

        throw error;
      }
    );
  }

  private onUnauthorized?: () => void;

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

  // ==================== AUTH ENDPOINTS ====================

  async register(username: string, email: string, password: string) {
    return this.client.post('/Auth/register', {
      username,
      email,
      password,
    });
  }

  async login(username: string, password: string) {
    return this.client.post('/Auth/login', {
      username,
      password,
    });
  }

  async forgotPassword(email: string) {
    return this.client.post('/Auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.client.post('/Auth/reset-password', {
      token,
      newPassword,
    });
  }

  async getProfile() {
    return this.client.get('/Auth/me');
  }

  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  }) {
    return this.client.put('/Auth/me', data);
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.client.post('/Auth/change-password', {
      oldPassword,
      newPassword,
    });
  }

  // ==================== DEVICE TOKEN ENDPOINTS ====================

  async saveDeviceToken(data: {
    fcmToken: string;
    deviceId: string;
    platform?: string;
    appVersion?: string;
  }) {
    return this.client.post('/device-tokens', data);
  }

  async deleteDeviceToken(data: { fcmToken: string }) {
    return this.client.delete('/device-tokens', { data });
  }

  // ==================== CAMERA ENDPOINTS ====================

  async getCameras(
    search?: string,
    sortBy?: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    return this.client.get('/Camera', {
      params: { search, sortBy, page, pageSize },
    });
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
    return this.client.post('/Camera', data);
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
    return this.client.put(`/Camera/${id}`, data);
  }

  async deleteCamera(id: string) {
    return this.client.delete(`/Camera/${id}`);
  }

  async uploadDemoImage(id: string, file: FormData) {
    return this.client.post(`/Camera/${id}/demo-image`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async setDemoImage(id: string, fileName: string) {
    return this.client.put(`/Camera/${id}/demo-image`, { fileName });
  }

  async restoreStream(
    id: string,
    data: { streamUrl: string; streamType?: string }
  ) {
    return this.client.put(`/Camera/${id}/restore-stream`, data);
  }

  async runAiTest(id: string, saveWeatherLog: boolean = false) {
    return this.client.post(`/Camera/${id}/run-ai-test`, { saveWeatherLog });
  }

  // ==================== WEATHER ENDPOINTS ====================

  async getLatestWeather() {
    return this.client.get('/Weather/latest');
  }

  async getWeatherLogs(
    minutes: number = 180,
    limit: number = 100,
    onlyWithImages: boolean = false
  ) {
    return this.client.get('/Weather/logs', {
      params: { minutes, limit, onlyWithImages },
    });
  }

  async getRainingCamerasCount(minutes: number = 30) {
    return this.client.get('/Weather/raining-cameras/count', {
      params: { minutes },
    });
  }

  async getRainingCameras(minutes: number = 30) {
    return this.client.get('/Weather/raining-cameras', {
      params: { minutes },
    });
  }

  async testWeatherAI(imageFile: FormData, saveLog: boolean = false) {
    return this.client.post('/Weather/test-ai', imageFile, {
      params: { SaveLog: saveLog },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async reportWeather(data: {
    cameraId?: string;
    isRaining: boolean;
    note?: string;
  }) {
    return this.client.post('/Weather/report', data);
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
    return this.client.post('/Weather/check-route', data);
  }

  async getWeatherHeatmap() {
    return this.client.get('/Weather/heatmap');
  }

  // ==================== LOCATION ENDPOINTS ====================

  async getWards() {
    return this.client.get('/Location/wards');
  }

  async getWardById(id: string) {
    return this.client.get(`/Location/wards/${id}`);
  }

  async getDistricts() {
    return this.client.get('/Location/districts');
  }

  async getWardsByDistrict(districtName: string) {
    return this.client.get(`/Location/wards/by-district/${districtName}`);
  }

  // ==================== FAVORITE ENDPOINTS ====================

  async getFavorites() {
    return this.client.get('/Favorite');
  }

  async addFavorite(cameraId: string) {
    return this.client.post(`/Favorite/${cameraId}`);
  }

  async removeFavorite(cameraId: string) {
    return this.client.delete(`/Favorite/${cameraId}`);
  }

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  async getSubscriptions() {
    return this.client.get('/subscriptions');
  }

  async createSubscription(data: {
    wardId: string;
    thresholdProbability?: number;
  }) {
    return this.client.post('/subscriptions', data);
  }

  async updateSubscription(
    id: string,
    data: { thresholdProbability?: number; isEnabled?: boolean }
  ) {
    return this.client.put(`/subscriptions/${id}`, data);
  }

  async deleteSubscription(id: string) {
    return this.client.delete(`/subscriptions/${id}`);
  }

  // ==================== CHATBOT ENDPOINTS ====================

  async debugChatbot() {
    return this.client.get('/Chatbot/debug');
  }

  async sendChatbotMessage(message: string) {
    return this.client.post('/Chatbot/message', { message });
  }

  // ==================== ADMIN ENDPOINTS ====================

  async getAdminStats() {
    return this.client.get('/Admin/stats');
  }

  async getAuditData() {
    return this.client.get('/Admin/audit-data');
  }

  async getUsers(
    search?: string,
    sortBy: string = 'newest',
    page: number = 1,
    pageSize: number = 20
  ) {
    return this.client.get('/Admin/users', {
      params: { search, sortBy, page, pageSize },
    });
  }

  async banUser(id: number) {
    return this.client.put(`/Admin/users/${id}/ban`);
  }

  async getRainFrequencyStats() {
    return this.client.get('/Admin/stats/rain-frequency');
  }

  async getFailedCameras() {
    return this.client.get('/Admin/stats/failed-cameras');
  }

  async checkCameraHealth() {
    return this.client.get('/Admin/stats/check-camera-health');
  }

  async getIngestionJobs(
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ) {
    return this.client.get('/Admin/ingestion-jobs', {
      params: { page, pageSize, status },
    });
  }

  async getIngestionJobDetail(jobId: string) {
    return this.client.get(`/Admin/ingestion-jobs/${jobId}`);
  }

  async getIngestionStats(days: number = 7) {
    return this.client.get('/Admin/ingestion-stats', {
      params: { days },
    });
  }

  // --- External Routing & Geocoding Helpers ---
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address + ', Ho Chi Minh City, Vietnam'
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

  async getOSRMRoutes(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number
  ): Promise<any> {
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

// Export singleton instance
export const apiClient = new ApiClient();
