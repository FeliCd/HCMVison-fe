import { useState } from 'react';
import { apiClient } from '@/services/api';
import { Camera, CameraListResponse } from '@/types/api';

export const useCamera = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const getCameras = async (search?: string, page = 1, pageSize = 10, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCameras(search, undefined, page, pageSize);
      const data = response.data as CameraListResponse;
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
  };

  const createCamera = async (data: Parameters<typeof apiClient.createCamera>[0]) => {
    setLoading(true);
    try {
      const response = await apiClient.createCamera(data);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tạo camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCamera = async (id: string, data: Parameters<typeof apiClient.updateCamera>[1]) => {
    setLoading(true);
    try {
      const response = await apiClient.updateCamera(id, data);
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
      await apiClient.deleteCamera(id);
      setCameras((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể xoá camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cameras, loading, error, totalPages, total, getCameras, createCamera, updateCamera, deleteCamera };
};
