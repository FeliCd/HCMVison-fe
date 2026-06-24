import { forgotPassword } from '@/services/auth';
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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInUp,
  BounceIn,
} from 'react-native-reanimated';
import { Icon } from '@/components/icons';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleSendReset = async () => {
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email.trim());
      setIsSent(true);
    } catch (err: any) {
      const responseData = err.response?.data;
      let msg: string;
      if (typeof responseData === 'string') {
        msg = responseData;
      } else if (responseData?.message) {
        msg = responseData.message;
      } else {
        msg = 'Không thể gửi yêu cầu. Vui lòng kiểm tra lại email.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
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
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận liên kết khôi phục</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInUp.duration(700).delay(250)} style={styles.card}>
          
          {isSent ? (
            <View style={styles.successState}>
              <Animated.View entering={BounceIn.duration(600)}>
                <View style={styles.successIconContainer}>
                  <Icon name="check_circle" color="#00f2ea" size={56} />
                </View>
              </Animated.View>
              <Animated.Text entering={FadeInUp.delay(300)} style={styles.successTitle}>Đã gửi liên kết</Animated.Text>
              <Animated.Text entering={FadeInUp.delay(450)} style={styles.successText}>
                Kiểm tra hòm thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
              </Animated.Text>
              <AnimatedPressable
                entering={FadeInUp.delay(600)}
                style={[styles.actionButton, btnStyle]}
                onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
                onPress={() => router.push('/reset-password' as any)}
              >
                <Text style={styles.actionButtonText}>Đã có mã? Đặt lại mật khẩu</Text>
              </AnimatedPressable>
              
              <AnimatedPressable
                entering={FadeInUp.delay(700)}
                style={[styles.actionButton, btnStyle, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#00f2ea', marginTop: 12 }]}
                onPressIn={() => { btnScale.value = withSpring(0.95, { damping: 12 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
                onPress={() => router.replace('/login')}
              >
                <Text style={[styles.actionButtonText, { color: '#00f2ea' }]}>Quay lại Đăng nhập</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email của bạn</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Icon name="mail" color="#849492" size={20} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email đã đăng ký"
                    placeholderTextColor="#b9cac8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Error Banner */}
              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <Icon name="warning" color="#fca5a5" size={16} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Primary CTA */}
              <AnimatedPressable
                style={[styles.actionButton, btnStyle, isLoading && styles.actionButtonDisabled]}
                onPressIn={() => { if (!isLoading) btnScale.value = withSpring(0.95, { damping: 12 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
                onPress={handleSendReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#003735" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Gửi yêu cầu</Text>
                )}
              </AnimatedPressable>
            </View>
          )}

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
    textAlign: 'center',
    paddingHorizontal: 16,
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
  actionButton: {
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
  actionButtonText: {
    color: '#003735',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonDisabled: {
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
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 16,
  },
  successIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 242, 234, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d4e4fa',
  },
  successText: {
    fontSize: 13,
    color: '#b9cac8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
});
