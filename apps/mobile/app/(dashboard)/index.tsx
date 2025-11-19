import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { showToast } from '@/utils/toast';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  Activity
} from 'lucide-react-native';

export default function HomeScreen() {
    const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.success) {
        showToast.error(result.error || 'Failed to logout');
      } else {
        showToast.success('Logged out successfully');
      }
    } catch {
      showToast.error('Failed to logout');
    }
  };

  const handleProfilePress = () => {
    router.push('/(dashboard)/profile');
  };

  const handleTasksPress = () => {
    router.push('/(dashboard)/tasks');
  };

  // Mock data for demonstration
  const weeklyStats = {
    totalHours: 42,
    daysPresent: 5,
    averageHours: 8.4,
    overtimeHours: 2,
  };

  const monthlyData = [
    { day: 'Mon', hours: 8 },
    { day: 'Tue', hours: 9 },
    { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 8 },
    { day: 'Fri', hours: 9.5 },
  ];

  const recentActivities = [
    {
      type: 'check_in',
      time: '09:00 AM',
      location: 'Office',
      date: 'Today'
    },
    {
      type: 'break',
      time: '01:00 PM',
      location: 'Office',
      date: 'Today'
    },
    {
      type: 'check_out',
      time: '06:00 PM',
      location: 'Office',
      date: 'Yesterday'
    },
  ];

  return (
    <ScrollView className={`flex-1 ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <View className={`pt-12 pb-6 px-6 ${
        colorScheme === 'dark' ? 'bg-primary-900' : 'bg-gradient-to-b from-primary to-primary-600'
      }`}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className={`text-2xl font-bold ${
              colorScheme === 'dark' ? 'text-white' : 'text-white'
            }`}>
              Welcome back!
            </Text>
            <Text className={colorScheme === 'dark' ? 'text-gray-300' : 'text-primary-100'}>
              {user?.fullName || 'Employee'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleProfilePress}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              colorScheme === 'dark' ? 'bg-primary-800' : 'bg-primary-700'
            }`}
          >
            <Text className="text-white text-lg font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View className={`rounded-lg p-4 ${
          colorScheme === 'dark' ? 'bg-primary-800' : 'bg-primary-700'
        }`}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-xs ${
                colorScheme === 'dark' ? 'text-gray-400' : 'text-primary-100'
              }`}>
                Employee ID
              </Text>
              <Text className={`font-semibold ${
                colorScheme === 'dark' ? 'text-white' : 'text-white'
              }`}>
                {user?.humanReadableId || 'N/A'}
              </Text>
            </View>
            <View className="items-end">
              <Text className={`text-xs ${
                colorScheme === 'dark' ? 'text-gray-400' : 'text-primary-100'
              }`}>
                Status
              </Text>
              <Text className={`font-semibold capitalize ${
                colorScheme === 'dark' ? 'text-white' : 'text-white'
              }`}>
                {user?.employmentStatus?.toLowerCase() || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Overview */}
      <View className="px-6 py-6">
        <Text className={`text-lg font-semibold mb-4 ${
          colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          This Week&apos;s Overview
        </Text>

        <View className="grid grid-cols-2 gap-4 mb-6">
          <View className={`rounded-lg p-4 shadow-sm border ${
            colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Clock size={20} color="#FFB74D" />
              <TrendingUp size={16} color="#10B981" />
            </View>
            <Text className={`text-2xl font-bold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {weeklyStats.totalHours}
            </Text>
            <Text className={`text-xs ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Hours
            </Text>
          </View>

          <View className={`rounded-lg p-4 shadow-sm border ${
            colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Calendar size={20} color="#FFB74D" />
              <TrendingUp size={16} color="#10B981" />
            </View>
            <Text className={`text-2xl font-bold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {weeklyStats.daysPresent}
            </Text>
            <Text className={`text-xs ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Days Present
            </Text>
          </View>

          <View className={`rounded-lg p-4 shadow-sm border ${
            colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <BarChart3 size={20} color="#FFB74D" />
              <Activity size={16} color="#F59E0B" />
            </View>
            <Text className={`text-2xl font-bold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {weeklyStats.averageHours}
            </Text>
            <Text className={`text-xs ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Avg Hours/Day
            </Text>
          </View>

          <View className={`rounded-lg p-4 shadow-sm border ${
            colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <Clock size={20} color="#FFB74D" />
              <TrendingUp size={16} color="#F59E0B" />
            </View>
            <Text className={`text-2xl font-bold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {weeklyStats.overtimeHours}
            </Text>
            <Text className={`text-xs ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Overtime Hours
            </Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View className={`rounded-lg shadow-sm p-4 mb-6 border ${
          colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
        }`}>
          <Text className={`font-semibold mb-4 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Weekly Hours
          </Text>
          <View className="flex-row justify-between items-end h-32">
            {monthlyData.map((item, index) => (
              <View key={index} className="flex-1 items-center">
                <View
                  className="w-8 bg-primary-500 rounded-t"
                  style={{ height: `${(item.hours / 10) * 100}%` }}
                />
                <Text className={`text-xs mt-2 ${
                  colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.day}
                </Text>
                <Text className={`text-xs font-medium ${
                  colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {item.hours}h
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className={`rounded-lg shadow-sm p-4 mb-6 border ${
          colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`font-semibold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => showToast.info('Activity', 'Full activity log coming soon!')}>
              <Text className="text-primary-600 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.map((activity, index) => (
            <View
              key={index}
              className={`flex-row items-center py-3 ${
                index !== recentActivities.length - 1
                  ? colorScheme === 'dark' ? 'border-b border-primary-800' : 'border-b border-gray-100'
                  : ''
              }`}
            >
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                activity.type === 'check_in' ? 'bg-green-100' :
                activity.type === 'check_out' ? 'bg-red-100' :
                'bg-yellow-100'
              }`}>
                {activity.type === 'check_in' && <Text className="text-green-600">✓</Text>}
                {activity.type === 'check_out' && <Text className="text-red-600">✗</Text>}
                {activity.type === 'break' && <Text className="text-yellow-600">☕</Text>}
              </View>
              <View className="flex-1">
                <Text className={`font-medium text-sm capitalize ${
                  colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {activity.type.replace('_', ' ')}
                </Text>
                <View className="flex-row items-center">
                  <Text className={`text-xs mr-3 ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {activity.time}
                  </Text>
                  <Text className={`text-xs ${
                    colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {activity.location}
                  </Text>
                </View>
              </View>
              <Text className={`text-xs ${
                colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {activity.date}
              </Text>
            </View>
          ))}
        </View>

        {/* Team Status */}
        <View className={`rounded-lg shadow-sm p-4 mb-6 border ${
          colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
        }`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className={`font-semibold ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Team Status
            </Text>
            <Users size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Online
                </Text>
              </View>
              <Text className={`font-medium ${
                colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                12
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Away
                </Text>
              </View>
              <Text className={`font-medium ${
                colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                3
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Offline
                </Text>
              </View>
              <Text className={`font-medium ${
                colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                5
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className={`rounded-lg shadow-sm p-4 border ${
          colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-white border-primary-200'
        }`}>
          <Text className={`font-semibold mb-4 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Actions
          </Text>

          <View className="grid grid-cols-2 gap-3">
            <TouchableOpacity
              onPress={handleTasksPress}
              className={`rounded-lg p-3 items-center ${
                colorScheme === 'dark' ? 'bg-primary-800' : 'bg-primary-50'
              }`}
            >
              <BarChart3 size={20} color="#FFB74D" />
              <Text className="text-primary-700 font-medium text-sm mt-1">View Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showToast.info('Reports', 'Detailed reports coming soon!')}
              className={`rounded-lg p-3 items-center ${
                colorScheme === 'dark' ? 'bg-primary-800' : 'bg-green-50'
              }`}
            >
              <Calendar size={20} color="#10B981" />
              <Text className="text-green-700 font-medium text-sm mt-1">Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coming Soon Features */}
        <View className="mt-6">
          <Text className={`text-lg font-semibold mb-4 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Coming Soon (Phase 2)
          </Text>
          <View className="space-y-3">
            <View className={`rounded-lg p-4 border ${
              colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-gray-100'
            }`}>
              <View className="flex-row items-center opacity-75">
                <Text className="text-xl mr-3">🗺️</Text>
                <View className="flex-1">
                  <Text className={`font-medium text-sm ${
                    colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Location Tracking
                  </Text>
                  <Text className={`text-xs ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Real-time location monitoring
                  </Text>
                </View>
              </View>
            </View>

            <View className={`rounded-lg p-4 border ${
              colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-gray-100'
            }`}>
              <View className="flex-row items-center opacity-75">
                <Text className="text-xl mr-3">📊</Text>
                <View className="flex-1">
                  <Text className={`font-medium text-sm ${
                    colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Attendance Reports
                  </Text>
                  <Text className={`text-xs ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    View work history and statistics
                  </Text>
                </View>
              </View>
            </View>

            <View className={`rounded-lg p-4 border ${
              colorScheme === 'dark' ? 'bg-primary-900 border-primary-800' : 'bg-gray-100'
            }`}>
              <View className="flex-row items-center opacity-75">
                <Text className="text-xl mr-3">⏰</Text>
                <View className="flex-1">
                  <Text className={`font-medium text-sm ${
                    colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Work Hours Tracking
                  </Text>
                  <Text className={`text-xs ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Automatic time tracking
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className={`rounded-lg p-4 mt-6 border ${
            colorScheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
          }`}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-red-600 font-medium">Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}