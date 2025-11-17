import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, ClipboardList, User } from 'lucide-react-native';

interface TabItem {
  key: string;
  icon: React.ComponentType<any>;
  label: string;
  onPress: () => void;
  isActive: boolean;
  disabled?: boolean;
}

interface UnifiedBottomNavigationProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function UnifiedBottomNavigation({
  activeTab = 'home',
  onTabChange
}: UnifiedBottomNavigationProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const handleHomePress = () => {
    if (onTabChange) {
      onTabChange('home');
    }
  };

  const handleTasksPress = () => {
    if (onTabChange) {
      onTabChange('tasks');
    }
  };

  const handleProfilePress = () => {
    if (onTabChange) {
      onTabChange('profile');
    }
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
      key: 'profile',
      icon: User,
      label: 'Profile',
      onPress: handleProfilePress,
      isActive: activeTab === 'profile',
    },
  ];

  const renderTab = (tab: TabItem) => (
    <TouchableOpacity
      key={tab.key}
      style={[
        styles.tab,
        tab.isActive && styles.activeTab,
        tab.disabled && styles.disabledTab,
      ]}
      onPress={tab.onPress}
      disabled={tab.disabled}
      activeOpacity={0.8}
    >
      <View style={styles.tabContent}>
        <tab.icon
          size={20}
          color={tab.isActive
            ? colorScheme === 'dark' ? '#ffffff' : '#1e40af'
            : colorScheme === 'dark' ? '#9ca3af' : '#64748b'
          }
        />
        <Text style={[
          styles.tabLabel,
          tab.isActive && styles.activeTabLabel,
        ]}>
          {tab.label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
        backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
        borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        borderTopWidth: 1,
      }
    ]}>
      <View style={styles.tabsContainer}>
        {tabs.map(tab => renderTab(tab))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 50,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  disabledTab: {
    opacity: 0.5,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#1e40af',
  },
});