import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

export type AuthPolicy = 'public' | 'optional' | 'required' | 'admin';

export type RequestConfig = AxiosRequestConfig & { authPolicy?: AuthPolicy };

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

export function withData<T>(response: AxiosResponse, data: T): AxiosResponse<T> {
  return { ...response, data };
}

class ApiCore {
  public readonly client: AxiosInstance;
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

  public request<T = unknown>(config: RequestConfig): Promise<AxiosResponse<T>> {
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
}

export const apiCore = new ApiCore();

export const setUnauthorizedCallback = apiCore.setUnauthorizedCallback.bind(apiCore);
export const getToken = apiCore.getToken.bind(apiCore);
export const setToken = apiCore.setToken.bind(apiCore);
export const clearToken = apiCore.clearToken.bind(apiCore);
