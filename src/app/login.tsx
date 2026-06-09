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
import { Icon } from '@/components/icons';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="location_on" color="#00f2ea" size={32} />
          </View>
          <Text style={styles.title}>
            HCMRain<Text style={styles.titleHighlight}>Vision</Text>
          </Text>
          <Text style={styles.subtitle}>Nền tảng di chuyển thông minh TP.HCM</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Subtle top border gradient replacement */}
          <View style={styles.cardTopAccent} />
          
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
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.loginButtonPressed
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </Pressable>
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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Nguồn ảnh: Cổng thông tin giao thông TP.HCM</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424', // Base background color
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
    borderRadius: 16,
    backgroundColor: '#273647',
    borderWidth: 1,
    borderColor: 'rgba(58, 74, 72, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#d4e4fa',
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: '#00f2ea',
  },
  subtitle: {
    fontSize: 14,
    color: '#b9cac8',
    marginTop: 8,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(22, 37, 41, 0.85)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00f2ea',
    opacity: 0.5,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 11,
    fontWeight: '500',
    color: '#29fcf3',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 37, 41, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 48,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#d4e4fa',
    fontSize: 14,
    paddingRight: 12,
  },
  passwordToggle: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#00f2ea',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00f2ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#003735',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#b9cac8',
  },
  signupLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#29fcf3',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    opacity: 0.3,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#b9cac8',
  },
  dividerText: {
    fontSize: 11,
    color: '#b9cac8',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d4e4fa',
  },
  footer: {
    marginTop: 40,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 11,
    color: '#b9cac8',
    textAlign: 'center',
  },
});
