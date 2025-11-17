import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthGuard } from '@/utils/auth-guard';
import UnifiedBottomNavigation from '@/components/UnifiedBottomNavigation';

// Import screen components
import IndexScreen from './index';
import TasksScreen from './tasks';
import ProfileScreen from './profile';

export default function DashboardLayout() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = useState('home');
  const insets = useSafeAreaInsets();

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <IndexScreen />;
      case 'tasks':
        return <TasksScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <IndexScreen />;
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <View style={[
        styles.container,
        {
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
          paddingTop: insets.top
        }
      ]}>
        <View style={styles.screenContainer}>
          {renderActiveScreen()}
        </View>
        {/* DEBUG: Visual indicator */}
        <View style={{
          position: 'absolute',
          top: 100,
          left: 10,
          backgroundColor: 'red',
          padding: 10,
          borderRadius: 5,
          zIndex: 1000
        }}>
          <Text style={{ color: 'white', fontSize: 12 }}>
            DEBUG: activeTab = {activeTab}
          </Text>
        </View>
        <UnifiedBottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  screenContainer: {
    flex: 1,
    paddingBottom: 80, // Add padding to account for bottom navigation
  },
});