import React from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginRequest } from '@pgn/shared';
import LoginForm from '@/components/LoginForm';
import { createLoginScreenStyles } from './_login-styles';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, error, isAuthenticated } = useAuth();

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
      const result = await login(credentials);

      if (result.success) {
        // Authentication successful, useEffect will handle navigation
      }
      // Error handling is done in the auth store and LoginForm component
    } catch (error) {
      console.error('❌ Login: Unexpected error during login', error);
      // The auth store handles the error state, no need to do anything here
    }
  };

  const colorScheme = useColorScheme();
  const styles = createLoginScreenStyles(colorScheme);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <Text style={styles.title}>
                PGN
              </Text>
              <Text style={styles.subtitle}>
                Employee Portal
              </Text>
            </View>
          </View>

          {/* Login Form Section - Bottom 20-30% of screen */}
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
  );
}