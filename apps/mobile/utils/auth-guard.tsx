import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { AppPermissions, permissionService } from '@/services/permissions';
import { useAttendance } from '@/store/attendance-store';
import PermissionsScreen from '@/app/(auth)/permissions';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  shouldCheckPermissions?: boolean;
}

export function AuthGuard({ children, requireAuth = true, redirectTo = '/(auth)/login', shouldCheckPermissions = false }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth, error, handleSessionExpiration } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [showPermissionsScreen, setShowPermissionsScreen] = useState(false);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);

  // Attendance hooks
  const initializePermissions = useAttendance((state) => state.initializePermissions);

  const checkPermissions = useCallback(async () => {
    try {
      // First check current permissions with detailed location info
      const result = await permissionService.checkAllPermissionsDetailed();
      setPermissions(result.permissions);

      if (result.allGranted) {
        // All permissions already granted - no action needed
        setShowPermissionsScreen(false);
        initializePermissions();
      } else {
        // Any missing permissions (denied, blocked, or undetermined) - show permission screen
        // The permission screen will handle requesting permissions
        setShowPermissionsScreen(true);
      }
    } catch (error) {
      console.error('[AuthGuard] Error checking permissions:', error);
      // Show permission screen on error to be safe
      setShowPermissionsScreen(true);
    } finally {
      setPermissionsChecked(true);
    }
  }, [permissionService, initializePermissions]);

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

  // Check permissions when authenticated and permission checking is enabled
  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated && shouldCheckPermissions && !permissionsChecked) {
      checkPermissions();
    }
  }, [isInitialized, isLoading, isAuthenticated, shouldCheckPermissions, permissionsChecked, checkPermissions]);

  // Monitor permission changes and handle navigation
  useEffect(() => {
    if (isAuthenticated && permissionsChecked && shouldCheckPermissions && permissions) {
      const allGranted = permissions.camera === 'granted' &&
                        permissions.location === 'granted' &&
                        permissions.notifications === 'granted';

      if (allGranted) {
        // All permissions granted - hide permission screen and initialize
        if (showPermissionsScreen) {
          setShowPermissionsScreen(false);
        }
        initializePermissions();
      } else {
        // Some permissions missing - show permission screen
        if (!showPermissionsScreen) {
          setShowPermissionsScreen(true);
        }
      }
    }
  }, [isAuthenticated, permissionsChecked, shouldCheckPermissions, permissions, showPermissionsScreen, initializePermissions]);

  
  const handlePermissionsGranted = () => {
    // Just hide the permission screen - the useEffect will handle the rest
    setShowPermissionsScreen(false);
    // Re-check permissions after hiding screen
    setPermissionsChecked(false);
  };

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

  // Show permission screen if permissions are not granted and permission checking is enabled
  if (shouldCheckPermissions && showPermissionsScreen) {

    return (
      <SafeAreaView
        style={{ flex: 1 }}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <PermissionsScreen
          permissions={permissions || { camera: 'denied', location: 'denied', notifications: 'denied' }}
          onPermissionsGranted={handlePermissionsGranted}
        />
      </SafeAreaView>
    );
  }

  
  // Render children if all checks pass

  return <>{children}</>;
}

// Hook for easier usage in components
export function useAuthGuard(requireAuth = true) {
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