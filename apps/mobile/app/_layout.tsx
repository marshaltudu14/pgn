import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import { AuthGuard } from '@/utils/auth-guard';

// Keep the splash screen visible while we initialize the app
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'dashboard',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  // Initialize app and hide splash screen when ready
  useEffect(() => {
    async function prepare() {
      try {
        // Add any async initialization here (e.g., loading assets, checking auth state)
        await new Promise(resolve => setTimeout(resolve, 1000)); // Minimum splash screen display
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide splash screen when app is ready
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  // Update navigation bar style based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Only set button style since background color is not supported with edge-to-edge enabled
      NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
    }
  }, [colorScheme]);

  if (!appIsReady) {
    return null;
  }

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
    return (
      <ToastProvider>
        <AuthGuard requireAuth={false}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </AuthGuard>
      </ToastProvider>
    );
}