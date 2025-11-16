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
      className="flex-1 bg-background"
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
          <View className="items-center mb-12">
            <View className="w-28 h-28 rounded-3xl items-center justify-center mb-6 overflow-hidden shadow-2xl bg-card border-2 border-primary/20">
              <Image
                source={require('@/images/pgn-logo.jpg')}
                className="w-24 h-24 rounded-2xl"
                resizeMode="cover"
              />
            </View>
            <Text className="text-4xl font-bold text-foreground text-center mb-2">
              Welcome Back
            </Text>
            <Text className="text-muted-foreground text-center text-lg leading-6">
              Sign in to access your account and continue your work
            </Text>
          </View>

          {/* Login Form Card */}
          <View className="card-surface p-8 mb-6 shadow-2xl">
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          </View>

          {/* Version Info */}
          <View className="items-center mt-8">
            <Text className="text-muted-foreground/60 text-sm font-medium">
              PGN Mobile v1.0.0
            </Text>
            <Text className="text-muted-foreground/40 text-xs mt-1">
              Enterprise Attendance System
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}