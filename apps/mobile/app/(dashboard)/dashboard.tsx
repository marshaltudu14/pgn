import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/store/auth-store';
import { showToast } from '@/utils/toast';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  Activity
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();

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
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="items-center">
          <Text className="text-white text-2xl font-bold mb-2">
            Dashboard
          </Text>
          <Text className="text-blue-100 text-sm">
            {user?.fullName || 'Employee'} • {user?.humanReadableId || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View className="px-6 py-6">
        <Text className="text-gray-900 text-lg font-semibold mb-4">
          This Week&apos;s Overview
        </Text>

        <View className="grid grid-cols-2 gap-4 mb-6">
          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Clock size={20} color="#3B82F6" />
              <TrendingUp size={16} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {weeklyStats.totalHours}
            </Text>
            <Text className="text-gray-500 text-xs">Total Hours</Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Calendar size={20} color="#3B82F6" />
              <TrendingUp size={16} color="#10B981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {weeklyStats.daysPresent}
            </Text>
            <Text className="text-gray-500 text-xs">Days Present</Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <BarChart3 size={20} color="#3B82F6" />
              <Activity size={16} color="#F59E0B" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {weeklyStats.averageHours}
            </Text>
            <Text className="text-gray-500 text-xs">Avg Hours/Day</Text>
          </View>

          <View className="bg-white rounded-lg p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Clock size={20} color="#3B82F6" />
              <TrendingUp size={16} color="#F59E0B" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {weeklyStats.overtimeHours}
            </Text>
            <Text className="text-gray-500 text-xs">Overtime Hours</Text>
          </View>
        </View>

        {/* Weekly Chart */}
        <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <Text className="text-gray-900 font-semibold mb-4">
            Weekly Hours
          </Text>
          <View className="flex-row justify-between items-end h-32">
            {monthlyData.map((item, index) => (
              <View key={index} className="flex-1 items-center">
                <View
                  className="w-8 bg-blue-500 rounded-t"
                  style={{ height: `${(item.hours / 10) * 100}%` }}
                />
                <Text className="text-xs text-gray-600 mt-2">{item.day}</Text>
                <Text className="text-xs text-gray-900 font-medium">{item.hours}h</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 font-semibold">
              Recent Activity
            </Text>
            <TouchableOpacity onPress={() => showToast.info('Activity', 'Full activity log coming soon!')}>
              <Text className="text-blue-600 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivities.map((activity, index) => (
            <View
              key={index}
              className={`flex-row items-center py-3 ${
                index !== recentActivities.length - 1 ? 'border-b border-gray-100' : ''
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
                <Text className="text-gray-900 font-medium text-sm capitalize">
                  {activity.type.replace('_', ' ')}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-xs mr-3">{activity.time}</Text>
                  <Text className="text-gray-400 text-xs">{activity.location}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs">{activity.date}</Text>
            </View>
          ))}
        </View>

        {/* Team Status */}
        <View className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 font-semibold">
              Team Status
            </Text>
            <Users size={20} color="#6B7280" />
          </View>

          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-gray-700 text-sm">Online</Text>
              </View>
              <Text className="text-gray-900 font-medium">12</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                <Text className="text-gray-700 text-sm">Away</Text>
              </View>
              <Text className="text-gray-900 font-medium">3</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                <Text className="text-gray-700 text-sm">Offline</Text>
              </View>
              <Text className="text-gray-900 font-medium">5</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-lg shadow-sm p-4">
          <Text className="text-gray-900 font-semibold mb-4">
            Quick Actions
          </Text>

          <View className="grid grid-cols-2 gap-3">
            <TouchableOpacity
              onPress={() => showToast.info('Reports', 'Detailed reports coming soon!')}
              className="bg-blue-50 rounded-lg p-3 items-center"
            >
              <BarChart3 size={20} color="#3B82F6" />
              <Text className="text-blue-700 font-medium text-sm mt-1">View Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => showToast.info('Schedule', 'Work schedule coming soon!')}
              className="bg-green-50 rounded-lg p-3 items-center"
            >
              <Calendar size={20} color="#10B981" />
              <Text className="text-green-700 font-medium text-sm mt-1">Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}