import React, { useEffect, useState } from 'react';
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
  }, [isInitialized, isLoading, isAuthenticated, shouldCheckPermissions, permissionsChecked]);

  // Initialize attendance after permissions are granted
  useEffect(() => {
    if (isAuthenticated && !showPermissionsScreen && permissionsChecked && shouldCheckPermissions) {
      // Delay slightly to ensure auth state is stable
      const timer = setTimeout(() => {
        initializePermissions();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, showPermissionsScreen, permissionsChecked, shouldCheckPermissions, initializePermissions]);

  const checkPermissions = async () => {
    try {
      const result = await permissionService.checkAllPermissions();
      setPermissions(result.permissions);


        allGranted: result.allGranted,
        permissions: result.permissions,
        deniedPermissions: result.deniedPermissions,
        undeterminedPermissions: result.undeterminedPermissions,
      });

      // Check if ALL required permissions are granted
      if (!result.allGranted) {


        // Try to request all permissions
        const requestResult = await permissionService.requestAllPermissions();
        setPermissions(requestResult.permissions);


          allGranted: requestResult.allGranted,
          permissions: requestResult.permissions,
        });

        // If after requesting, STILL not all permissions are granted, show permission screen
        if (!requestResult.allGranted) {


            camera: requestResult.permissions.camera,
            location: requestResult.permissions.location,
            notifications: requestResult.permissions.notifications,
          });
          setShowPermissionsScreen(true);
        } else {

        }
      } else {

      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      // Show permission screen on error to be safe
      setShowPermissionsScreen(true);
    } finally {
      setPermissionsChecked(true);
    }
  };

  const handlePermissionsGranted = () => {
    setShowPermissionsScreen(false);
    // Refresh permissions
    checkPermissions();
    // Also initialize attendance after permissions are granted
    initializePermissions();
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

  // Final check: if we're here and shouldCheckPermissions is true, ensure all permissions are granted
  if (shouldCheckPermissions && permissions) {
    const allGranted = permissions.camera === 'granted' &&
                      permissions.location === 'granted' &&
                      permissions.notifications === 'granted';

    if (!allGranted) {


        camera: permissions.camera,
        location: permissions.location,
        notifications: permissions.notifications,
      });
      setShowPermissionsScreen(true);
      return null; // Will re-render with permission screen
    }
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