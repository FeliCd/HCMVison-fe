import { getCameras as apiGetCameras, getCameraStatus as apiGetCameraStatus, createCamera as apiCreateCamera, updateCamera as apiUpdateCamera, deleteCamera as apiDeleteCamera } from '@/services/camera';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Camera, CameraListResponse, CameraStatusItem, CameraStatusQuery, CameraStatusResponse } from '@/types/api';

export const useCamera = () => {
  const queryClient = useQueryClient();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cameraStatusItems, setCameraStatusItems] = useState<CameraStatusItem[]>([]);
  const [cameraStatusTotal, setCameraStatusTotal] = useState(0);

  const getCameras = useCallback(async (search?: string, page = 1, pageSize = 10, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await queryClient.fetchQuery({
        queryKey: ['cameras', search || '', page, pageSize],
        staleTime: 0,
        queryFn: async () => {
          const response = await apiGetCameras(search, undefined, page, pageSize);
          return response.data as CameraListResponse;
        },
      });
      const computedTotalPages = Math.ceil(data.total / data.pageSize) || 1;
      setCameras(append ? (prev) => [...prev, ...data.data] : data.data);
      setTotalPages(computedTotalPages);
      setTotal(data.total);
      return { ...data, totalPages: computedTotalPages };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải danh sách camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const getCameraStatus = useCallback(async (query: CameraStatusQuery = {}, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const wardId = query.wardId?.trim();
      const districtName = query.districtName?.trim();
      const normalizedQuery: CameraStatusQuery = {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        rain: query.rain ?? 'all',
        traffic: query.traffic ?? 'all',
        favoriteOnly: query.favoriteOnly ?? false,
        ...(wardId ? { wardId } : {}),
        ...(districtName ? { districtName } : {}),
      };
      const data = await queryClient.fetchQuery({
        queryKey: ['camera-status', normalizedQuery],
        staleTime: 0,
        queryFn: async () => {
          const response = await apiGetCameraStatus(normalizedQuery);
          return response.data as CameraStatusResponse;
        },
      });
      setCameraStatusItems(append ? (prev) => [...prev, ...data.data] : data.data);
      setCameraStatusTotal(data.total);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải trạng thái camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const createCamera = async (data: Parameters<typeof apiCreateCamera>[0]) => {
    setLoading(true);
    try {
      const response = await apiCreateCamera(data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tạo camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCamera = async (id: string, data: Parameters<typeof apiUpdateCamera>[1]) => {
    setLoading(true);
    try {
      const response = await apiUpdateCamera(id, data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể cập nhật camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCamera = async (id: string) => {
    setLoading(true);
    try {
      await apiDeleteCamera(id);
      setCameras((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể xoá camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cameras,
    cameraStatusItems,
    cameraStatusTotal,
    loading,
    error,
    totalPages,
    total,
    getCameras,
    getCameraStatus,
    createCamera,
    updateCamera,
    deleteCamera,
  };
};

