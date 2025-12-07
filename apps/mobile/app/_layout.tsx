import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';

// Configure Reanimated logger to reduce warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Disable strict mode to reduce warnings
});

// Keep the splash screen visible while we initialize the app
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'dashboard',
};

export default function RootLayout() {
  return <RootLayoutContent />;
}

function ThemeAwareSystemBars() {
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();

  // Update Android navigation bar when theme changes
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
    }
  }, [resolvedTheme, colors.background]);

  return (
    <StatusBar
      style={resolvedTheme === 'dark' ? 'light' : 'dark'}
    />
  );
}

function RootLayoutContent() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();

  const navigationTheme = resolvedTheme === 'dark' ? DarkTheme : DefaultTheme;

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

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ThemeProvider value={navigationTheme}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
            <RootContent />
            <ThemeAwareSystemBars />
          </GestureHandlerRootView>
        </ThemeProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootContent() {
    return (
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </ToastProvider>
    );
}