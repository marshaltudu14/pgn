import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';

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

  // Redirect silently without blocking UI
  if (!isInitialized || isLoading || (requireAuth && !isAuthenticated)) {
    // Don't render anything - let the redirect happen in background
    return null;
  }

  // If user is authenticated but trying to access auth pages, redirect to dashboard silently
  if (!requireAuth && isAuthenticated) {
    router.replace('/(dashboard)/index' as any);
    return null;
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