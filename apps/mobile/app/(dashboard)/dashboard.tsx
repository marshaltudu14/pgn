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

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout, biometricEnabled } = useAuth();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.success) {
        showToast.error(result.error || 'Failed to logout');
      } else {
        showToast.success('Logged out successfully');
      }
      // Navigation will be handled by auth guard
    } catch {
      showToast.error('Failed to logout');
    }
  };

  const handleProfilePress = () => {
    router.push('/(dashboard)/profile');
  };

  const handleAttendancePress = () => {
    // This will be implemented in Phase 2
    showToast.info(
      'Coming Soon',
      'Attendance tracking features will be available in Phase 2.',
      4000
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 pt-12 pb-6 px-6">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-2xl font-bold">
              Welcome back!
            </Text>
            <Text className="text-blue-100 text-sm mt-1">
              {user?.fullName || 'Employee'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleProfilePress}
            className="w-12 h-12 bg-blue-700 rounded-full items-center justify-center"
          >
            <Text className="text-white text-lg font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <View className="bg-blue-700 rounded-lg p-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-blue-100 text-xs">Employee ID</Text>
              <Text className="text-white font-semibold">
                {user?.humanReadableId || 'N/A'}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-blue-100 text-xs">Status</Text>
              <Text className="text-white font-semibold capitalize">
                {user?.employmentStatus?.toLowerCase() || 'Active'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-6 py-6">
        <Text className="text-gray-900 text-lg font-semibold mb-4">
          Quick Actions
        </Text>

        <View className="grid grid-cols-2 gap-4">
          {/* Attendance Check-in */}
          <TouchableOpacity
            onPress={handleAttendancePress}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mb-3">
              <Text className="text-2xl">📍</Text>
            </View>
            <Text className="text-gray-900 font-semibold text-sm">
              Check In
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              Start your workday
            </Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            onPress={handleProfilePress}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
          >
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Text className="text-2xl">👤</Text>
            </View>
            <Text className="text-gray-900 font-semibold text-sm">
              Profile
            </Text>
            <Text className="text-gray-500 text-xs mt-1">
              View your information
            </Text>
          </TouchableOpacity>
        </View>

        {/* Biometric Status */}
        <View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mt-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">👆</Text>
              <View>
                <Text className="text-gray-900 font-semibold text-sm">
                  Biometric Login
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  {biometricEnabled
                    ? 'Enabled for faster access'
                    : 'Not configured'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                // This will be implemented in Task 4
                showToast.info(
                  'Biometric Settings',
                  'Biometric configuration will be available in the next update.',
                  4000
                );
              }}
              className="bg-blue-600 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-xs font-medium">
                {biometricEnabled ? 'Configure' : 'Setup'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coming Soon Features */}
        <View className="mt-6">
          <Text className="text-gray-900 text-lg font-semibold mb-4">
            Coming Soon (Phase 2)
          </Text>
          <View className="space-y-3">
            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">🗺️</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Location Tracking
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    Real-time location monitoring
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">📊</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Attendance Reports
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    View work history and statistics
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-gray-100 rounded-lg p-4 opacity-75">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">⏰</Text>
                <View className="flex-1">
                  <Text className="text-gray-700 font-medium text-sm">
                    Work Hours Tracking
                  </Text>
                  <Text className="text-gray-500 text-xs">
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
          className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6"
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-red-600 font-medium">Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}