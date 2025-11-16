import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-store';
import { AuthLoadingScreen } from '@/components/LoadingStates';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };

    init();
  }, [initializeAuth]);

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen message="Authenticating..." />;
  }

  // If already authenticated, the root layout will handle redirection
  return <Slot />;
}