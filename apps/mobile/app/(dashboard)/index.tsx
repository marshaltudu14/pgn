import FloatingActionButton from '@/components/FloatingActionButton';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAttendance } from '@/store/attendance-store';
import { useAuth } from '@/store/auth-store';
import { homeStyles } from '@/styles/dashboard/home-styles';
import { useRouter } from 'expo-router';
import {
  Clock,
  Sprout,
  Store,
  TrendingUp,
  Users,
  UserCheck,
  User,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EmploymentStatus } from '@pgn/shared';

export default function HomeScreen() {
  const router = useRouter();
  // Subscribe to user with a selector to ensure re-render
  const user = useAuth((state) => state.user);
  const { fetchAttendanceHistory, attendanceHistory, getAttendanceStatus } =
    useAttendance();
  const colors = useThemeColors();

    const [todayStats, setTodayStats] = useState({
    daysPresent: 0,
    totalHours: 0,
    avgHours: 0,
    totalDistance: 0,
  });

  
  // Load today's stats data
  const loadTodayStats = useCallback(async () => {
    try {
      if (!user?.id) {
        return;
      }

      // Get today's date
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      // Use attendance store to fetch history for today only
      await fetchAttendanceHistory({
        employeeId: user.id,
        dateFrom: todayString,
        dateTo: todayString,
        limit: 10,
      });
    } catch (error) {
      // Silently handle error
      console.error('Error loading today stats:', error);
    }
  }, [user?.id, fetchAttendanceHistory]);

  // Process attendance history data to calculate stats
  useEffect(() => {
    if (!attendanceHistory.length) {
      return;
    }

    // Filter for records that have meaningful data (checked in)
    const todayData = attendanceHistory.filter(
      record =>
        record.workHours !== undefined || record.checkInTime !== undefined
    );

    // Calculate stats for today
    const daysPresent = todayData.filter(r => r.checkInTime).length;
    const totalHours = todayData.reduce(
      (sum: number, record) => sum + (record.workHours || 0),
      0
    );
    const avgHours = daysPresent > 0 ? totalHours / daysPresent : 0;
    const totalDistance = todayData.reduce(
      (sum: number, record) => sum + (record.locationPath?.length || 0) * 100,
      0
    );

    setTodayStats({
      daysPresent,
      totalHours,
      avgHours,
      totalDistance,
    });
  }, [attendanceHistory]);

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
    loadTodayStats();
    loadCurrentStatus();
  }, [loadTodayStats, loadCurrentStatus]);

  // Get employee status info
  const getEmployeeStatusInfo = () => {
    const status = user?.employmentStatus || 'ACTIVE';
    const statusColors = {
      ACTIVE: colors.success,
      SUSPENDED: colors.warning,
      RESIGNED: colors.error,
      TERMINATED: colors.error,
      ON_LEAVE: colors.textSecondary,
    };
    const statusLabels = {
      ACTIVE: 'Active',
      SUSPENDED: 'Suspended',
      RESIGNED: 'Resigned',
      TERMINATED: 'Terminated',
      ON_LEAVE: 'On Leave',
    };

    return {
      text: statusLabels[status as EmploymentStatus],
      color: statusColors[status as EmploymentStatus] || colors.textSecondary,
    };
  };

  const employeeStatusInfo = getEmployeeStatusInfo();

  // Stats items for mobile list design
  const statsItems = [
    {
      label: user?.firstName || 'User',
      value: user?.lastName || '',
      icon: User,
      color: colors.text,
    },
    {
      label: 'Status',
      value: employeeStatusInfo.text,
      icon: UserCheck,
      color: employeeStatusInfo.color,
    },
    {
      label: 'Hours',
      value: todayStats.totalHours.toFixed(1),
      icon: Clock,
      color: colors.primary,
    },
    {
      label: 'Distance',
      value: formatDistance(todayStats.totalDistance),
      icon: TrendingUp,
      color: colors.textSecondary,
    },
  ];

  // Entity items for quick access
  const entityItems = [
    {
      id: 'dealers',
      title: 'Dealers',
      description: 'Manage dealer relationships',
      icon: Store,
      color: '#3B82F6',
      onPress: () => router.push('/dealers' as any),
    },
    {
      id: 'retailers',
      title: 'Retailers',
      description: 'Manage retail partnerships',
      icon: Users,
      color: '#10B981',
      onPress: () => router.push('/retailers' as any),
    },
    {
      id: 'farmers',
      title: 'Farmers',
      description: 'Manage farmer connections',
      icon: Sprout,
      color: '#F59E0B',
      onPress: () => router.push('/farmers' as any),
    },
  ];

  // FAB options for creating new entities
  const fabOptions = [
    {
      id: 'create-dealer',
      label: 'Dealer',
      icon: Store,
      color: '#3B82F6',
      onPress: () => router.push('/dealers' as any),
    },
    {
      id: 'create-retailer',
      label: 'Retailer',
      icon: Users,
      color: '#10B981',
      onPress: () => router.push('/retailers' as any),
    },
    {
      id: 'create-farmer',
      label: 'Farmer',
      icon: Sprout,
      color: '#F59E0B',
      onPress: () => router.push('/farmers' as any),
    },
  ];

  // Render stat item
  const renderStatItem = ({ item }: { item: (typeof statsItems)[0] }) => {
    const Icon = item.icon;
    const isEmployeeName = item.icon === User;

    return (
      <View style={homeStyles.statItem}>
        <View style={homeStyles.statIconContainer}>
          <Icon size={16} color={item.color} />
        </View>
        <View style={homeStyles.statContent}>
          <Text style={[homeStyles.statValue, { color: colors.text }]}>
            {item.label}
          </Text>
          {!isEmployeeName ? (
            <Text style={[homeStyles.statLabel, { color: colors.textSecondary }]}>
              {item.value}
            </Text>
          ) : (
            item.value && (
              <Text style={[homeStyles.statLabel, { color: colors.textSecondary }]}>
                {item.value}
              </Text>
            )
          )}
        </View>
      </View>
    );
  };

  // Render entity item
  const renderEntityItem = (item: (typeof entityItems)[0]) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          paddingHorizontal: 8,
          marginHorizontal: 8,
          marginVertical: 4,
        }}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: `${item.color}20`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Icon size={28} color={item.color} />
        </View>
        <Text
          style={[
            {
              fontSize: 14,
              fontWeight: '600',
              textAlign: 'center',
            },
            { color: colors.text },
          ]}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[homeStyles.container, { backgroundColor: 'transparent' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Stats Section - Direct Icons */}
        <View style={[homeStyles.statsSection, { marginTop: 40 }]}>
          <View style={homeStyles.statsGrid}>
            {statsItems.map(item => (
              <View key={item.label}>{renderStatItem({ item })}</View>
            ))}
          </View>
        </View>

        {/* Entity Management Section */}
        <View style={[homeStyles.statsSection, { marginTop: 12 }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              marginBottom: 8,
              marginHorizontal: 16,
              gap: 8,
            }}
          >
            {entityItems.map(item => (
              <View key={item.id}>{renderEntityItem(item)}</View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button - positioned absolutely on top */}
      <FloatingActionButton options={fabOptions} />
    </View>
  );
}
