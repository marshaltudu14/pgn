import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthGuard } from '@/utils/auth-guard';
import { Home, LayoutDashboard, User, MapPin } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthGuard requireAuth={true}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#ffffff',
            borderTopColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
            borderTopWidth: 1,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Home size={24} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <LayoutDashboard size={24} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <User size={24} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, focused }) => (
              <MapPin size={24} color={color} fill={focused ? color : 'none'} />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
