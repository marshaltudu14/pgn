import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Home, ClipboardList, User, Calendar, ArrowUp, ArrowDown } from 'lucide-react-native';
import { COLORS } from '@/constants';

interface TabItem {
  key: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

interface UnifiedBottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isCheckedIn?: boolean;
  onCheckInOut?: () => void;
}

const TabButton: React.FC<{
  item: TabItem;
  colorScheme?: 'light' | 'dark' | null;
}> = ({ item, colorScheme }) => {
  const getIconColor = () => {
    if (item.disabled) return '#9ca3af';
    return item.isActive
      ? COLORS.SAFFRON // Active state
      : (colorScheme === 'dark' ? '#9ca3af' : '#64748b');
  };

  const getTextColor = () => {
    if (item.disabled) return '#9ca3af';
    return item.isActive
      ? COLORS.SAFFRON // Active state
      : (colorScheme === 'dark' ? '#9ca3af' : '#64748b');
  };

  return (
    <TouchableOpacity
      style={[styles.tabButton, item.disabled && styles.disabledTab]}
      onPress={item.disabled ? undefined : item.onPress}
      activeOpacity={item.disabled ? 1 : 0.7}
      disabled={item.disabled}
    >
      <item.icon
        size={24}
        color={getIconColor()}
      />
      <Text style={[styles.tabLabel, { color: getTextColor() }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

export default function UnifiedBottomNavigation({
  activeTab = 'home',
  onTabChange,
  isCheckedIn = false,
  onCheckInOut,
}: UnifiedBottomNavigationProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleHomePress = () => {
    if (onTabChange) onTabChange('home');
  };

  const handleTasksPress = () => {
    if (onTabChange) onTabChange('tasks');
  };

  const handleAttendancePress = () => {
    if (onTabChange) onTabChange('attendance');
  };

  const handleProfilePress = () => {
    if (onTabChange) onTabChange('profile');
  };

  const tabs: TabItem[] = [
    {
      key: 'home',
      icon: Home,
      label: 'Home',
      onPress: handleHomePress,
      isActive: activeTab === 'home',
    },
    {
      key: 'tasks',
      icon: ClipboardList,
      label: 'Tasks',
      onPress: handleTasksPress,
      isActive: activeTab === 'tasks',
    },
    {
      key: 'attendance',
      icon: Calendar,
      label: 'Attendance',
      onPress: handleAttendancePress,
      isActive: activeTab === 'attendance',
    },
    {
      key: 'profile',
      icon: User,
      label: 'Profile',
      onPress: handleProfilePress,
      isActive: activeTab === 'profile',
    },
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
        paddingBottom: Math.max(insets.bottom, 8), // Use safe area inset or minimum padding
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
      }
    ]}>
      {tabs.slice(0, 2).map((tab) => (
        <TabButton key={tab.key} item={tab} colorScheme={colorScheme} />
      ))}

      {/* Check In/Out Button in Center */}
      <TouchableOpacity
        style={[
          styles.checkInOutButton,
          {
            backgroundColor: isCheckedIn ? '#ef4444' : '#10b981', // Red for checkout, green for checkin
          },
        ]}
        onPress={onCheckInOut}
      >
        {isCheckedIn ? (
          <ArrowDown size={28} color="white" />
        ) : (
          <ArrowUp size={28} color="white" />
        )}
      </TouchableOpacity>

      {tabs.slice(2).map((tab) => (
        <TabButton key={tab.key} item={tab} colorScheme={colorScheme} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  disabledTab: {
    opacity: 0.5,
  },
  checkInOutButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // Make it float above the nav bar
  },
});