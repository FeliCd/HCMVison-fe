import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';

export default function HeatmapView({ heatmapData, mapRegion }: any) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={mapRegion}
      provider={PROVIDER_GOOGLE}
      userInterfaceStyle="dark"
    >
      {heatmapData && heatmapData.points && heatmapData.points.length > 0 && (
        <Heatmap
          points={heatmapData.points.map((p: any) => ({
            latitude: p.lat,
            longitude: p.lng,
            weight: p.intensity
          }))}
          radius={40}
          opacity={0.7}
          gradient={{
            colors: ["#00000000", "#3b82f6", "#eab308", "#ef4444"],
            startPoints: [0, 0.25, 0.5, 1],
            colorMapSize: 256
          }}
        />
      )}
    </MapView>
  );
}
