import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, ImageBackground, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/icons';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import apiClient from '@/services/api';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  
  // States for real data
  const [isLoading, setIsLoading] = useState(true);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [weatherLogs, setWeatherLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Fetch health summary
      const healthRes = await apiClient.checkCameraHealth().catch(() => null);
      if (healthRes?.data?.summary) {
        setHealthSummary(healthRes.data.summary);
      } else if (healthRes?.data?.Summary) {
        setHealthSummary(healthRes.data.Summary);
      }

      // Fetch recent weather/AI logs
      const weatherRes = await apiClient.getWeatherLogs(180, 10).catch(() => null);
      if (weatherRes?.data) {
        const wLogs = Array.isArray(weatherRes.data) ? weatherRes.data : (weatherRes.data.logs || weatherRes.data.data || weatherRes.data.Results || []);
        setWeatherLogs(Array.isArray(wLogs) ? wLogs : []);
      }

      // Fetch audit logs / recent activities
      const auditRes = await apiClient.getAuditData().catch(() => null);
      if (auditRes?.data) {
        const aLogs = Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data.logs || auditRes.data.data || auditRes.data.Activities || auditRes.data.Details || []);
        setAuditLogs(Array.isArray(aLogs) ? aLogs.slice(0, 5) : []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const activeCameras = healthSummary?.Active ?? healthSummary?.active ?? 0;
  const totalCameras = healthSummary?.TotalCameras ?? healthSummary?.totalCameras ?? 0;
  const uptime = totalCameras > 0 ? ((activeCameras / totalCameras) * 100).toFixed(1) : '0.0';
  const criticalAlerts = healthSummary?.Offline ?? healthSummary?.offline ?? 0;

  // Derive traffic from weather logs
  const congestedCount = weatherLogs.filter(l => l.trafficLevel === 'jam' || l.trafficLevel === 'slow').length;
  const smoothCount = weatherLogs.filter(l => l.trafficLevel === 'clear').length;

  // Insights
  const insights = weatherLogs
    .filter(l => (l.isRaining || l.trafficLevel === 'jam' || l.rainLevel === 'heavy'))
    .slice(0, 3)
    .map(l => ({
      id: l.id,
      icon: l.isRaining ? 'water_damage' : 'car_crash' as IconName,
      title: `${l.isRaining ? 'Rain/Flooding' : 'Traffic Jam'} detected`,
      confidence: Math.round((l.confidence || 0.8) * 100),
      source: `Camera ${l.cameraId || 'Unknown'} • ${new Date(l.timestamp).toLocaleTimeString()}`,
      color: l.isRaining ? '#93c5fd' : '#fca5a5'
    }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Icon name="arrow_back" color="#d4e4fa" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>ADMIN DASHBOARD</Text>
        <Pressable style={styles.headerButton} onPress={fetchData}>
          <Icon name="refresh" color="#d4e4fa" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#34d399" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading stats...</Text>
          </View>
        ) : (
          <>
            {/* System Overview */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>SYSTEM OVERVIEW</Text>
                <View style={styles.liveStatusBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveStatusText}>LIVE STATUS</Text>
                </View>
              </View>

              <View style={styles.overviewContainer}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>ACTIVE CAMERAS</Text>
                  <Text style={styles.statValue}>{activeCameras} / {totalCameras}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${totalCameras > 0 ? (activeCameras/totalCameras)*100 : 0}%`, backgroundColor: '#818cf8' }]} />
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>UPTIME</Text>
                  <Text style={[styles.statValue, { color: '#22c55e' }]}>{uptime}%</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, Number(uptime))}%`, backgroundColor: '#22c55e' }]} />
                  </View>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>OFFLINE / ALERTS</Text>
                  <Text style={[styles.statValue, { color: '#f87171' }]}>{criticalAlerts}</Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${totalCameras > 0 ? (criticalAlerts/totalCameras)*100 : 0}%`, backgroundColor: '#f87171' }]} />
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Traffic Status */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)} style={styles.section}>
              <View style={styles.sectionHeaderRowBasic}>
                <Icon name="traffic" color="#d4e4fa" size={18} />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Traffic Status</Text>
              </View>
              
              <View style={styles.trafficCardsRow}>
                <View style={[styles.trafficCard, styles.congestedCard]}>
                  <Text style={styles.trafficCardTitle}>CONGESTED</Text>
                  <Text style={[styles.trafficCardValue, { color: '#f87171' }]}>{congestedCount}</Text>
                  <Text style={styles.trafficCardDesc}>Hotspots detected</Text>
                </View>
                <View style={[styles.trafficCard, styles.smoothCard]}>
                  <Text style={[styles.trafficCardTitle, { color: '#a7f3d0' }]}>SMOOTH</Text>
                  <Text style={[styles.trafficCardValue, { color: '#34d399' }]}>{smoothCount}</Text>
                  <Text style={styles.trafficCardDesc}>Normal flow</Text>
                </View>
              </View>
            </Animated.View>

            {/* Weather Status */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.section}>
              <ImageBackground 
                source={{ uri: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=800&auto=format&fit=crop' }} 
                style={styles.weatherCard}
                imageStyle={{ borderRadius: 12, opacity: 0.4 }}
              >
                <View style={styles.weatherHeaderRow}>
                  <Icon name="rainy" color="#d4e4fa" size={20} />
                  <Text style={styles.weatherTitle}>Weather Status</Text>
                </View>
                
                <View style={styles.weatherInfoRow}>
                  <View>
                    <Text style={styles.weatherSubLabel}>Current Status</Text>
                    <Text style={styles.weatherTempValue}>Monitoring</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.weatherStatusValue}>LATEST AI DATA</Text>
                    <Text style={styles.weatherLocationValue}>{weatherLogs.length} logs analyzed</Text>
                  </View>
                </View>
              </ImageBackground>
            </Animated.View>

            {/* Real-time AI Insights */}
            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.section}>
              <View style={styles.sectionHeaderRowBetween}>
                <Text style={styles.sectionTitle}>Real-time AI Insights</Text>
                <Pressable style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.viewLogsText}>View Logs</Text>
                  <Icon name="chevron_right" color="#b9cac8" size={16} />
                </Pressable>
              </View>

              {insights.length > 0 ? insights.map((item, idx) => (
                <InsightCard 
                  key={item.id || idx}
                  icon={item.icon} 
                  title={item.title} 
                  confidence={item.confidence} 
                  source={item.source} 
                  color={item.color} 
                />
              )) : (
                <Text style={{ color: '#64748b', fontStyle: 'italic' }}>No critical insights detected recently.</Text>
              )}
            </Animated.View>

            {/* Recent Activities */}
            <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activities</Text>
              
              <View style={styles.activitiesContainer}>
                {auditLogs.length > 0 ? auditLogs.map((log, idx) => (
                  <ActivityItem 
                    key={log.id || idx}
                    icon="info_outline" 
                    iconColor="#93c5fd" 
                    title={log.action || log.message || "Admin Action"} 
                    time={new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()} 
                  />
                )) : (
                  <>
                    <ActivityItem 
                      icon="security" 
                      iconColor="#93c5fd" 
                      title="System initialization complete." 
                      time={new Date().toLocaleString()} 
                    />
                    <ActivityItem 
                      icon="update" 
                      iconColor="#86efac" 
                      title={<Text>AI Model <Text style={{ color: '#34d399', fontWeight: 'bold' }}>Active</Text> parsing streams.</Text>}
                      time={new Date().toLocaleString()} 
                    />
                  </>
                )}
              </View>
            </Animated.View>
          </>
        )}
        
        {/* Spacer for bottom bar */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Custom Bottom Tab Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <BottomTabItem icon="grid_view" label="Dashboard" isActive />
        <BottomTabItem icon="map" label="Map" onPress={() => router.push('/(tabs)/explore' as any)} />
        <BottomTabItem icon="videocam" label="Cameras" onPress={() => router.push('/admin/manage-cameras' as any)} />
        <BottomTabItem icon="bar_chart" label="Reports" onPress={() => router.push('/admin/dashboard' as any)} />
      </View>
    </View>
  );
}

// --- Helper Components ---

function InsightCard({ icon, title, confidence, source, color }: { icon: IconName, title: string, confidence: number, source: string, color: string }) {
  return (
    <View style={[styles.insightCard, { borderColor: color + '40' }]}>
      <View style={[styles.insightIconWrapper, { backgroundColor: color + '15' }]}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceTrack}>
            <View style={[styles.confidenceFill, { width: `${confidence}%`, backgroundColor: color }]} />
          </View>
          <Text style={[styles.confidenceText, { color }]}>{confidence}% Confidence</Text>
        </View>
        <Text style={styles.insightSource}>{source}</Text>
      </View>
    </View>
  );
}

function ActivityItem({ icon, iconColor, title, time }: { icon: IconName, iconColor: string, title: React.ReactNode, time: string }) {
  return (
    <View style={styles.activityItem}>
      <Icon name={icon} color={iconColor} size={20} />
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

function BottomTabItem({ icon, label, isActive = false, onPress }: { icon: IconName, label: string, isActive?: boolean, onPress?: () => void }) {
  return (
    <Pressable style={[styles.bottomTabItem, isActive && styles.bottomTabItemActive]} onPress={onPress}>
      <Icon name={icon} color={isActive ? "#34d399" : "#64748b"} size={22} />
      <Text style={[styles.bottomTabLabel, isActive && styles.bottomTabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120', // Darker admin theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#111827',
  },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', letterSpacing: 1 },
  scrollContent: { padding: 16 },
  section: { marginBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeaderRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeaderRowBasic: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#e2e8f0' },
  liveStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 6 },
  liveStatusText: { color: '#22c55e', fontSize: 10, fontWeight: '700' },
  overviewContainer: { gap: 16 },
  statRow: { marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  trafficCardsRow: { flexDirection: 'row', gap: 12 },
  trafficCard: { flex: 1, padding: 16, borderRadius: 8, borderWidth: 1 },
  congestedCard: { backgroundColor: 'rgba(248, 113, 113, 0.05)', borderColor: 'rgba(248, 113, 113, 0.2)' },
  smoothCard: { backgroundColor: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.2)' },
  trafficCardTitle: { fontSize: 10, fontWeight: '700', color: '#fca5a5', marginBottom: 4 },
  trafficCardValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  trafficCardDesc: { fontSize: 10, color: '#94a3b8' },
  weatherCard: { borderRadius: 12, padding: 16, overflow: 'hidden', backgroundColor: '#1e293b' },
  weatherHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  weatherTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  weatherInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  weatherSubLabel: { fontSize: 12, color: '#cbd5e1', marginBottom: 4 },
  weatherTempValue: { fontSize: 28, fontWeight: '700', color: '#f8fafc' },
  weatherStatusValue: { fontSize: 12, fontWeight: '700', color: '#fca5a5', marginBottom: 4 },
  weatherLocationValue: { fontSize: 12, color: '#cbd5e1' },
  viewLogsText: { fontSize: 12, color: '#cbd5e1', fontWeight: '600' },
  insightCard: { flexDirection: 'row', padding: 12, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 12 },
  insightIconWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  insightContent: { flex: 1, justifyContent: 'center' },
  insightTitle: { fontSize: 13, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  confidenceTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, maxWidth: 100 },
  confidenceFill: { height: '100%', borderRadius: 2 },
  confidenceText: { fontSize: 10, fontWeight: '600' },
  insightSource: { fontSize: 10, color: '#64748b' },
  activitiesContainer: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 16, gap: 16 },
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 12, color: '#f8fafc', lineHeight: 18, marginBottom: 4 },
  activityTime: { fontSize: 10, color: '#64748b' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  bottomTabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, marginHorizontal: 4 },
  bottomTabItemActive: { backgroundColor: 'rgba(52, 211, 153, 0.1)' },
  bottomTabLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  bottomTabLabelActive: { color: '#34d399', fontWeight: '700' },
});
