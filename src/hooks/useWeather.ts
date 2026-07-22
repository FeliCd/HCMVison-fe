/**
 * useWeather.ts — Hook quản lý state thời tiết và camera mưa.
 *
 * Cung cấp:
 *  - getWeatherLogs()     : Lịch sử log thời tiết từ AI
 *  - getRainingCameras()  : Danh sách camera đang phát hiện mưa
 *  - getWeatherData()     : Dữ liệu tổng hợp thời tiết mới nhất
 *  - reportWeather()      : Gửi báo cáo mưa thủ công
 *
 * Sử dụng TanStack Query để cache và tránh fetch trùng lặp.
 */
import {
  getLatestWeather as apiGetLatestWeather,
  getWeatherLogs as apiGetWeatherLogs,
  getRainingCameras as apiGetRainingCameras,
  reportWeather as apiReportWeather,
} from '@/services/weather';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { WeatherData, WeatherLog, RainingCamera } from '@/types/api';

export const useWeather = () => {
  const queryClient = useQueryClient();

  // State thời tiết tổng hợp (hiện không được component nào dùng trực tiếp)
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // Danh sách log thời tiết từ camera AI
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  // Danh sách camera đang phát hiện mưa
  const [rainingCameras, setRainingCameras] = useState<RainingCamera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Lấy dữ liệu thời tiết mới nhất từ tất cả camera.
   * Trả về raw data — không update state weather vì API trả WeatherLog[] không phải WeatherData.
   */
  const getWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await queryClient.fetchQuery({
        queryKey: ['weather', 'latest'],
        staleTime: 0,
        queryFn: async () => {
          const response = await apiGetLatestWeather();
          return response.data;
        },
      });
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải dữ liệu thời tiết';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  /**
   * Lấy lịch sử log thời tiết với bộ lọc thời gian và giới hạn số lượng.
   * Kết quả được lưu vào state `logs` và cũng được trả về trực tiếp.
   */
  const getWeatherLogs = useCallback(
    async (minutes = 180, limit = 100, onlyWithImages = false) => {
      try {
        setLoading(true);
        setError(null);
        const data = await queryClient.fetchQuery({
          queryKey: ['weather', 'logs', minutes, limit, onlyWithImages],
          staleTime: 0,
          queryFn: async () => {
            const response = await apiGetWeatherLogs(minutes, limit, onlyWithImages);
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

  /**
   * Lấy danh sách camera đang phát hiện mưa trong N phút gần nhất.
   * Kết quả dùng để hiển thị danh sách và bản đồ cảnh báo.
   */
  const getRainingCameras = useCallback(
    async (minutes = 30) => {
      try {
        setLoading(true);
        setError(null);
        const data = await queryClient.fetchQuery({
          queryKey: ['weather', 'raining-cameras', minutes],
          staleTime: 0,
          queryFn: async () => {
            const response = await apiGetRainingCameras(minutes);
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

  /**
   * Gửi báo cáo mưa thủ công từ user.
   * Lỗi được lưu vào state `error` nhưng không throw để tránh crash UI.
   */
  const reportWeather = useCallback(
    async (data: { cameraId?: string; isRaining: boolean; note?: string }) => {
      try {
        const response = await apiReportWeather(data);
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
