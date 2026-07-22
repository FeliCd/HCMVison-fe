/**
 * core.ts — Lõi HTTP client của toàn bộ ứng dụng.
 *
 * File này khởi tạo một instance Axios duy nhất (singleton `apiCore`) và
 * được sử dụng bởi tất cả các service file (auth, camera, weather...).
 *
 * Luồng xử lý request:
 *  Request → interceptor gắn Bearer token (nếu policy ≠ 'public') → server
 *
 * Luồng xử lý response:
 *  Response ← interceptor bắt 401 → xoá token + gọi callback logout ← server
 *
 * Auth policy (4 mức):
 *  - 'public'   : Không cần token (trang chủ, thời tiết công khai...)
 *  - 'optional' : Gắn token nếu có (hiển thị thêm dữ liệu cá nhân hoá)
 *  - 'required' : Phải có token, 401 → logout
 *  - 'admin'    : Phải có token admin, 401 → logout
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

export type AuthPolicy = 'public' | 'optional' | 'required' | 'admin';

export type RequestConfig = AxiosRequestConfig & { authPolicy?: AuthPolicy };

/**
 * Tính toán base URL của API.
 * - Đọc từ biến môi trường EXPO_PUBLIC_API_URL
 * - Nếu chạy trên Android Emulator, đổi localhost → 10.0.2.2
 *   (vì emulator không thể kết nối localhost của máy host qua 127.0.0.1)
 * - Đảm bảo URL kết thúc bằng /api
 */
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

/** Origin (không có /api) – dùng để tạo absolute URL cho ảnh */
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/i, '');

/**
 * Tiện ích tạo AxiosResponse mới với data được thay thế.
 * Dùng trong các service để trả về data đã normalize
 * mà vẫn giữ nguyên metadata response (headers, status...).
 */
export function withData<T>(response: AxiosResponse, data: T): AxiosResponse<T> {
  return { ...response, data };
}

// ─── ApiCore class ────────────────────────────────────────────────────────────
class ApiCore {
  public readonly client: AxiosInstance;
  private token: string | null = null;
  private onUnauthorized?: () => void;

  constructor() {
    // Khởi tạo Axios với base URL, timeout 15s và Content-Type JSON
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ── Interceptor Request: gắn Authorization header ─────────────────────
    // Chỉ gắn token nếu authPolicy khác 'public'.
    // Token được cache trong memory, chỉ đọc AsyncStorage lần đầu.
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

    // ── Interceptor Response: bắt lỗi 401 Unauthorized ───────────────────
    // Nếu policy là 'required' hoặc 'admin' và nhận 401:
    //  1. Xoá token khỏi memory và AsyncStorage
    //  2. Gọi callback onUnauthorized (thường là hàm logout + redirect login)
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

  /** Gửi HTTP request với config tùy chỉnh (method, url, body, params, authPolicy) */
  public request<T = unknown>(config: RequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>({
      ...config,
      authPolicy: config.authPolicy ?? 'public',
    } as RequestConfig);
  }

  /** Đăng ký callback được gọi khi nhận 401 (thường là logout + redirect) */
  setUnauthorizedCallback(callback: () => void) {
    this.onUnauthorized = callback;
  }

  /**
   * Lấy token hiện tại.
   * Cache trong memory để tránh đọc AsyncStorage mỗi request.
   */
  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  /** Lưu token vào memory và AsyncStorage */
  async setToken(token: string): Promise<void> {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  /** Xoá token khỏi memory và AsyncStorage (dùng khi logout hoặc 401) */
  async clearToken(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }
}

// Singleton — toàn bộ app dùng chung một instance duy nhất
export const apiCore = new ApiCore();

// Export các hàm token management để dùng trực tiếp từ các module khác
export const setUnauthorizedCallback = apiCore.setUnauthorizedCallback.bind(apiCore);
export const getToken = apiCore.getToken.bind(apiCore);
export const setToken = apiCore.setToken.bind(apiCore);
export const clearToken = apiCore.clearToken.bind(apiCore);
