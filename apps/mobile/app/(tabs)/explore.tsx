import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MapPin, Clock, UserCheck, Settings } from 'lucide-react-native';
import { showToast } from '@/utils/toast';

export default function AttendanceScreen() {
  const handleAction = (action: string) => {
    showToast.info(
      'Coming Soon',
      `${action} will be available in Phase 2. This will include real-time location tracking, check-in/check-out functionality, and attendance reporting.`,
      5000
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-green-600 pt-12 pb-6 px-6">
        <View className="flex-row items-center mb-2">
          <MapPin size={28} color="white" />
          <Text className="text-white text-2xl font-bold ml-3">
            Attendance
          </Text>
        </View>
        <Text className="text-green-100">
          Track your work hours and location
        </Text>
      </View>

      {/* Current Status */}
      <View className="px-6 py-6">
        <View className="bg-white rounded-xl p-4 shadow-lg mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-gray-500 text-sm uppercase tracking-wide">
                Current Status
              </Text>
              <Text className="text-gray-900 text-xl font-bold">
                Not Checked In
              </Text>
            </View>
            <View className="w-12 h-12 bg-gray-200 rounded-full items-center justify-center">
              <Clock size={24} color="#6b7280" />
            </View>
          </View>
          <View className="bg-gray-100 rounded-lg p-3">
            <Text className="text-gray-600 text-sm text-center">
              Check in to start tracking your workday
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-gray-900 text-lg font-semibold mb-3">
          Quick Actions
        </Text>
        <View className="space-y-3 mb-4">
          <TouchableOpacity
            onPress={() => handleAction('Check In')}
            className="bg-green-600 rounded-xl p-4 shadow-sm flex-row items-center"
          >
            <View className="w-10 h-10 bg-white bg-opacity-20 rounded-lg items-center justify-center mr-4">
              <UserCheck size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">Check In</Text>
              <Text className="text-green-100 text-sm">Start your workday</Text>
            </View>
            <Text className="text-white text-2xl">👆</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAction('Check Out')}
            className="bg-red-600 rounded-xl p-4 shadow-sm flex-row items-center opacity-75"
          >
            <View className="w-10 h-10 bg-white bg-opacity-20 rounded-lg items-center justify-center mr-4">
              <Clock size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">Check Out</Text>
              <Text className="text-red-100 text-sm">End your workday</Text>
            </View>
            <Text className="text-white text-2xl">🕐</Text>
          </TouchableOpacity>
        </View>

        {/* Location Settings */}
        <Text className="text-gray-900 text-lg font-semibold mb-3">
          Location Settings
        </Text>
        <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <MapPin size={20} color="#6b7280" />
                <Text className="text-gray-900 font-medium ml-3">
                  Location Tracking
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleAction('Location Settings')}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Settings size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-sm ml-9">
              Enable automatic location tracking
            </Text>
          </View>
        </View>

        {/* Coming Soon Features */}
        <Text className="text-gray-900 text-lg font-semibold mb-3">
          Coming Soon
        </Text>
        <View className="space-y-3">
          <View className="bg-gray-100 rounded-xl p-4 opacity-75">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">🗺️</Text>
                <View>
                  <Text className="text-gray-700 font-medium">Location History</Text>
                  <Text className="text-gray-500 text-sm">View your location path</Text>
                </View>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-600 text-xs font-medium">Phase 2</Text>
              </View>
            </View>
          </View>

          <View className="bg-gray-100 rounded-xl p-4 opacity-75">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">📊</Text>
                <View>
                  <Text className="text-gray-700 font-medium">Attendance Reports</Text>
                  <Text className="text-gray-500 text-sm">Work hours and statistics</Text>
                </View>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-600 text-xs font-medium">Phase 2</Text>
              </View>
            </View>
          </View>

          <View className="bg-gray-100 rounded-xl p-4 opacity-75">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">⏰</Text>
                <View>
                  <Text className="text-gray-700 font-medium">Break Time</Text>
                  <Text className="text-gray-500 text-sm">Manage break periods</Text>
                </View>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-blue-600 text-xs font-medium">Phase 2</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6 mb-6">
          <View className="flex-row items-start">
            <Text className="text-blue-600 text-lg mr-3">ℹ️</Text>
            <View className="flex-1">
              <Text className="text-blue-900 font-medium text-sm mb-1">
                Phase 2 Features
              </Text>
              <Text className="text-blue-700 text-sm">
                Full attendance tracking with real-time location monitoring, automated check-in/out, and comprehensive reporting will be available in the next update.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}