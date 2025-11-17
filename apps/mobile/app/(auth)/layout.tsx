import { Slot, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-store';
import { AuthLoadingScreen } from '@/components/LoadingStates';

export default function AuthLayout() {
  console.log('🔐 AuthLayout: Rendering auth layout');
  const { isLoading, initializeAuth, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('🔐 AuthLayout: Initializing auth...');
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
      console.log('🔐 AuthLayout: Auth initialized, is authenticated:', isAuthenticated);
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

  return <Slot />;
}