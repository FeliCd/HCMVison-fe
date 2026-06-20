import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import CameraDetailContent from '@/components/camera-detail-content';

export default function CameraDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  if (!id) return null;

  return (
    <CameraDetailContent
      id={id}
      name={name}
      onClose={() => router.back()}
    />
  );
}
