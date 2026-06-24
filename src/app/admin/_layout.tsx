import { Stack } from 'expo-router';

import { RequireAdmin } from '@/components/route-guards';

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <Stack screenOptions={{ headerShown: false }} />
    </RequireAdmin>
  );
}
