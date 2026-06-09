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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSendReset = () => {
    // In a real app, this would call the API.
    // For now, we'll simulate success.
    setIsSent(true);
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
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email để nhận liên kết khôi phục</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.cardTopAccent} />
          
          {isSent ? (
            <View style={styles.successState}>
              <Icon name="check_circle" color="#00f2ea" size={64} />
              <Text style={styles.successTitle}>Đã gửi liên kết</Text>
              <Text style={styles.successText}>
                Kiểm tra hòm thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
              </Text>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.replace('/login')}
              >
                <Text style={styles.actionButtonText}>Quay lại Đăng nhập</Text>
              </Pressable>
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

              {/* Primary CTA */}
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed
                ]}
                onPress={handleSendReset}
              >
                <Text style={styles.actionButtonText}>Gửi yêu cầu</Text>
              </Pressable>
            </View>
          )}

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
    textAlign: 'center',
    paddingHorizontal: 16,
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
  actionButton: {
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
  actionButtonPressed: {
    opacity: 0.8,
    transform: [{ translateY: 2 }],
    shadowOpacity: 0.1,
  },
  actionButtonText: {
    color: '#003735',
    fontSize: 16,
    fontWeight: '600',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4e4fa',
  },
  successText: {
    fontSize: 14,
    color: '#b9cac8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});
