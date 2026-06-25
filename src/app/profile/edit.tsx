import { updateProfile } from '@/services/auth';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Icon } from '@/components/icons';
import { useAuth } from '@/hooks/useAuth';

import { useTheme } from '@/hooks/useTheme';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, loadUser } = useAuth();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await updateProfile({ fullName, phoneNumber });
      await loadUser(); // reload user data in context
      setSuccessMsg('Cập nhật thông tin thành công');
      setTimeout(() => router.back(), 1500);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg('Đã có lỗi xảy ra. Vui lòng thử lại.');
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
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Chỉnh sửa thông tin</Text>
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
          <Text style={[styles.label, dynamicStyles.label]}>Họ và tên</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ tên của bạn"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, dynamicStyles.label]}>Số điện thoại</Text>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>

        <Pressable style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.submitButtonText, dynamicStyles.btnText]}>Lưu thay đổi</Text>
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
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 16,
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
