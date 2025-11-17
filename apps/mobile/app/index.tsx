import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { View, Text, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const colorScheme = useColorScheme();

  console.log('🏠 IndexScreen: Entry point - Optimistic navigation');

  useEffect(() => {
    const init = async () => {
      console.log('🏠 IndexScreen: Initializing auth for navigation...');
      await initializeAuth();
      console.log('🏠 IndexScreen: Auth initialized, navigating...');
    };

    init();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) {
      console.log('🏠 IndexScreen: Still loading...');
      return;
    }

    console.log('🏠 IndexScreen: Auth state determined, isAuthenticated:', isAuthenticated);

    // Optimistic navigation based on auth state
    if (isAuthenticated) {
      console.log('🏠 IndexScreen: User authenticated, redirecting to dashboard');
      router.replace('/(dashboard)');
    } else {
      console.log('🏠 IndexScreen: User not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View className={`flex-1 justify-center items-center ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-white'
    }`}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className={`mt-4 ${
        colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Loading...
      </Text>
    </View>
  );
}