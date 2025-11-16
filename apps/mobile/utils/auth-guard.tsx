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
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    router.replace(redirectTo as any);
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Redirecting...</Text>
      </View>
    );
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard
  if (!requireAuth && isAuthenticated) {
    router.replace('/(tabs)' as any);
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