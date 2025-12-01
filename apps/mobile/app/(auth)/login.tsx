import LoginForm from '@/components/LoginForm';
import { useTheme } from '@/contexts/theme-context';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useAuth, useIsAuthenticated } from '@/store/auth-store';
import { LoginRequest } from '@pgn/shared';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createLoginScreenStyles } from '@/styles/auth/login-styles';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, error } = useAuth();
  const isAuthenticated = useIsAuthenticated();

  // Handle post-login redirection
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(dashboard)');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (credentials: LoginRequest): Promise<void> => {
    try {
      // The login function will handle loading states and update the auth store
      // The useEffect below will handle the redirection when isAuthenticated changes
      await login(credentials);
      // Error handling is done in the auth store and LoginForm component
    } catch (error) {
      console.error('Login: Unexpected error during login', error);
      // The auth store handles the error state, no need to do anything here
    }
  };

  const { resolvedTheme } = useTheme();
  const colors = useThemeColors();
  const styles = createLoginScreenStyles(resolvedTheme, colors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContainer}>
            {/* Header Section - Top row with image and text */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/images/pgn-logo-transparent.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  PGN
                </Text>
                <Text style={styles.subtitle}>
                  Employee Portal
                </Text>
              </View>
            </View>

            {/* Login Form Section */}
            <View style={styles.formSection}>
              <View style={styles.formContainer}>
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
    </SafeAreaView>
  );
}