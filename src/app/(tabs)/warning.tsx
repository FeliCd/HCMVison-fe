import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '@/components/icons';
import { useWeather } from '@/hooks/useWeather';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { router } from 'expo-router';

export default function WarningScreen() {
  const insets = useSafeAreaInsets();
  const { logs, loading, error, getWeatherLogs } = useWeather();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    getWeatherLogs(180, 50);
  }, [getWeatherLogs]);

  // Lọc heavy rain / traffic jam làm cảnh báo
  const urgentItems = logs.filter(
    (l) => l.rainLevel === 'heavy' || l.trafficLevel === 'jam'
  );
  const warningItems = logs.filter(
    (l) => (l.isRaining && l.rainLevel !== 'heavy') || l.trafficLevel === 'slow'
  ).slice(0, 5);



  const formatTime = (timeAgo: string) => timeAgo || 'Vừa xong';

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <Animated.Text entering={FadeInUp.duration(500)} style={styles.headerTitle}>Cảnh báo</Animated.Text>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>

        {!isAuthenticated ? (
          <Animated.View entering={FadeInUp.duration(500)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 }}>
            <Icon name="warning" size={80} color={colors.textMuted} />
            <Text style={{ marginTop: 24, marginBottom: 12, textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.text }}>
              Bạn chưa đăng nhập
            </Text>
            <Text style={{ textAlign: 'center', marginBottom: 32, fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
              Đăng nhập để xem các cảnh báo giao thông và thời tiết quan trọng xung quanh bạn.
            </Text>
            <Pressable 
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' }} 
              onPress={() => router.push('/login')}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff', textAlign: 'center' }}>Đăng nhập</Text>
            </Pressable>
          </Animated.View>
        ) : loading && logs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#ffb4ab" />
            <Text style={styles.loadingText}>Đang tải cảnh báo...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Icon name="warning" color="#fca5a5" size={20} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : urgentItems.length === 0 && warningItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="check_circle" color="#22c55e" size={48} />
            <Text style={styles.emptyTitle}>Không có cảnh báo</Text>
            <Text style={styles.emptyDesc}>Tình trạng giao thông và thời tiết bình thường trong 3 giờ qua.</Text>
          </View>
        ) : (
          <>
            {/* Urgent warnings (heavy rain / jam) */}
            {urgentItems.slice(0, 3).map((item, idx) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.duration(700).delay(100 + idx * 80)}
                style={styles.urgentCard}
              >
                <View style={styles.urgentHeader}>
                  <View style={styles.urgentIconContainer}>
                    <Icon name={item.trafficLevel === 'jam' ? 'traffic' : 'rainy'} color="#ffdad6" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.urgentTitle}>
                      {item.trafficLevel === 'jam' ? 'Kẹt xe nghiêm trọng' : 'Mưa lớn / Ngập'}
                    </Text>
                    <Text style={styles.urgentTime}>
                      {formatTime(item.timeAgo)} • Mức độ: Nghiêm trọng
                    </Text>
                  </View>
                </View>
                <Text style={styles.urgentDesc}>
                  {item.aiReason || `Phát hiện tại camera ${item.cameraName || item.cameraId}. Mưa: ${item.rainLevel || 'N/A'} • Giao thông: ${item.trafficLevel}.`}
                </Text>
                <View style={styles.urgentMeta}>
                  <Icon name="location_on" color="#ffb4ab" size={14} />
                  <Text style={styles.urgentMetaText}>{item.cameraName || item.cameraId}</Text>
                  {item.wardName && <Text style={styles.urgentMetaText}>• {item.wardName}</Text>}
                </View>
              </Animated.View>
            ))}

            {warningItems.length > 0 && (
              <Animated.Text
                entering={FadeInUp.duration(500).delay(250)}
                style={styles.sectionTitle}
              >
                Các cảnh báo khác
              </Animated.Text>
            )}

            {warningItems.map((item, idx) => (
              <Animated.View key={item.id} entering={FadeInUp.duration(600).delay(350 + idx * 80)}>
                <Pressable
                  style={[
                    styles.warningCard,
                    item.isRaining ? styles.warningCardAmber : styles.warningCardRed,
                  ]}
                >
                  <View style={styles.warningCardHeader}>
                    <View style={[
                      styles.warningIconContainer,
                      item.isRaining
                        ? { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.2)' }
                        : { backgroundColor: 'rgba(255, 180, 171, 0.12)', borderColor: 'rgba(255, 180, 171, 0.2)' }
                    ]}>
                      <Icon
                        name={item.isRaining ? 'rainy' : 'traffic'}
                        color={item.isRaining ? '#f59e0b' : '#ffb4ab'}
                        size={18}
                      />
                    </View>
                    <View style={styles.warningCardTextContainer}>
                      <Text style={item.isRaining ? styles.warningCardTitleAmber : styles.warningCardTitle}>
                        {item.isRaining ? `Mưa ${item.rainLevel || ''}` : `Ùn tắc ${item.trafficLevel}`}
                      </Text>
                      <Text style={styles.warningCardTime}>{formatTime(item.timeAgo)}</Text>
                    </View>
                  </View>
                  <Text style={styles.warningCardDesc}>
                    {item.aiReason || `Camera ${item.cameraName || item.cameraId}${item.wardName ? ` — ${item.wardName}` : ''}.`}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#051424', paddingHorizontal: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#d4e4fa', marginBottom: 20, letterSpacing: -0.6 },
  content: { flex: 1 },
  loadingBox: { paddingTop: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: '#64748b', fontSize: 14 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', padding: 16, borderRadius: 12 },
  errorText: { flex: 1, color: '#fca5a5', fontSize: 13 },
  emptyBox: { paddingTop: 60, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#22c55e' },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#b9cac8', marginBottom: 14, letterSpacing: 0.2 },
  urgentCard: {
    backgroundColor: 'rgba(147, 0, 10, 0.35)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.25)',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  urgentHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  urgentIconContainer: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: 'rgba(255, 180, 171, 0.22)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  urgentTitle: { fontSize: 17, fontWeight: '800', color: '#ffdad6' },
  urgentTime: { fontSize: 12, color: '#ffb4ab', marginTop: 4, fontWeight: '500' },
  urgentDesc: { fontSize: 14, lineHeight: 22, color: '#ffdad6' },
  urgentMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  urgentMetaText: { fontSize: 12, color: '#ffb4ab' },
  warningCard: {
    backgroundColor: 'rgba(25, 30, 40, 0.55)',
    borderRadius: 18, padding: 16, borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  warningCardRed: { borderColor: 'rgba(255, 180, 171, 0.25)' },
  warningCardAmber: { borderColor: 'rgba(245, 158, 11, 0.25)' },
  warningCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  warningIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  warningCardTextContainer: { flex: 1 },
  warningCardTitle: { fontSize: 16, fontWeight: '700', color: '#ffb4ab' },
  warningCardTitleAmber: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  warningCardTime: { fontSize: 12, color: '#b9cac8', marginTop: 2 },
  warningCardDesc: { fontSize: 14, color: '#d4e4fa', lineHeight: 22 },
});
