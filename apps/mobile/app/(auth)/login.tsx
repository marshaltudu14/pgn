import React from 'react';
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


export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(dashboard)/index');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (credentials: LoginRequest) => {
    try {
      const result = await login(credentials);

      if (result.success) {
        // Check if biometric setup should be offered
        if (result.requiresBiometricSetup) {
          // For now, just navigate to dashboard
          // In a real app, you might show a biometric setup screen
          router.replace('/(dashboard)/index');
        } else {
          router.replace('/(dashboard)/index');
        }
      }
      // Error handling is done in the auth store and LoginForm component
    } catch {
      // This catch is for unexpected errors - silently handle
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
              PGN Team
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
    </KeyboardAvoidingView>
  );
}