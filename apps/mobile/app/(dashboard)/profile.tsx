import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  LogOut,
  Settings,
  ChevronRight,
  RefreshCw
} from 'lucide-react-native';
import { showToast } from '@/utils/toast';

export default function ProfileScreen() {
  const { user, logout, refreshUserData } = useAuth();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showToast.success('Logged out successfully');
    } catch {
      showToast.error('Failed to logout');
    }
  };

  const handleSettings = () => {
    showToast.info('Settings', 'Settings will be available in the next update.');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      showToast.success('Profile Updated', 'Your profile information has been refreshed');
    } catch {
      showToast.error('Refresh Failed', 'Failed to update profile information');
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserData]);

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        {
          icon: User,
          label: 'Full Name',
          value: (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'N/A',
        },
        {
          icon: Mail,
          label: 'Email Address',
          value: user?.email || 'N/A',
        },
      ],
    },
    {
      title: 'Employment Details',
      items: [
        {
          icon: MapPin,
          label: 'Employee ID',
          value: user?.humanReadableId || 'N/A',
        },
        {
          icon: Briefcase,
          label: 'Employment Status',
          value: user?.employmentStatus?.toLowerCase() || 'active',
        },
        {
          icon: Calendar,
          label: 'Can Login',
          value: user?.canLogin ? 'Yes' : 'No',
        },
      ],
    },
  ];

  return (
    <ScrollView
      className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}
        />
      }
    >
      {/* Header */}
      <View className={`pt-12 pb-6 px-6 ${
        colorScheme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-blue-600 to-blue-500'
      }`}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-2xl font-bold ${
            colorScheme === 'dark' ? 'text-white' : 'text-white'
          }`}>
            Profile
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            className="p-2"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
            colorScheme === 'dark' ? 'bg-gray-800' : 'bg-blue-700'
          }`}>
            {user?.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <Text className="text-white text-3xl font-bold">
                {user?.firstName?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <Text className="text-white text-2xl font-bold">
            {(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'User'}
          </Text>
          <Text className={colorScheme === 'dark' ? 'text-gray-300' : 'text-blue-100'}>
            {user?.humanReadableId || 'PGN-2024-0001'}
          </Text>
          <Text className={`text-sm mt-1 ${
            colorScheme === 'dark' ? 'text-gray-400' : 'text-blue-200'
          }`}>
            {user?.employmentStatus?.toLowerCase() || 'active'} •
            {user?.canLogin ? ' Can Login' : ' Login Disabled'}
          </Text>
        </View>
      </View>

      {/* Profile Information Sections */}
      <View className="px-6 py-6">
        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} className="mb-6">
            <Text className={`text-lg font-semibold mb-3 ${
              colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {section.title}
            </Text>
            <View className={`rounded-lg border ${
              colorScheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  className={`flex-row items-center px-4 py-4 ${
                    itemIndex !== section.items.length - 1
                      ? colorScheme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <item.icon size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-sm ${
                      colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {item.label}
                    </Text>
                    <Text className={`font-medium ${
                      colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Actions Section */}
        <View className="mb-6">
          <Text className={`text-lg font-semibold mb-3 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Actions
          </Text>
          <View className={`rounded-lg border overflow-hidden ${
            colorScheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>

            <TouchableOpacity
              onPress={handleSettings}
              className={`flex-row items-center justify-between px-4 py-4 ${
                colorScheme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-100'
              }`}
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <Settings size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </View>
                <Text className={`font-medium ${
                  colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  Settings
                </Text>
              </View>
              <ChevronRight size={20} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  colorScheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <LogOut size={18} color="#EF4444" />
                </View>
                <Text className="text-red-600 font-medium">
                  Log Out
                </Text>
              </View>
              <ChevronRight size={20} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Only Notice */}
        <View className={`rounded-lg p-4 border ${
          colorScheme === 'dark' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <View className="flex-row items-start">
            <Text className="text-lg mr-3">📋</Text>
            <View className="flex-1">
              <Text className={`font-medium text-sm mb-1 ${
                colorScheme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
              }`}>
                View Only Profile
              </Text>
              <Text className={`text-xs leading-4 ${
                colorScheme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'
              }`}>
                Your profile information is managed by your administrator. Please contact HR for any changes to your personal details.
              </Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View className={`rounded-lg p-4 items-center mt-6 ${
          colorScheme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <View className="w-8 h-8 bg-blue-600 rounded-full items-center justify-center mb-2">
            <Text className="text-white text-sm font-bold">P</Text>
          </View>
          <Text className={`text-sm font-medium ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            PGN Mobile v1.0.0
          </Text>
          <Text className={`text-xs mt-1 ${
            colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Employee Management System
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}