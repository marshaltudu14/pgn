import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/Toast';
import { ThemeProvider as AppThemeProvider } from '@/contexts/theme-context';
import { useEffect, useState } from 'react';
import { RootThemeWrapper } from '@/components/RootThemeWrapper';

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

function RootLayoutContent() {
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

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <RootContent />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootContent() {
    return (
      <RootThemeWrapper>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </ToastProvider>
      </RootThemeWrapper>
    );
}