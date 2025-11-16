import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LoginRequest } from '@pgn/shared';
import { showToast } from '@/utils/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
    }
  };

  
  const handleBiometricLogin = () => {
    showToast.info(
      'Biometric Login',
      'Biometric authentication will be available in the next update.',
      4000
    );
  };

  return (
    <View className="w-full space-y-6">
      {/* Email Input */}
      <View className="space-y-2">
        <Text className="text-foreground font-semibold text-base ml-1">
          Email Address
        </Text>
        <View className="relative">
          <View className="absolute left-4 top-4 z-10">
            <Mail size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className={`input-field pl-12 pr-4 ${
              emailError
                ? 'border-red-500 bg-red-50/10 dark:bg-red-900/10'
                : 'border-border bg-input'
            } focus:border-primary focus:ring-2 focus:ring-primary/20`}
            placeholder="Enter your email address"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your company email address"
          />
        </View>
        {emailError ? (
          <View className="flex-row items-center mt-2 ml-1">
            <Text className="text-red-500 text-sm font-medium">{emailError}</Text>
          </View>
        ) : null}
      </View>

      {/* Password Input */}
      <View className="space-y-2">
        <Text className="text-foreground font-semibold text-base ml-1">
          Password
        </Text>
        <View className="relative">
          <View className="absolute left-4 top-4 z-10">
            <Lock size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className={`input-field pl-12 pr-12 ${
              passwordError
                ? 'border-red-500 bg-red-50/10 dark:bg-red-900/10'
                : 'border-border bg-input'
            } focus:border-primary focus:ring-2 focus:ring-primary/20`}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
          />
          <TouchableOpacity
            className="absolute right-4 top-4 p-1"
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} color="#9CA3AF" />
            ) : (
              <Eye size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <View className="flex-row items-center mt-2 ml-1">
            <Text className="text-red-500 text-sm font-medium">{passwordError}</Text>
          </View>
        ) : null}
      </View>

      {/* Error Message */}
      {error ? (
        <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <Text className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</Text>
        </View>
      ) : null}

      {/* Login Button */}
      <TouchableOpacity
        className={`primary-button ${
          isLoading || !email.trim() || !password.trim()
            ? 'opacity-50'
            : 'opacity-100 active:scale-[0.98]'
        } transition-all duration-200`}
        onPress={handleSubmit}
        disabled={isLoading || !email.trim() || !password.trim()}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color={colorScheme === 'dark' ? '#000000' : '#000000'} className="mr-3" />
            <Text className="text-primary-foreground font-semibold text-base">Signing in...</Text>
          </>
        ) : (
          <Text className="text-primary-foreground font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Biometric Login Option */}
      {showBiometricLoginOption && (
        <View className="items-center">
          <View className="flex-row items-center py-2">
            <View className="h-px bg-border flex-1" />
            <Text className="px-4 text-muted-foreground text-sm font-medium">or</Text>
            <View className="h-px bg-border flex-1" />
          </View>

          <TouchableOpacity
            className="secondary-button active:scale-[0.98] transition-all duration-200"
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
              <Lock size={18} color={colorScheme === 'dark' ? '#FFA726' : '#FFB74D'} />
            </View>
            <Text className="text-accent-foreground font-semibold text-base">
              Sign in with Biometrics
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Temporary flag for biometric login option
// This will be controlled by auth state in the future
const showBiometricLoginOption = false;