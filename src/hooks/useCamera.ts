import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Camera, CameraListResponse } from '@/types/api';

export const useCamera = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read cameras list from React Query cache
  const { data: cachedCameras = [] } = useQuery<Camera[]>({
    queryKey: ['cameras', 'list'],
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: 30_000,
  });

  const getCameras = useCallback(async (search?: string, page = 1, pageSize = 10, append = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getCameras(search, undefined, page, pageSize);
      const data = response.data;
      
      queryClient.setQueryData(['cameras', 'list'], (prev: Camera[] | undefined) => {
        if (append && prev) {
          return [...prev, ...data.data];
        }
        return data.data;
      });

      return {
        ...data,
        totalPages: Math.ceil(data.total / data.pageSize) || 1
      };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể tải danh sách camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  const createCamera = async (data: Parameters<typeof apiClient.createCamera>[0]) => {
    setLoading(true);
    try {
      const response = await apiClient.createCamera(data);
      queryClient.invalidateQueries({ queryKey: ['cameras', 'list'] });
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
      queryClient.invalidateQueries({ queryKey: ['cameras', 'list'] });
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
      queryClient.setQueryData(['cameras', 'list'], (prev: Camera[] | undefined) => {
        return prev ? prev.filter((c) => c.id !== id) : [];
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Không thể xoá camera';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    cameras: cachedCameras, 
    loading, 
    error, 
    totalPages: 1, 
    total: cachedCameras.length, 
    getCameras, 
    createCamera, 
    updateCamera, 
    deleteCamera 
  };
};


