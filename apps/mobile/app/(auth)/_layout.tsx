import { Slot, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/store/auth-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthLayout() {
    const { isLoading, initializeAuth, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
      const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
        };

    init();
  }, [initializeAuth, isAuthenticated]);

  // Listen for app state changes to check token validity when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, check if token needs refresh
        await initializeAuth();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [initializeAuth]);

  // Don't show loading screen - let redirect happen in background
  if (!isInitialized || isLoading) {
    return null;
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <Slot />
    </SafeAreaView>
  );
}