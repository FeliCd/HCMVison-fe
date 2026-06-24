import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(tabs)/explore');
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#00f2ea" />
      <Text style={styles.text}>Đang mở bản đồ...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#051424',
    gap: 12,
  },
  text: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
