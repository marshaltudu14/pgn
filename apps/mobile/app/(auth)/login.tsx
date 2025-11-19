import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginRequest } from '@pgn/shared';
import LoginForm from '@/components/LoginForm';
import BiometricPrompt from '@/components/BiometricPrompt';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated, checkBiometricAvailability, enableBiometricAuthentication, biometricEnabled } = useAuth();
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [isSettingUpBiometric, setIsSettingUpBiometric] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(dashboard)');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (credentials: LoginRequest): Promise<void> => {
    try {
      // The login function will handle loading states and update the auth store
      // The useEffect below will handle the redirection when isAuthenticated changes
      const result = await login(credentials);

      if (result.success) {
        // Check if biometrics are available and not already enabled
        if (!biometricEnabled) {
          const biometricCheck = await checkBiometricAvailability();
          if (biometricCheck.success && biometricCheck.type && biometricCheck.type.length > 0) {
            // Show biometric setup prompt
            setShowBiometricPrompt(true);
            return; // Don't navigate yet, wait for biometric setup decision
          }
        }

        // If biometrics are not available or already enabled, the useEffect will handle navigation
        // when isAuthenticated state changes
      }
      // Error handling is done in the auth store and LoginForm component
    } catch (error) {
      console.error('❌ Login: Unexpected error during login', error);
      // The auth store handles the error state, no need to do anything here
    }
  };

  const handleBiometricSetup = async () => {
    setIsSettingUpBiometric(true);
    setBiometricError(null);

    try {
      const result = await enableBiometricAuthentication();
      if (result.success) {
        // Successfully set up biometrics
        setShowBiometricPrompt(false);
        router.replace('/(dashboard)');
      } else {
        setBiometricError(result.error || 'Failed to set up biometric authentication');
      }
    } catch {
      setBiometricError('An unexpected error occurred while setting up biometrics');
    } finally {
      setIsSettingUpBiometric(false);
    }
  };

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false);
    router.replace('/(dashboard)');
  };

  const colorScheme = useColorScheme();

  return (
    <KeyboardAvoidingView
      className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* Header Section - Top row with image and text */}
          <View className="flex-[3] justify-start items-center px-6 pt-16">
            <View className="items-center mb-8">
              <Image
                source={require('@/images/pgn-logo-transparent.png')}
                className="w-32 h-32 mb-2"
                resizeMode="contain"
              />
              <Text className={`text-4xl font-bold text-center mb-2 ${
                colorScheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                PGN
              </Text>
              <Text className={`text-sm text-center ${
                colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Employee Portal
              </Text>
            </View>
          </View>

          {/* Login Form Section - Bottom 20-30% of screen */}
          <View className="flex-[1] justify-start items-center px-6 pb-8">
            <View className="w-full max-w-sm">
              <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Biometric Setup Prompt */}
      <BiometricPrompt
        visible={showBiometricPrompt}
        onClose={handleSkipBiometric}
        onSetup={handleBiometricSetup}
        onSkip={handleSkipBiometric}
        isLoading={isSettingUpBiometric}
        error={biometricError}
      />
    </KeyboardAvoidingView>
  );
}