import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAttendance } from '@/store/attendance-store';
import { useAuth } from '@/store/auth-store';
import { homeStyles } from '@/styles/dashboard/home-styles';
import { useRouter } from 'expo-router';
import {
  Sprout,
  Store,
  Users,
  UserCheck,
  User,
  MapPin,
  ChevronRight,
  Award,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { EmploymentStatus } from '@pgn/shared';

export default function HomeScreen() {
  const router = useRouter();
  // Subscribe to user with a selector to ensure re-render
  const user = useAuth((state) => state.user);
  const { fetchAttendanceHistory, attendanceHistory, getAttendanceStatus } =
    useAttendance();
  const colors = useThemeColors();
  Dimensions.get('window');

  const [refreshing, setRefreshing] = useState(false);
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

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadTodayStats(),
      loadCurrentStatus(),
      // Re-fetch user data to get updated regions and status
      useAuth.getState().refreshUserData(),
    ]);
    setRefreshing(false);
  }, [loadTodayStats, loadCurrentStatus]);

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

  // Get full name
  const userFullName = user ? `${user.firstName} ${user.lastName}` : 'User';

  // Get regions display
  const getRegionsDisplay = () => {
    if (!user?.assignedCities || user.assignedCities.length === 0) {
      return 'No regions assigned';
    }
    if (user.assignedCities.length === 1) {
      const region = user.assignedCities[0];
      return typeof region === 'object' && region.city && region.state
        ? `${region.city}, ${region.state}`
        : String(region);
    }
    if (user.assignedCities.length <= 2) {
      return user.assignedCities.map(region =>
        typeof region === 'object' && region.city && region.state
          ? `${region.city}, ${region.state}`
          : String(region)
      ).join(', ');
    }
    const firstRegion = user.assignedCities[0];
    const secondRegion = user.assignedCities[1];
    const firstRegionStr = typeof firstRegion === 'object' && firstRegion.city && firstRegion.state
      ? `${firstRegion.city}, ${firstRegion.state}`
      : String(firstRegion);
    const secondRegionStr = typeof secondRegion === 'object' && secondRegion.city && secondRegion.state
      ? `${secondRegion.city}, ${secondRegion.state}`
      : String(secondRegion);
    return `${firstRegionStr}, ${secondRegionStr} +${user.assignedCities.length - 2} more`;
  };

  // Entity items for quick access - Order: Dealers, Retailers, Farmers
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
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Section with Logo */}
        <View style={[homeStyles.profileSection, { marginTop: 40 }]}>
          <View style={homeStyles.profileHeader}>
            {/* Logo/User Icon */}
            <View style={[homeStyles.profileLogoContainer, { backgroundColor: colors.primary }]}>
              <User size={32} color="#FFFFFF" />
            </View>

            {/* User Info */}
            <View style={homeStyles.profileInfo}>
              <Text style={[homeStyles.userName, { color: colors.text }]}>
                {userFullName}
              </Text>
              <Text style={[homeStyles.userSubtitle, { color: colors.textSecondary }]}>
                ID: {user?.humanReadableId || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Cards Section */}
        <View style={[homeStyles.sectionContainer, { marginTop: 24 }]}>
          <Text style={[homeStyles.sectionTitle, { color: colors.text }]}>Today&apos;s Overview</Text>
          <View style={homeStyles.statsCardsContainer}>
            <View style={homeStyles.statCard}>
              <View style={[homeStyles.statCardIcon, { backgroundColor: colors.primary + '20' }]}>
                <Award size={20} color={colors.primary} />
              </View>
              <View style={homeStyles.statCardContent}>
                <Text style={[homeStyles.statCardLabel, { color: colors.textSecondary }]}>Attendance</Text>
                <Text style={[homeStyles.statCardValue, { color: colors.text }]}>
                  {todayStats.daysPresent > 0 ? 'Present' : 'Not Marked'}
                </Text>
              </View>
            </View>

            <View style={homeStyles.statCard}>
              <View style={[homeStyles.statCardIcon, { backgroundColor: employeeStatusInfo.color + '20' }]}>
                <UserCheck size={20} color={employeeStatusInfo.color} />
              </View>
              <View style={homeStyles.statCardContent}>
                <Text style={[homeStyles.statCardLabel, { color: colors.textSecondary }]}>Status</Text>
                <Text style={[homeStyles.statCardValue, { color: colors.text }]}>
                  {employeeStatusInfo.text}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Regions Section */}
        <View style={[homeStyles.sectionContainer, { marginTop: 8 }]}>
          <View style={homeStyles.sectionHeader}>
            <Text style={[homeStyles.sectionTitle, { color: colors.text }]}>Assigned Regions</Text>
            <TouchableOpacity onPress={() => router.push('/profile' as any)}>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={homeStyles.regionsCard}>
            <MapPin size={16} color={colors.primary} />
            <Text style={[homeStyles.regionsText, { color: colors.text }]}>
              {getRegionsDisplay()}
            </Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={[homeStyles.sectionContainer, { marginTop: 8 }]}>
          <Text style={[homeStyles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
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
    </View>
  );
}
