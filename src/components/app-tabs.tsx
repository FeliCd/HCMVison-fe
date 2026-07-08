import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabButton({ route, isFocused, onPress, label }: any) {
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let iconName: IconName = 'map';
  if (route.name === 'route') iconName = 'directions_car';
  else if (route.name === 'system-status') iconName = 'videocam';
  else if (route.name === 'warning') iconName = 'notifications';
  else if (route.name === 'more') iconName = 'menu';

  const color = isFocused ? '#00f2ea' : '#849492';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 12, stiffness: 200 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      style={[styles.tabItem, pressStyle]}
    >
      <Icon name={iconName} color={color} size={21} />
      <Text style={[styles.tabLabel, { color }, isFocused && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.indicatorSlot, isFocused && styles.indicator]} />
    </AnimatedPressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomMargin = insets.bottom > 0 ? insets.bottom : 12;

  return (
    <View style={[styles.tabBarOuter, { bottom: bottomMargin }]}>
      <View style={styles.tabBarGlass} />
      <View style={styles.tabBarContent}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];

          if (options.href === null) {
            return null;
          }

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

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              label={label}
            />
          );
        })}
      </View>
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
      <Tabs.Screen name="explore" options={{ title: 'Bản đồ' }} />
      <Tabs.Screen name="route" options={{ title: 'Tuyến đường' }} />
      <Tabs.Screen name="system-status" options={{ title: 'Camera' }} />
      <Tabs.Screen name="warning" options={{ title: 'Cảnh báo' }} />
      <Tabs.Screen name="more" options={{ title: 'Thêm' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    zIndex: 50,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarGlass: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(25, 30, 40, 0.88)',
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  indicator: {
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#00f2ea',
    marginTop: 3,
  },
  indicatorSlot: {
    width: 20,
    height: 3,
    marginTop: 3,
  },
});
