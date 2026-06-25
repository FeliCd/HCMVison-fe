import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';

type AdminSection = 'dashboard' | 'map' | 'cameras' | 'settings';

interface AdminBottomBarProps {
  active: AdminSection;
}

const items: { key: AdminSection; label: string; icon: IconName; href: string }[] = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'grid_view', href: '/admin' },
  { key: 'map', label: 'Bản đồ', icon: 'map', href: '/admin/map' },
  { key: 'cameras', label: 'Camera', icon: 'videocam', href: '/admin/manage-cameras' },
  { key: 'settings', label: 'Cài đặt', icon: 'admin_panel_settings', href: '/admin/settings' },
];

export function AdminBottomBar({ active }: AdminBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {items.map((item) => {
        const isActive = item.key === active;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => {
              if (!isActive) {
                router.replace(item.href as never);
              }
            }}
          >
            <Icon name={item.icon} color={isActive ? '#34d399' : '#849492'} size={22} />
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  label: {
    fontSize: 10,
    color: '#849492',
    fontWeight: '600',
  },
  labelActive: {
    color: '#34d399',
    fontWeight: '700',
  },
});
