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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
    // Navigate back to login or straight to explore after register
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
          { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 40) }
        ]}
      >
        
        {/* Top bar with back button */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow_back" color="#d4e4fa" size={24} />
          </Pressable>
        </View>

        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Tham gia Mạng lưới HCMRainVision</Text>
        </View>

        {/* Register Card */}
        <View style={styles.card}>
          <View style={styles.cardTopAccent} />
          
          <View style={styles.form}>
            {/* Username Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập</Text>
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

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email (Tùy chọn)</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Icon name="mail" color="#849492" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email để nhận cảnh báo"
                  placeholderTextColor="#b9cac8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
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

            {/* Confirm Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Icon name="lock" color="#849492" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#b9cac8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Primary CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.registerButtonPressed
              ]}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <View style={styles.loginRow}>
              <Text style={styles.secondaryText}>Đã có tài khoản?</Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

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
    paddingHorizontal: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(22, 37, 41, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#d4e4fa',
    letterSpacing: -0.5,
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
    alignSelf: 'center',
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
    gap: 20,
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
  registerButton: {
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
  registerButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: '#003735',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secondaryText: {
    fontSize: 14,
    color: '#b9cac8',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#29fcf3',
  },
});
