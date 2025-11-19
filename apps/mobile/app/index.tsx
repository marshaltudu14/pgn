import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { Text, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
    };

    init();
  }, [initializeAuth]);

  useEffect(() => {
    const handleAuthFlow = async () => {
      if (isLoading) {
        return;
      }

      if (isAuthenticated) {
        // User is already authenticated, go to dashboard
        router.replace('/(dashboard)');
        return;
      }

      // User not authenticated, go to regular login
      router.replace('/(auth)/login');
    };

    handleAuthFlow();
  }, [isAuthenticated, isLoading, router]);

  return (
    <SafeAreaView className={`flex-1 justify-center items-center ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-white'
    }`} edges={['top', 'left', 'right']}>
      <ActivityIndicator size="large" color="#FFB74D" />
      <Text className={`mt-4 ${
        colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Loading...
      </Text>
    </SafeAreaView>
  );
}