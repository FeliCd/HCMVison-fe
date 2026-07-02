import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';
import { WeatherData, WeatherLog, RainingCamera } from '@/types/api';

export const useWeather = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared queries
  const { data: weather = null } = useQuery<WeatherData | null>({
    queryKey: ['weather', 'latest'],
    queryFn: () => null,
    enabled: false,
    initialData: null,
    staleTime: 30_000,
  });

  const { data: logs = [] } = useQuery<WeatherLog[]>({
    queryKey: ['weather', 'logs', 'list'],
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: 30_000,
  });

  const { data: rainingCameras = [] } = useQuery<RainingCamera[]>({
    queryKey: ['weather', 'rainingCameras', 'list'],
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: 30_000,
  });

  const getWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getLatestWeather();
      const data = response.data;
      queryClient.setQueryData(['weather', 'latest'], data);
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
        const response = await apiClient.getWeatherLogs(minutes, limit, onlyWithImages);
        const items = response.data.data ?? [];
        queryClient.setQueryData(['weather', 'logs', 'list'], items);
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
        const response = await apiClient.getRainingCameras(minutes);
        const items = response.data.data ?? [];
        queryClient.setQueryData(['weather', 'rainingCameras', 'list'], items);
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
        // Invalidate queries to refresh weather data
        queryClient.invalidateQueries({ queryKey: ['weather'] });
        return response.data;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Không thể gửi báo cáo thời tiết';
        setError(message);
        throw err;
      }
    },
    [queryClient]
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

