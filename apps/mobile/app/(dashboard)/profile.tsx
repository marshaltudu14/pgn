import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react-native';
import { showToast } from '@/utils/toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      showToast.success('Logged out successfully');
    } catch (error) {
      showToast.error('Failed to logout');
    }
  };

  const handleSettings = () => {
    showToast.info('Settings', 'Settings will be available in the next update.');
  };

  const profileItems = [
    {
      icon: User,
      label: 'Full Name',
      value: user?.fullName || 'N/A',
    },
    {
      icon: Mail,
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: MapPin,
      label: 'Employee ID',
      value: user?.humanReadableId || 'N/A',
    },
    {
      icon: Briefcase,
      label: 'Department',
      value: user?.department || 'N/A',
    },
    {
      icon: MapPin,
      label: 'Region',
      value: user?.region || 'N/A',
    },
    {
      icon: Calendar,
      label: 'Start Date',
      value: user?.startDate ? new Date(user.startDate).toLocaleDateString() : 'N/A',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-b from-blue-600 to-blue-500 pt-12 pb-8 px-6">
        <View className="items-center">
          <View className="w-20 h-20 bg-blue-700 rounded-full items-center justify-center mb-4">
            {user?.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <Text className="text-white text-3xl font-bold">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <Text className="text-white text-2xl font-bold">
            {user?.fullName || 'User'}
          </Text>
          <Text className="text-blue-100 text-sm mt-1">
            {user?.humanReadableId || 'PGN-2024-0001'}
          </Text>
          <Text className="text-blue-200 text-xs mt-1">
            {user?.employmentStatus?.toLowerCase() || 'active'}
          </Text>
        </View>
      </View>

      {/* Profile Information */}
      <View className="px-6 py-6">
        <View className="bg-white rounded-xl shadow-sm mb-6">
          <Text className="text-gray-900 text-lg font-semibold px-4 pt-4 pb-2">
            Profile Information
          </Text>
          {profileItems.map((item, index) => (
            <View
              key={index}
              className={`flex-row items-center px-4 py-3 ${
                index !== profileItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <item.icon size={20} color="#6B7280" className="mr-3" />
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">{item.label}</Text>
                <Text className="text-gray-900 font-medium">{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="bg-white rounded-xl shadow-sm mb-6">
          <Text className="text-gray-900 text-lg font-semibold px-4 pt-4 pb-2">
            Actions
          </Text>

          <TouchableOpacity
            onPress={handleSettings}
            className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <Settings size={20} color="#6B7280" className="mr-3" />
              <Text className="text-gray-900 font-medium">Settings</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-between px-4 py-3"
          >
            <View className="flex-row items-center">
              <LogOut size={20} color="#EF4444" className="mr-3" />
              <Text className="text-red-600 font-medium">Log Out</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="bg-gray-100 rounded-xl p-4 items-center">
          <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mr-3">
            <Text className="text-white text-sm font-bold">P</Text>
          </View>
          <Text className="text-gray-600 text-sm font-medium">
            PGN Mobile v1.0.0
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            Employee Management System
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}