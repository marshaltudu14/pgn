import UnifiedBottomNavigation from '@/components/UnifiedBottomNavigation';
import CheckInOutModal from '@/components/CheckInOutModal';
import { AuthGuard } from '@/utils/auth-guard';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useIsCheckedIn } from '@/store/attendance-store';

function DashboardScreenWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom + 60, // Account for bottom nav height + safe area (removed the extra 10)
      }}
    >
      {children}
    </View>
  );
}

function DashboardLayoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const [showCheckInOutModal, setShowCheckInOutModal] = useState(false);
  const [checkInOutMode, setCheckInOutMode] = useState<'checkin' | 'checkout'>('checkin');

  // Attendance hooks
  const isCheckedIn = useIsCheckedIn();

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

  const handleCheckInOut = () => {
    const mode = isCheckedIn ? 'checkout' : 'checkin';
    setCheckInOutMode(mode);
    setShowCheckInOutModal(true);
  };

  const handleCloseCheckInOutModal = () => {
    setShowCheckInOutModal(false);
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
      <DashboardScreenWrapper>
        <Slot />
      </DashboardScreenWrapper>
      <UnifiedBottomNavigation
        activeTab={getActiveTab(pathname)}
        onTabChange={handleTabChange}
        isCheckedIn={isCheckedIn}
        onCheckInOut={handleCheckInOut}
      />

      <CheckInOutModal
        visible={showCheckInOutModal}
        onClose={handleCloseCheckInOutModal}
        mode={checkInOutMode}
      />
    </SafeAreaView>
  );
}

export default function DashboardLayout() {
  return (
    <AuthGuard requireAuth={true} shouldCheckPermissions={true}>
      <DashboardLayoutContent />
    </AuthGuard>
  );
}
