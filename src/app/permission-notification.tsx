import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icons';
import { syncDeviceTokenAsync } from '@/services/NotificationManager';
import { apiClient } from '@/services/api';
import { AlertSubscription, Ward } from '@/types/api';

const THRESHOLD_OPTIONS = [
  { label: 'Nhẹ', value: 0.5, description: 'Từ 50%' },
  { label: 'Vừa', value: 0.7, description: 'Từ 70%' },
  { label: 'Nặng', value: 0.9, description: 'Từ 90%' },
];

function toArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const value = payload as any;
  if (Array.isArray(value?.data)) {
    return value.data as T[];
  }

  if (Array.isArray(value?.items)) {
    return value.items as T[];
  }

  if (Array.isArray(value?.data?.items)) {
    return value.data.items as T[];
  }

  return [];
}

function getErrorMessage(error: unknown, fallback: string) {
  const responseData = (error as any)?.response?.data;
  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || responseData?.title || (error as Error)?.message || fallback;
}

function getSubscriptionId(subscription: AlertSubscription) {
  return subscription.subscriptionId || (subscription as any).id;
}

export default function PermissionNotificationScreen() {
  const insets = useSafeAreaInsets();
  const [wards, setWards] = useState<Ward[]>([]);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);
  const [thresholdProbability, setThresholdProbability] = useState(0.7);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotificationSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [wardsResponse, subscriptionsResponse] = await Promise.all([
        apiClient.getWards(),
        apiClient.getSubscriptions(),
      ]);

      setWards(toArray<Ward>(wardsResponse.data));
      setSubscriptions(toArray<AlertSubscription>(subscriptionsResponse.data));
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Không tải được cài đặt thông báo.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotificationSettings();
  }, [loadNotificationSettings]);

  const subscribedWardIds = useMemo(
    () => new Set(subscriptions.map((item) => item.wardId).filter(Boolean)),
    [subscriptions]
  );

  const filteredWards = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    const availableWards = wards.filter((ward) => !subscribedWardIds.has(ward.id));

    if (!keyword) {
      return availableWards.slice(0, 30);
    }

    return availableWards
      .filter((ward) =>
        `${ward.name} ${ward.districtName}`.toLowerCase().includes(keyword)
      )
      .slice(0, 30);
  }, [searchText, subscribedWardIds, wards]);

  const selectedWard = useMemo(
    () => wards.find((ward) => ward.id === selectedWardId),
    [selectedWardId, wards]
  );

  const handleSyncPushToken = async () => {
    setIsSyncingPush(true);
    setError(null);
    setMessage(null);

    try {
      const token = await syncDeviceTokenAsync({ requestPermission: true });
      setMessage(
        token
          ? 'Đã bật thông báo cho thiết bị này.'
          : 'Web chỉ dùng để test khu vực. FCM token cần chạy native build trên Android/iOS.'
      );
    } catch (syncError) {
      setError(getErrorMessage(syncError, 'Không bật được thông báo trên thiết bị.'));
    } finally {
      setIsSyncingPush(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedWardId) {
      setError('Vui lòng chọn phường muốn nhận cảnh báo mưa.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      // Native builds also sync the FCM token here. Web can still test subscription API.
      await syncDeviceTokenAsync({ requestPermission: Platform.OS !== 'web' });
      await apiClient.createSubscription({
        wardId: selectedWardId,
        thresholdProbability,
      });

      setMessage(
        `Đã đăng ký cảnh báo mưa cho ${selectedWard?.name || 'khu vực đã chọn'}.`
      );
      setSelectedWardId(null);
      setSearchText('');
      await loadNotificationSettings();
    } catch (createError) {
      setError(getErrorMessage(createError, 'Không đăng ký được khu vực nhận cảnh báo.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async (subscription: AlertSubscription) => {
    const subscriptionId = getSubscriptionId(subscription);
    if (!subscriptionId) {
      setError('Không tìm thấy mã đăng ký để xóa.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await apiClient.deleteSubscription(subscriptionId);
      setMessage(`Đã xóa cảnh báo cho ${subscription.wardName || 'khu vực đã chọn'}.`);
      await loadNotificationSettings();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Không xóa được đăng ký cảnh báo.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Icon name="arrow_back" color="#d4e4fa" size={22} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Cài đặt thông báo</Text>
          <Text style={styles.subtitle}>Chọn phường để nhận cảnh báo khi phát hiện mưa.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="notifications_active" color="#00f2ea" size={22} />
            <Text style={styles.sectionTitle}>Thiết bị nhận thông báo</Text>
          </View>
          <Text style={styles.description}>
            Trên Android/iOS, nút này xin quyền OS và đăng ký native FCM token. Trên web,
            bạn vẫn có thể test luồng đăng ký khu vực.
          </Text>
          <Pressable
            style={[styles.primaryButton, isSyncingPush && styles.disabledButton]}
            disabled={isSyncingPush}
            onPress={handleSyncPushToken}
          >
            {isSyncingPush ? (
              <ActivityIndicator color="#003735" />
            ) : (
              <Text style={styles.primaryButtonText}>Bật / đồng bộ thông báo</Text>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="location_on" color="#00f2ea" size={22} />
            <Text style={styles.sectionTitle}>Khu vực muốn nhận cảnh báo</Text>
          </View>

          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm phường hoặc quận"
            placeholderTextColor="#64748b"
            style={styles.searchInput}
          />

          <View style={styles.thresholdRow}>
            {THRESHOLD_OPTIONS.map((option) => {
              const selected = thresholdProbability === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.thresholdButton, selected && styles.thresholdButtonActive]}
                  onPress={() => setThresholdProbability(option.value)}
                >
                  <Text
                    style={[
                      styles.thresholdLabel,
                      selected && styles.thresholdLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.thresholdDescription}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color="#00f2ea" />
              <Text style={styles.stateText}>Đang tải danh sách phường...</Text>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={styles.wardList}
              contentContainerStyle={styles.wardListContent}
            >
              {filteredWards.map((ward) => {
                const selected = selectedWardId === ward.id;
                return (
                  <Pressable
                    key={ward.id}
                    style={[styles.wardRow, selected && styles.wardRowActive]}
                    onPress={() => setSelectedWardId(ward.id)}
                  >
                    <View style={styles.wardTextWrap}>
                      <Text style={styles.wardName}>{ward.name}</Text>
                      <Text style={styles.wardDistrict}>{ward.districtName}</Text>
                    </View>
                    {selected ? (
                      <Icon name="check_circle" color="#00f2ea" size={22} />
                    ) : null}
                  </Pressable>
                );
              })}

              {filteredWards.length === 0 ? (
                <Text style={styles.emptyText}>Không còn phường phù hợp để đăng ký.</Text>
              ) : null}
            </ScrollView>
          )}

          <Pressable
            style={[
              styles.primaryButton,
              (!selectedWardId || isSaving) && styles.disabledButton,
            ]}
            disabled={!selectedWardId || isSaving}
            onPress={handleCreateSubscription}
          >
            {isSaving ? (
              <ActivityIndicator color="#003735" />
            ) : (
              <Text style={styles.primaryButtonText}>Đăng ký khu vực này</Text>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(200)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="rainy" color="#00f2ea" size={22} />
            <Text style={styles.sectionTitle}>Đang theo dõi</Text>
          </View>

          {subscriptions.length === 0 ? (
            <Text style={styles.emptyText}>Bạn chưa đăng ký khu vực nào.</Text>
          ) : (
            subscriptions.map((subscription) => (
              <View
                key={
                  getSubscriptionId(subscription) ||
                  `${subscription.wardId}-${subscription.createdAt}`
                }
                style={styles.subscriptionRow}
              >
                <View style={styles.wardTextWrap}>
                  <Text style={styles.wardName}>{subscription.wardName || subscription.wardId}</Text>
                  <Text style={styles.wardDistrict}>
                    {subscription.districtName || 'Ngưỡng cảnh báo'} -{' '}
                    {Math.round(subscription.thresholdProbability * 100)}%
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  disabled={isSaving}
                  onPress={() => handleDeleteSubscription(subscription)}
                >
                  <Icon name="close" color="#ffb4ab" size={18} />
                </Pressable>
              </View>
            ))
          )}
        </Animated.View>

        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051424',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 30, 40, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#d4e4fa',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#b9cac8',
    fontSize: 13,
    marginTop: 4,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: 'rgba(25, 30, 40, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: '#b9cac8',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#00f2ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#003735',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  searchInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    color: '#e2e8f0',
    paddingHorizontal: 14,
    fontSize: 14,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thresholdButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    alignItems: 'center',
  },
  thresholdButtonActive: {
    borderColor: '#00f2ea',
    backgroundColor: 'rgba(0, 242, 234, 0.12)',
  },
  thresholdLabel: {
    color: '#b9cac8',
    fontSize: 13,
    fontWeight: '800',
  },
  thresholdLabelActive: {
    color: '#00f2ea',
  },
  thresholdDescription: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  stateText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  wardList: {
    maxHeight: 280,
  },
  wardListContent: {
    gap: 8,
  },
  wardRow: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wardRowActive: {
    borderColor: '#00f2ea',
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
  },
  wardTextWrap: {
    flex: 1,
  },
  wardName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
  },
  wardDistrict: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  subscriptionRow: {
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
  successText: {
    color: '#6ffbbe',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    color: '#ffb4ab',
    fontSize: 13,
    fontWeight: '700',
  },
});
