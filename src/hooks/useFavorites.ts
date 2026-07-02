import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { Favorite } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: favorites = [], isLoading: loading, refetch } = useQuery<Favorite[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user) return [];
      const response = await apiClient.getFavorites();
      return response.data.items ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const favoriteIds = useMemo(() => {
    return new Set(favorites.map((f) => f.cameraId));
  }, [favorites]);

  const loadFavorites = useCallback(async () => {
    if (!user) return [];
    const response = await queryClient.fetchQuery({
      queryKey: ['favorites'],
      queryFn: async () => {
        const response = await apiClient.getFavorites();
        return response.data.items ?? [];
      },
    });
    return response;
  }, [user, queryClient]);

  const toggleFavorite = useCallback(
    async (camera: any) => {
      if (!user) return;
      const cameraId = camera.id || camera.cameraId;
      setTogglingId(cameraId);
      try {
        const isFav = favoriteIds.has(cameraId);
        if (isFav) {
          await apiClient.removeFavorite(cameraId);
          // Optimistically update
          queryClient.setQueryData(['favorites'], (old: Favorite[] | undefined) => {
            return old ? old.filter((f) => f.cameraId !== cameraId) : [];
          });
        } else {
          await apiClient.addFavorite(cameraId);
          // Optimistically update
          queryClient.setQueryData(['favorites'], (old: Favorite[] | undefined) => {
            const newItem: Favorite = {
              cameraId,
              camera: camera,
              createdAt: new Date().toISOString(),
            };
            return old ? [...old, newItem] : [newItem];
          });
        }
        // Invalidate to be sure
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
      } catch (error) {
        console.warn('Failed to toggle favorite:', error);
      } finally {
        setTogglingId(null);
      }
    },
    [user, favoriteIds, queryClient]
  );

  return {
    favorites,
    favoriteIds,
    loading,
    togglingId,
    loadFavorites,
    toggleFavorite,
    refetch,
  };
};
