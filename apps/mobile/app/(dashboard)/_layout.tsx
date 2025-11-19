import { Slot, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthGuard } from '@/utils/auth-guard';
import UnifiedBottomNavigation from '@/components/UnifiedBottomNavigation';

export default function DashboardLayout() {
  const router = useRouter();

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
    <AuthGuard requireAuth={true}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Slot />
        <UnifiedBottomNavigation onTabChange={handleTabChange} />
      </SafeAreaView>
    </AuthGuard>
  );
}