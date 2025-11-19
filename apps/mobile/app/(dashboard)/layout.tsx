import { Slot, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthGuard } from '@/utils/auth-guard';
import { useEffect } from 'react';
import UnifiedBottomNavigation from '@/components/UnifiedBottomNavigation';

export default function DashboardLayout() {
  const colorScheme = useColorScheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff' }]} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Slot />
        </View>
        <UnifiedBottomNavigation onTabChange={handleTabChange} />
      </SafeAreaView>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navigation
  },
});