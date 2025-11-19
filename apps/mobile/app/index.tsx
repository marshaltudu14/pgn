import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { Text, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { secureStorage } from '@/services/secure-storage';

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth, biometricLogin, canUseBiometricAutoLogin } = useAuth();
  const colorScheme = useColorScheme();
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

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

      // User not authenticated, check if they have biometric enabled for auto-login
      const canUseBiometric = await canUseBiometricAutoLogin();

      if (canUseBiometric) {
        try {
          setAttemptingBiometric(true);
          console.log('🔐 Attempting biometric auto-login...');

          const result = await biometricLogin();

          if (result.success) {
            console.log('✅ Biometric auto-login successful');
            // The auth state will update and trigger the useEffect again
            return;
          } else {
            console.log('❌ Biometric auto-login failed:', result.error);
            // Biometric failed, fall back to regular login
            router.replace('/(auth)/login');
          }
        } catch (error) {
          console.error('❌ Biometric auto-login error:', error);
          // Biometric error, fall back to regular login
          router.replace('/(auth)/login');
        } finally {
          setAttemptingBiometric(false);
        }
      } else {
        // No biometric available, go to regular login
        router.replace('/(auth)/login');
      }
    };

    handleAuthFlow();
  }, [isAuthenticated, isLoading]);

  return (
    <SafeAreaView className={`flex-1 justify-center items-center ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-white'
    }`} edges={['top', 'left', 'right']}>
      <ActivityIndicator size="large" color="#FFB74D" />
      <Text className={`mt-4 ${
        colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {attemptingBiometric ? 'Authenticating with biometric...' : 'Loading...'}
      </Text>
    </SafeAreaView>
  );
}