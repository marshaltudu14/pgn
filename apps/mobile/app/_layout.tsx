import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/store/auth-store';
import { useEffect } from 'react';
import { ToastProvider } from '@/components/Toast';

export const unstable_settings = {
  anchor: '(dashboard)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Update navigation bar style based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colorScheme === 'dark' ? '#000000' : '#FFFFFF');
      NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
    }
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutContent />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();

  useEffect(() => {
    // Initialize authentication state when the app loads
    const initAuth = async () => {
      await initializeAuth();
    };

    initAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Handle navigation based on authentication state
    if (!isLoading) {
      if (isAuthenticated) {
        // User is authenticated, ensure they're not on auth screens
        // We'll handle this at the route level instead of checking pathname
        router.replace('/(dashboard)/index');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
        }}>
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="(dashboard)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            title: 'Modal'
          }}
        />
      </Stack>
    </ToastProvider>
  );
}