import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import { Icon } from '@/components/icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleLogin = () => {
    // Navigate to the main app (map) after "login"
    router.replace('/(tabs)/explore');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContainer, 
          { paddingTop: Math.max(insets.top, 40), paddingBottom: Math.max(insets.bottom, 40) }
        ]}
      >
        
        {/* Brand Header */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="location_on" color="#00f2ea" size={32} />
          </View>
          <Text style={styles.title}>
            HCMRain<Text style={styles.titleHighlight}>Vision</Text>
          </Text>
          <Text style={styles.subtitle}>Nền tảng di chuyển thông minh TP.HCM</Text>
        </Animated.View>

        {/* Login Card */}
        <Animated.View entering={FadeInUp.duration(700).delay(300)} style={styles.card}>
          <View style={styles.form}>
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Icon name="person" color="#849492" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#b9cac8"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <Link href="/forgot-password" asChild>
                  <Pressable>
                    <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
                  </Pressable>
                </Link>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Icon name="lock" color="#849492" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#b9cac8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility_off'}
                    color="#849492"
                    size={20}
                  />
                </Pressable>
              </View>
            </View>

            {/* Primary CTA */}
            <AnimatedPressable
              style={[styles.loginButton, btnStyle]}
              onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12 }); }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </AnimatedPressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <View style={styles.signupRow}>
              <Text style={styles.secondaryText}>Chưa có tài khoản?</Text>
              <Link href="/register" asChild>
                <Pressable>
                  <Text style={styles.signupLink}>Tạo tài khoản</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Link href="/(tabs)/explore" asChild>
              <Pressable style={styles.guestButton}>
                <Icon name="map" color="#849492" size={20} />
                <Text style={styles.guestButtonText}>Xem bản đồ không cần đăng nhập</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.footer}>
          <Text style={styles.footerText}>Nguồn ảnh: Cổng thông tin giao thông TP.HCM</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#d4e4fa',
    letterSpacing: -0.6,
  },
  titleHighlight: {
    color: '#00f2ea',
  },
  subtitle: {
    fontSize: 13,
    color: '#b9cac8',
    marginTop: 8,
    opacity: 0.9,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b9cac8',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f2ea',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 20, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    height: 52,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#d4e4fa',
    fontSize: 15,
    paddingRight: 12,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#00f2ea',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonText: {
    color: '#003735',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryText: {
    fontSize: 13,
    color: '#b9cac8',
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00f2ea',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    opacity: 0.25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#b9cac8',
  },
  dividerText: {
    fontSize: 10,
    color: '#b9cac8',
    letterSpacing: 1,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4e4fa',
  },
  footer: {
    marginTop: 32,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 10,
    color: '#b9cac8',
    textAlign: 'center',
  },
});
