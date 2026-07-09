import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleRegister = async () => {
    setLocalError('');
    clearError();
    const normalizedEmail = email.trim().toLowerCase();

    if (!username.trim()) {
      setLocalError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!normalizedEmail) {
      setLocalError('Vui lòng nhập email');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setLocalError('Email không hợp lệ');
      return;
    }
    if (!password.trim()) {
      setLocalError('Vui lòng nhập mật khẩu');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await register(username.trim(), normalizedEmail, password);
      // useAuth.register() tự auto-login và redirect sang /(tabs)/explore
    } catch {
      // error đã được set trong useAuth
    }
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
        <Animated.View entering={FadeInUp.duration(400)} style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow_back" color="#d4e4fa" size={24} />
          </Pressable>
        </Animated.View>

        {/* Brand Header */}
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={styles.header}>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Tham gia mạng lưới HCMVision</Text>
        </Animated.View>

        {/* Register Card */}
        <Animated.View entering={FadeInUp.duration(700).delay(250)} style={styles.card}>
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
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Icon name="mail" color="#849492" size={20} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email"
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

            {/* Error Banner */}
            {(error || localError) ? (
              <View style={styles.errorBanner}>
                <Icon name="warning" color="#fca5a5" size={16} />
                <Text style={styles.errorText}>{localError || error}</Text>
              </View>
            ) : null}

            {/* Primary CTA */}
            <AnimatedPressable
              style={[styles.registerButton, btnStyle, isLoading && styles.registerButtonDisabled]}
              onPressIn={() => { if (!isLoading) btnScale.value = withSpring(0.95, { damping: 12 }); }}
              onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
              disabled={isLoading}
              onPress={handleRegister}
            >
              {isLoading ? (
                <ActivityIndicator color="#003735" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
              )}
            </AnimatedPressable>
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
    paddingHorizontal: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(25, 30, 40, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#d4e4fa',
    letterSpacing: -0.6,
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
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  form: {
    gap: 16,
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
  registerButton: {
    backgroundColor: '#00f2ea',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000000',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  registerButtonText: {
    color: '#003735',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryText: {
    fontSize: 13,
    color: '#b9cac8',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00f2ea',
  },
});
