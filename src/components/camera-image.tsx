import React, { ReactNode, useEffect, useState } from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';

import { CameraImageSources } from '@/utils/camera-weather';

interface CameraImageProps {
  sources: CameraImageSources;
  style: StyleProp<ImageStyle>;
  fallback: ReactNode;
  accessibilityLabel: string;
  refreshKey: number;
}

export function CameraImage({ sources, style, fallback, accessibilityLabel, refreshKey }: CameraImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [refreshKey, sources.weatherImageUrl]);

  if (!sources.weatherImageUrl || hasFailed) {
    return <>{fallback}</>;
  }

  return (
    <Image
      key={`weather:${sources.weatherImageUrl}:${refreshKey}`}
      source={{ uri: sources.weatherImageUrl }}
      style={style}
      contentFit="cover"
      cachePolicy="none"
      recyclingKey={`weather:${sources.weatherImageUrl}:${refreshKey}`}
      transition={180}
      accessibilityLabel={accessibilityLabel}
      onError={() => {
        setHasFailed(true);
      }}
    />
  );
}
