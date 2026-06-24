import { resetPassword } from '@/services/auth';
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initialToken = params.token as string || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleReset = async () => {
    setErrorMsg('');
    if (!token.trim()) return setErrorMsg('Vui lòng nhập mã khôi phục (Token)');
    if (!newPassword.trim()) return setErrorMsg('Vui lòng nhập mật khẩu mới');
    if (newPassword !== confirmPassword) return setErrorMsg('Mật khẩu xác nhận không khớp');

    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(500)}>
          <View style={styles.iconContainer}>
            <Icon name="lock" size={40} color="#00f2ea" />
          </View>
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>
            Nhập mã khôi phục bạn nhận được qua email và thiết lập mật khẩu mới cho tài khoản của bạn.
          </Text>
        </Animated.View>

        {success ? (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.successBox}>
            <View style={styles.successIcon}>
              <Icon name="check_circle" color="#00f2ea" size={32} />
            </View>
            <Text style={styles.successTitle}>Đổi mật khẩu thành công!</Text>
            <Text style={styles.successText}>Bạn đã có thể đăng nhập bằng mật khẩu mới.</Text>
            
            <Pressable style={styles.loginBtn} onPress={() => router.replace('/login')}>
              <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.form}>
            <View style={styles.inputGroup}>
              <Icon name="lock_outline" color="#849492" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mã khôi phục (Token)"
                placeholderTextColor="#849492"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Icon name="lock_outline" color="#849492" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu mới"
                placeholderTextColor="#849492"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Icon name={showPassword ? 'visibility' : 'visibility_off'} color="#849492" size={20} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Icon name="lock_outline" color="#849492" size={20} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor="#849492"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Icon name="warning" color="#fca5a5" size={16} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <AnimatedPressable
              style={[styles.submitBtn, btnStyle, loading && styles.submitBtnDisabled]}
              onPressIn={() => { if(!loading) btnScale.value = withSpring(0.95); }}
              onPressOut={() => { btnScale.value = withSpring(1); }}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#003735" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận đổi mật khẩu</Text>
              )}
            </AnimatedPressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424' },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  iconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.2)' },
  title: { fontSize: 28, fontWeight: '800', color: '#d4e4fa', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#849492', lineHeight: 22, marginBottom: 32 },
  form: { gap: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, height: 56 },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, height: '100%', color: '#d4e4fa', fontSize: 15 },
  eyeButton: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { color: '#fca5a5', fontSize: 13, flex: 1 },
  submitBtn: { backgroundColor: '#00f2ea', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
  successBox: { alignItems: 'center', paddingTop: 20 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#00f2ea', marginBottom: 8 },
  successText: { fontSize: 15, color: '#b9cac8', textAlign: 'center', marginBottom: 32 },
  loginBtn: { backgroundColor: '#00f2ea', width: '100%', height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#003735', fontSize: 16, fontWeight: '700' },
});
