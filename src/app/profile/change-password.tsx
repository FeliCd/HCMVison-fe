import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/icons';
import apiClient from '@/services/api';
import { useTheme } from '@/hooks/useTheme';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const handleSave = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu mới không khớp');
      return;
    }

    setLoading(true);
    try {
      await apiClient.changePassword(oldPassword, newPassword);
      setSuccessMsg('Đổi mật khẩu thành công');
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    headerTitle: { color: colors.text },
    label: { color: colors.textMuted },
    input: { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
    btnText: { color: '#ffffff' },
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, dynamicStyles.container]}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow_back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg ? (
           <View style={[styles.msgBox, { backgroundColor: colors.dangerMuted }]}>
             <Text style={{ color: colors.danger }}>{errorMsg}</Text>
           </View>
        ) : null}
        {successMsg ? (
           <View style={[styles.msgBox, { backgroundColor: colors.successMuted }]}>
             <Text style={{ color: colors.success }}>{successMsg}</Text>
           </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Mật khẩu hiện tại</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Nhập mật khẩu cũ"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showOldPass}
            />
            <Pressable style={styles.eyeIcon} onPress={() => setShowOldPass(!showOldPass)}>
              <Icon name={showOldPass ? 'visibility' : 'visibility_off'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Mật khẩu mới</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nhập mật khẩu mới"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showNewPass}
            />
            <Pressable style={styles.eyeIcon} onPress={() => setShowNewPass(!showNewPass)}>
              <Icon name={showNewPass ? 'visibility' : 'visibility_off'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Xác nhận mật khẩu mới</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showConfirmPass}
            />
            <Pressable style={styles.eyeIcon} onPress={() => setShowConfirmPass(!showConfirmPass)}>
              <Icon name={showConfirmPass ? 'visibility' : 'visibility_off'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <Pressable style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.submitButtonText, dynamicStyles.btnText]}>Cập nhật mật khẩu</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    borderWidth: 1,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  msgBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  }
});
