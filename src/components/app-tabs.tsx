import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // Extract active route name
  const currentRouteName = state.routes[state.index].name;
  
  return (
    <View style={[styles.tabBarContainer, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        // Determine icon name
        let iconName: IconName = 'map';
        if (route.name === 'explore') iconName = 'map';
        else if (route.name === 'route') iconName = 'directions_car';
        else if (route.name === 'status') iconName = 'videocam';
        else if (route.name === 'warning') iconName = 'notifications';
        else if (route.name === 'more') iconName = 'menu';

        const color = isFocused ? '#00f2ea' : '#849492';

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Icon name={iconName} color={color} size={20} />
            <Text style={[styles.tabLabel, { color }, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Bản đồ',
        }}
      />
      <Tabs.Screen
        name="route"
        options={{
          title: 'Tuyến đường',
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Tình trạng',
        }}
      />
      <Tabs.Screen
        name="warning"
        options={{
          title: 'Cảnh báo',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Thêm',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(5, 20, 36, 0.85)',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 50,
  },
  tabItem: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
