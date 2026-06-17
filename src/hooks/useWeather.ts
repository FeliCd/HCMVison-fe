import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { WeatherData, WeatherLog, RainingCamera } from '@/types/api';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [rainingCameras, setRainingCameras] = useState<RainingCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend api/weather/latest returns WeatherLog[]
      const response = await apiClient.getLatestWeather();
      // Since weather is WeatherData, but we don't have an endpoint for aggregate WeatherData,
      // we'll update the component to handle this appropriately. Let's just set weather to null.
      setWeather(null);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải dữ liệu thời tiết';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeatherLogs = useCallback(async (minutes = 180, limit = 100) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getWeatherLogs(minutes, limit);
      const items = response.data?.data ?? [];
      setLogs(items);
      return items;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải lịch sử thời tiết';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getRainingCameras = useCallback(async (minutes = 30) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getRainingCameras(minutes);
      const items = response.data?.data ?? [];
      setRainingCameras(items);
      return items;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải danh sách camera mưa';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

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
