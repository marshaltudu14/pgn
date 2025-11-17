import { Slot, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-store';
import { AuthLoadingScreen } from '@/components/LoadingStates';
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

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen message="Authenticating..." />;
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Slot />
    </SafeAreaView>
  );
}