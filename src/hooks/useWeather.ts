import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';
import { WeatherData, WeatherLog, RainingCamera } from '@/types/api';

export const useWeather = () => {
  const queryClient = useQueryClient();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [rainingCameras, setRainingCameras] = useState<RainingCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await queryClient.fetchQuery({
        queryKey: ['weather', 'latest'],
        queryFn: async () => {
          const response = await apiClient.getLatestWeather();
          return response.data;
        },
      });
      setWeather(null);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải dữ liệu thời tiết';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const getWeatherLogs = useCallback(
    async (minutes = 180, limit = 100, onlyWithImages = false) => {
      try {
        setLoading(true);
        setError(null);
        const data = await queryClient.fetchQuery({
          queryKey: ['weather', 'logs', minutes, limit, onlyWithImages],
          queryFn: async () => {
            const response = await apiClient.getWeatherLogs(minutes, limit, onlyWithImages);
            return response.data;
          },
        });
        const items = data.data ?? [];
        setLogs(items);
        return items;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể tải lịch sử thời tiết';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  const getRainingCameras = useCallback(
    async (minutes = 30) => {
      try {
        setLoading(true);
        setError(null);
        const data = await queryClient.fetchQuery({
          queryKey: ['weather', 'raining-cameras', minutes],
          queryFn: async () => {
            const response = await apiClient.getRainingCameras(minutes);
            return response.data;
          },
        });
        const items = data.data ?? [];
        setRainingCameras(items);
        return items;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể tải danh sách camera mưa';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [queryClient]
  );

  const reportWeather = useCallback(
    async (data: { cameraId?: string; isRaining: boolean; note?: string }) => {
      try {
        const response = await apiClient.reportWeather(data);
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể gửi báo cáo thời tiết';
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    weather,
    logs,
    rainingCameras,
    loading,
    error,
    getWeatherData,
    getWeatherLogs,
    getRainingCameras,
    reportWeather,
  };
};
