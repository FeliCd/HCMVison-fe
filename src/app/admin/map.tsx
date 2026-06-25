import { View } from 'react-native';

import PublicMapScreen from '@/app/(tabs)/explore';
import { AdminBottomBar } from '@/components/admin-bottom-bar';

export default function AdminMapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <PublicMapScreen />
      <AdminBottomBar active="map" />
    </View>
  );
}
