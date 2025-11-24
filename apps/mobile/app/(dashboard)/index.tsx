import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useAuth } from '@/store/auth-store';
import { useAttendance } from '@/store/attendance-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNetworkMonitor } from '@/hooks/use-network-monitor';
import { COLORS } from '@/constants';
import { homeStyles } from '@/styles/dashboard/home-styles';
import { Calendar, Clock, TrendingUp, Activity, Wifi, WifiOff } from 'lucide-react-native';
import { LocationSyncTimer } from '@/components/ui/location-sync-timer';
import { LOCATION_TRACKING_CONFIG } from '@/constants/location-tracking';

export default function HomeScreen() {
  const { user } = useAuth();
  const {
    fetchAttendanceHistory,
    attendanceHistory,
    currentStatus,
    isLocationTracking,
    getAttendanceStatus
  } = useAttendance();
  const colorScheme = useColorScheme();
  const { connectionDisplayInfo } = useNetworkMonitor();
  const [weeklyStats, setWeeklyStats] = useState({
    daysPresent: 0,
    totalHours: 0,
    avgHours: 0,
    totalDistance: 0,
  });

  // Theme colors - consistent with attendance screen
  const colors = {
    background: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    card: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
    text: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#8E8E93' : '#3C3C43',
    textTertiary: colorScheme === 'dark' ? '#48484A' : '#8E8E93',
    border: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    primary: COLORS.SAFFRON,
    success: COLORS.SUCCESS,
    warning: COLORS.WARNING,
    error: COLORS.ERROR,
    separator: colorScheme === 'dark' ? '#38383A' : '#C6C6C8',
    statusBar: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
  };

  // Load weekly stats data
  const loadWeeklyStats = useCallback(async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Calculate date range for last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const today = new Date();

      // Use attendance store to fetch history
      await fetchAttendanceHistory({
        employeeId: user.id,
        dateFrom: oneWeekAgo.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
        limit: 100
      });

      const attendanceData = attendanceHistory;

      // Filter for records that have meaningful data (checked in)
      const weekData = attendanceData.filter((record) =>
        (record.workHours !== undefined || record.checkInTime !== undefined)
      );

      // Calculate stats
      const daysPresent = weekData.filter((r) => r.checkInTime).length;
      const totalHours = weekData.reduce((sum: number, record) => sum + (record.workHours || 0), 0);
      const avgHours = daysPresent > 0 ? totalHours / daysPresent : 0;
      const totalDistance = weekData.reduce((sum: number, record) => sum + ((record.locationPath?.length || 0) * 100), 0);

      setWeeklyStats({
        daysPresent,
        totalHours,
        avgHours,
        totalDistance,
      });
    } catch (error) {
      // Silently handle error
      console.error('Error loading weekly stats:', error);
    }
  }, [user?.id, fetchAttendanceHistory, attendanceHistory]);

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Load current attendance status
  const loadCurrentStatus = useCallback(async () => {
    try {
      if (user?.id) {
        await getAttendanceStatus(user.id);
      }
    } catch (error) {
      console.error('Error loading current status:', error);
    }
  }, [user?.id, getAttendanceStatus]);

  useEffect(() => {
    loadWeeklyStats();
    loadCurrentStatus();
  }, [loadWeeklyStats, loadCurrentStatus]);

  // Get first name
  const getFirstName = () => {
    return user?.firstName || 'User';
  };

  // Get status info
  const getStatusInfo = () => {
    const status = user?.employmentStatus?.toLowerCase() || 'active';
    const isActive = status === 'active';
    return {
      text: isActive ? 'Active' : status,
      color: isActive ? colors.success : colors.warning
    };
  };

  const statusInfo = getStatusInfo();

  // Stats items for mobile list design
  const statsItems = [
    { label: 'Days Present', value: weeklyStats.daysPresent.toString(), icon: Calendar, color: colors.success },
    { label: 'Hours', value: weeklyStats.totalHours.toFixed(1), icon: Clock, color: colors.primary },
    { label: 'Daily Avg', value: `${weeklyStats.avgHours.toFixed(1)}h`, icon: Activity, color: colors.warning },
    { label: 'Distance', value: formatDistance(weeklyStats.totalDistance), icon: TrendingUp, color: colors.textSecondary },
  ];

  // Render stat item
  const renderStatItem = ({ item }: { item: typeof statsItems[0] }) => {
    const Icon = item.icon;
    return (
      <View style={homeStyles.statItem}>
        <View style={homeStyles.statIconContainer}>
          <Icon size={16} color={item.color} />
        </View>
        <View style={homeStyles.statContent}>
          <Text style={[homeStyles.statValue, { color: colors.text }]}>{item.value}</Text>
          <Text style={[homeStyles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[homeStyles.container, { backgroundColor: colors.background }]}>
      {/* Compact Header */}
      <View style={[homeStyles.compactHeader, { paddingTop: 50 }]}>
        <View style={homeStyles.headerRow}>
          <View style={homeStyles.headerLeft}>
            <Text style={[homeStyles.userName, { color: colors.text }]}>
              {getFirstName()}
            </Text>
            <Text style={[homeStyles.userSubtitle, { color: colors.textSecondary }]}>
              {user?.humanReadableId || 'N/A'}
            </Text>
          </View>
          <View style={homeStyles.headerRight}>
            <View style={[homeStyles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <Text style={[homeStyles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
            <View style={[homeStyles.networkStatusBadge, { backgroundColor: `${connectionDisplayInfo.color}20` }]}>
              {connectionDisplayInfo.icon === 'Wifi' ? (
                <Wifi size={14} color={connectionDisplayInfo.color} />
              ) : (
                <WifiOff size={14} color={connectionDisplayInfo.color} />
              )}
              <Text style={[homeStyles.networkStatusText, { color: connectionDisplayInfo.color }]}>
                {connectionDisplayInfo.text}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location Sync Timer - Only show when checked in and location tracking is active */}
      <LocationSyncTimer
        isVisible={currentStatus === 'CHECKED_IN' && isLocationTracking}
        interval={LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS}
      />

      {/* Stats Section */}
      <View style={homeStyles.statsSection}>
        <View style={homeStyles.sectionHeader}>
          <Text style={[homeStyles.sectionTitle, { color: colors.text }]}>This Week</Text>
        </View>
        <View style={homeStyles.statsGrid}>
          {statsItems.map((item) => (
            <View key={item.label}>{renderStatItem({ item })}</View>
          ))}
        </View>
      </View>

      </View>
  );
}