import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { View, Text, ActivityIndicator } from 'react-native';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = true, redirectTo = '/(auth)/login' }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth, error, handleSessionExpiration } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };

    init();
  }, [initializeAuth]);

  // Monitor for session expiration errors and handle automatic logout
  useEffect(() => {
    if (error && (
      error.includes('session has expired') ||
      error.includes('token has expired') ||
      error.includes('SESSION_EXPIRED') ||
      error.includes('Your session has expired')
    )) {
      handleSessionExpiration();
      // The handleSessionExpiration will update the auth state,
      // and the effect below will handle the redirect
    }
  }, [error, handleSessionExpiration]);

  // Redirect to login when authentication is lost
  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated && requireAuth) {
      router.replace(redirectTo as any);
    }
  }, [isInitialized, isLoading, isAuthenticated, requireAuth, router, redirectTo]);

  // Show loading screen while initializing or redirecting
  if (!isInitialized || isLoading || (requireAuth && !isAuthenticated)) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (!requireAuth && isAuthenticated) {
    router.replace('/(dashboard)/index' as any);
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
}

// Hook for easier usage in components
export function useAuthGuard(requireAuth = true) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };

    init();
  }, [initializeAuth]);

  return {
    isAuthenticated,
    isLoading: isLoading || !isInitialized,
    canAccess: requireAuth ? isAuthenticated : true,
  };
}