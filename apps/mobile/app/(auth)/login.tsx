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

  const handleLogin = async (credentials: LoginRequest) => {
    try {
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

        // Navigate to dashboard after successful login (or no biometrics available)
        router.replace('/(dashboard)');
      }
      // Error handling is done in the auth store and LoginForm component
    } catch {
      // This catch is for unexpected errors - silently handle
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
        <View className="flex-1 px-6 py-8 justify-center">
          {/* Logo Section */}
          <View className="items-center mb-10">
            <View className={`w-24 h-24 rounded-2xl items-center justify-center mb-5 overflow-hidden shadow-xl ${
              colorScheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            } border`}>
              <Image
                source={require('@/images/pgn-logo.jpg')}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
              />
            </View>
            <Text className={`text-2xl font-bold text-center mb-2 ${
              colorScheme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              PGN
            </Text>
            <Text className={`text-center text-sm leading-5 ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Sign in to access your account
            </Text>
          </View>

          {/* Login Form */}
          <View className="w-full">
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
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