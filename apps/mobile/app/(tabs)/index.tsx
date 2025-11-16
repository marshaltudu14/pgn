import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { showToast } from '@/utils/toast';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const currentTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentDate = new Date().toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickActions = (action: string) => {
    switch (action) {
      case 'dashboard':
        router.push('/(tabs)/dashboard');
        break;
      case 'profile':
        router.push('/(tabs)/profile');
        break;
      case 'attendance':
        showToast.info(
          'Coming Soon',
          'Attendance tracking will be available in Phase 2.',
          4000
        );
        break;
      default:
        break;
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-b from-blue-600 to-blue-500 pt-12 pb-20 px-6">
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold">
              {getGreeting()}!
            </Text>
            <Text className="text-blue-100 text-lg mt-1">
              {user?.fullName || 'Welcome back'}
            </Text>
            <Text className="text-blue-200 text-sm mt-2">
              {currentDate}
            </Text>
          </View>
          <View className="w-16 h-16 bg-blue-700 rounded-full items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Cards */}
      <View className="px-6 -mt-8">
        <View className="bg-white rounded-xl p-4 shadow-lg mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-500 text-xs uppercase tracking-wide">
                Current Time
              </Text>
              <Text className="text-gray-900 text-2xl font-bold">
                {currentTime}
              </Text>
            </View>
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
              <Text className="text-2xl">🕐</Text>
            </View>
          </View>
        </View>

        <View className="grid grid-cols-2 gap-4 mb-4">
          <View className="bg-white rounded-xl p-4 shadow-lg">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">👤</Text>
              <Text className="text-gray-900 font-bold text-lg">
                {user?.humanReadableId || 'PGN-2024-0001'}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs">Employee ID</Text>
          </View>

          <View className="bg-white rounded-xl p-4 shadow-lg">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-2">✓</Text>
              <Text className="text-green-600 font-bold text-lg capitalize">
                {user?.employmentStatus?.toLowerCase() || 'Active'}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs">Status</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-4">
          <Text className="text-gray-900 text-lg font-semibold mb-3">
            Quick Actions
          </Text>
          <View className="space-y-3">
            <TouchableOpacity
              onPress={() => handleQuickActions('dashboard')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex-row items-center"
            >
              <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center mr-4">
                <Text className="text-xl">📊</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Dashboard</Text>
                <Text className="text-gray-500 text-sm">View overview and stats</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickActions('profile')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex-row items-center"
            >
              <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mr-4">
                <Text className="text-xl">👤</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Profile</Text>
                <Text className="text-gray-500 text-sm">Manage your information</Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickActions('attendance')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex-row items-center"
            >
              <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center mr-4">
                <Text className="text-xl">📍</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Attendance</Text>
                <Text className="text-gray-500 text-sm">Check in and out</Text>
              </View>
              <View className="bg-orange-100 px-2 py-1 rounded-full">
                <Text className="text-orange-600 text-xs font-medium">Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="bg-gray-100 rounded-xl p-4 mb-6">
          <View className="flex-row items-center justify-center">
            <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
              <Text className="text-white text-sm font-bold">P</Text>
            </View>
            <Text className="text-gray-600 text-sm font-medium">
              PGN Mobile v1.0.0
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
