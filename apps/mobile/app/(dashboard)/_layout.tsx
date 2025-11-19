import { Slot, useRouter, usePathname } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGuard } from '@/utils/auth-guard';
import UnifiedBottomNavigation from '@/components/UnifiedBottomNavigation';
import { permissionService, AppPermissions } from '@/services/permissions';
import { useState, useEffect } from 'react';
import PermissionsScreen from '../(auth)/permissions';

function ScreenContentWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingBottom: insets.bottom + 70 // Account for bottom nav height + safe area
    }}>
      {children}
    </View>
  );
}

function DashboardLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [showPermissionsScreen, setShowPermissionsScreen] = useState(false);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);

  // Permission checking logic
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await permissionService.checkAllPermissions();
      setPermissions(result.permissions);

      if (!result.allGranted) {
        // Check if any permissions are denied or undetermined
        if (result.deniedPermissions.length > 0 || result.undeterminedPermissions.length > 0) {
          // Try to request permissions
          const requestResult = await permissionService.requestAllPermissions();
          setPermissions(requestResult.permissions);

          if (!requestResult.allGranted) {
            // Still not granted, show permission screen
            setShowPermissionsScreen(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setPermissionsChecked(true);
    }
  };

  const getActiveTab = (currentPath: string): string => {
    if (currentPath === '/(dashboard)' || currentPath === '/(dashboard)/') {
      return 'home';
    } else if (currentPath.includes('/tasks')) {
      return 'tasks';
    } else if (currentPath.includes('/attendance')) {
      return 'attendance';
    } else if (currentPath.includes('/profile')) {
      return 'profile';
    }
    return 'home'; // Default fallback
  };

  const handlePermissionsGranted = () => {
    setShowPermissionsScreen(false);
    // Refresh permissions
    checkPermissions();
  };

  const handleTabChange = (tab: string) => {
    switch (tab) {
      case 'home':
        router.push('/(dashboard)');
        break;
      case 'tasks':
        router.push('/(dashboard)/tasks');
        break;
      case 'profile':
        router.push('/(dashboard)/profile');
        break;
      case 'attendance':
        router.push('/(dashboard)/attendance');
        break;
    }
  };

  // If permissions are not checked yet, don't show anything - checking happens in background
  if (!permissionsChecked) {
    return <View style={{ flex: 1 }} />;
  }

  // Show permission screen if permissions are not granted
  if (showPermissionsScreen && permissions) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right', 'bottom']}>
        <PermissionsScreen
          permissions={permissions}
          onPermissionsGranted={handlePermissionsGranted}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <ScreenContentWrapper>
        <Slot />
      </ScreenContentWrapper>
      <UnifiedBottomNavigation
        activeTab={getActiveTab(pathname)}
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
}

export default function DashboardLayout() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayoutContent />
    </AuthGuard>
  );
}