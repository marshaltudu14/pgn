import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { ToastProvider } from '@/components/Toast';
import { AuthGuard } from '@/utils/auth-guard';

export const unstable_settings = {
  anchor: 'dashboard',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Update navigation bar style based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Only set button style since background color is not supported with edge-to-edge enabled
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
    return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
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
    </SafeAreaView>
  );
}