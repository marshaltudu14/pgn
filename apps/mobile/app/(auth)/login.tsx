import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { LoginRequest } from '@pgn/shared';
import LoginForm from '@/components/LoginForm';


export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
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
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)');
        }
      }
      // Error handling is done in the auth store and LoginForm component
    } catch (error) {
      // This catch is for unexpected errors
      console.error('Unexpected login error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Logo and Header */}
          <View className="items-center mb-8">
            <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">PGN</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Sign in to your account to continue
            </Text>
          </View>

          {/* Login Form */}
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />

          {/* Forgot Password Link */}
          <View className="items-center mt-6">
            <TouchableOpacity
              onPress={() => {
                // Placeholder for forgot password functionality
                Alert.alert(
                  'Forgot Password',
                  'Please contact your administrator to reset your password.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text className="text-blue-600 text-sm font-medium">
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Version Info */}
          <View className="items-center mt-auto pt-8">
            <Text className="text-gray-400 text-xs">
              PGN Mobile v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}