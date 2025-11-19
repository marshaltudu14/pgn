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
import { secureStorage } from '@/services/secure-storage';
import { LoginRequest } from '@pgn/shared';
import LoginForm from '@/components/LoginForm';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, error, isAuthenticated, biometricEnabled } = useAuth();

  // Handle post-login redirection
  React.useEffect(() => {
    const handlePostLoginRedirect = async () => {
      if (isAuthenticated) {
        // Check if biometrics are already enabled
        if (!biometricEnabled) {
          // Check if user has previously declined biometric setup
          try {
            const biometricPrefs = await secureStorage.getBiometricPreferences();
            const hasDeclined = biometricPrefs?.hasDeclined === true;

            if (hasDeclined) {
              // User previously declined, go directly to dashboard
              router.replace('/(dashboard)');
            } else {
              // Redirect to biometric setup screen for first-time users
              router.replace('/(auth)/biometric-setup?fromLogin=true');
            }
          } catch (error) {
            console.error('Error checking biometric preferences:', error);
            // Default to dashboard if there's an error
            router.replace('/(dashboard)');
          }
        } else {
          // Biometrics already set up, go to dashboard
          router.replace('/(dashboard)');
        }
      }
    };

    handlePostLoginRedirect();
  }, [isAuthenticated, router, biometricEnabled]);

  const handleLogin = async (credentials: LoginRequest): Promise<void> => {
    try {
      // The login function will handle loading states and update the auth store
      // The useEffect below will handle the redirection when isAuthenticated changes
      const result = await login(credentials);

      if (result.success) {
        // If biometrics are already enabled, let the useEffect handle normal navigation
        // If not enabled, we'll redirect to biometric setup screen in the useEffect
      }
      // Error handling is done in the auth store and LoginForm component
    } catch (error) {
      console.error('❌ Login: Unexpected error during login', error);
      // The auth store handles the error state, no need to do anything here
    }
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
                isLoggingIn={isLoggingIn}
                error={error}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}