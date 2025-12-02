import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '@/store/auth-store';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import {
  User,
  Mail,
  MapPin,
  Moon,
  Sun,
  LogOut
} from 'lucide-react-native';
import { showToast } from '@/utils/toast';
import { newProfileStyles } from '@/styles/profile/profile-styles';

export default function ProfileScreen() {
  const { user, logout, refreshUserData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showToast.success('Logged out successfully');
            } catch {
              showToast.error('Failed to logout');
            }
          },
        },
      ]
    );
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

  const getThemeIcon = () => {
    return theme === 'light' ? Sun : Moon;
  };

  const getThemeText = () => {
    return theme === 'light' ? 'Light Mode' : 'Dark Mode';
  };

  const profileItems = [
    {
      icon: User,
      label: 'Full Name',
      value: (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : '-',
    },
    {
      icon: Mail,
      label: 'Email Address',
      value: user?.email || '-',
    },
    {
      icon: MapPin,
      label: 'Employee ID',
      value: user?.humanReadableId || '-',
    },
    {
      icon: User,
      label: 'Phone',
      value: user?.phone || '-',
    },
  ];

  const menuItems = [
    {
      icon: getThemeIcon(),
      label: 'Theme',
      value: getThemeText(),
      onPress: toggleTheme,
      showChevron: false,
    },
    {
      icon: LogOut,
      label: 'Logout',
      value: '',
      onPress: handleLogout,
      showChevron: false,
      isDestructive: true,
    },
  ];

  return (
    <ScrollView
      style={[newProfileStyles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.textSecondary}
        />
      }
    >
      {/* Profile Info */}
      <View style={newProfileStyles.profileSection}>
        <View style={[newProfileStyles.avatarContainer, { backgroundColor: colors.profileBg }]}>
          {user?.profilePhotoUrl ? (
            <Image
              source={{ uri: user.profilePhotoUrl }}
              style={newProfileStyles.avatar}
            />
          ) : (
            <Text style={newProfileStyles.avatarText}>
              {user?.firstName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <Text style={[newProfileStyles.profileName, { color: colors.text }]}>
          {(user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : 'User'}
        </Text>
        <Text style={[newProfileStyles.profileSubtitle, { color: colors.textSecondary }]}>
          {user?.humanReadableId || 'PGN-2024-0001'}
        </Text>
      </View>

      {/* Profile Information List */}
      <View style={[newProfileStyles.content, { paddingBottom: 0 }]}>
        <Text style={[newProfileStyles.sectionTitle, { color: colors.text }]}>
          Personal Information
        </Text>

        {profileItems.map((item, index) => (
          <View
            key={index}
            style={[
              newProfileStyles.listItem,
              { borderBottomWidth: 0 }
            ]}
          >
            <View style={[newProfileStyles.iconContainer, { backgroundColor: colors.iconBg }]}>
              <item.icon size={20} color={colors.textSecondary} />
            </View>
            <View style={newProfileStyles.itemContent}>
              <Text style={[newProfileStyles.itemLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[newProfileStyles.itemValue, { color: colors.text }]}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Menu Options */}
      <View style={newProfileStyles.content}>
        <Text style={[newProfileStyles.sectionTitle, { color: colors.text }]}>
          Settings
        </Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              newProfileStyles.listItem,
              { borderBottomWidth: 0 }
            ]}
            onPress={item.onPress}
          >
            <View style={[
              newProfileStyles.iconContainer,
              { backgroundColor: item.isDestructive ? colors.errorBg : colors.iconBg }
            ]}>
              <item.icon size={20} color={item.isDestructive ? colors.error : colors.textSecondary} />
            </View>
            <View style={newProfileStyles.itemContent}>
              <Text style={[
                newProfileStyles.itemLabel,
                { color: item.isDestructive ? colors.error : colors.text }
              ]}>
                {item.label}
              </Text>
              <Text style={[newProfileStyles.itemValue, { color: colors.textTertiary }]}>
                {item.value}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}