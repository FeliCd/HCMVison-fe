import React from 'react';
import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps } from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { useWindowDimensions, View, Pressable, StyleSheet } from 'react-native';

import { Icon, IconName } from '@/components/icons';
import { ThemedText } from './themed-text';

// Desktop Top Navigation Tab Button
function DesktopTabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.desktopTabBtn, isFocused && styles.desktopTabBtnActive]}>
        <ThemedText
          type="smallBold"
          style={[styles.desktopTabText, isFocused && styles.desktopTabTextActive]}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

// Mobile Bottom Navigation Tab Button
interface MobileTabButtonProps extends TabTriggerSlotProps {
  icon: IconName;
}

function MobileTabButton({ children, isFocused, icon, ...props }: MobileTabButtonProps) {
  const color = isFocused ? '#00f2ea' : '#849492';
  return (
    <Pressable {...props} style={styles.mobileTabBtn}>
      <Icon name={icon} color={color} size={20} />
      <ThemedText
        type="small"
        style={[styles.mobileTabText, { color }, isFocused && styles.mobileTabTextActive]}
      >
        {children}
      </ThemedText>
    </Pressable>
  );
}

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isDesktop = width >= 768;

  return (
    <Tabs>
      {isDesktop ? <TabSlot style={styles.slotDesktop} /> : <TabSlot style={styles.slotMobile} />}
      
      <TabList style={[
        isDesktop ? styles.topNavbar : styles.bottomTabBar,
        pathname === '/' && { display: 'none' }
      ]}>
        {isDesktop && (
          <View style={styles.logoSection}>
            <Icon name="my_location" color="#00f2ea" size={20} />
            <ThemedText type="subtitle" style={styles.brandText}>
              HCMVision
            </ThemedText>
          </View>
        )}

        <TabTrigger name="explore" href="/(tabs)/explore" asChild>
          {isDesktop ? <DesktopTabButton>Bản đồ</DesktopTabButton> : <MobileTabButton icon="map">Bản đồ</MobileTabButton>}
        </TabTrigger>

        <TabTrigger name="route" href="/(tabs)/route" asChild>
          {isDesktop ? <DesktopTabButton>Tuyến đường</DesktopTabButton> : <MobileTabButton icon="directions_car">Tuyến đường</MobileTabButton>}
        </TabTrigger>

        <TabTrigger name="system-status" href="/(tabs)/system-status" asChild>
          {isDesktop ? <DesktopTabButton>Tình trạng</DesktopTabButton> : <MobileTabButton icon="videocam">Tình trạng</MobileTabButton>}
        </TabTrigger>

        <TabTrigger name="warning" href="/(tabs)/warning" asChild>
          {isDesktop ? <DesktopTabButton>Cảnh báo</DesktopTabButton> : <MobileTabButton icon="notifications">Cảnh báo</MobileTabButton>}
        </TabTrigger>

        <TabTrigger name="more" href="/(tabs)/more" asChild>
          {isDesktop ? <DesktopTabButton>Thêm</DesktopTabButton> : <MobileTabButton icon="menu">Thêm</MobileTabButton>}
        </TabTrigger>

        {isDesktop && (
          <Pressable style={styles.profileBtn}>
            <Icon name="account_circle" color="#b9cac8" size={24} />
          </Pressable>
        )}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  // Desktop Top Navbar styles
  topNavbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: 'rgba(25, 30, 40, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 50,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 'auto',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00f2ea',
    letterSpacing: -0.2,
  },
  desktopTriggers: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  desktopTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  desktopTabBtnActive: {
    backgroundColor: 'rgba(0, 242, 234, 0.15)',
  },
  desktopTabText: {
    fontSize: 14,
    color: '#b9cac8',
  },
  desktopTabTextActive: {
    color: '#00f2ea',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(39, 54, 71, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  slotDesktop: {
    height: '100%',
    paddingTop: 56,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: 'rgba(25, 30, 40, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  mobileTabBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobileTabText: {
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },
  mobileTabTextActive: {
    fontWeight: '800',
  },
  slotMobile: {
    height: '100%',
    paddingBottom: 76,
  },
});
