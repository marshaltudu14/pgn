import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LoginRequest } from '@pgn/shared';
import { showToast } from '@/utils/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/store/auth-store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Spinner from '@/components/Spinner';

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => Promise<void>;
  isLoggingIn?: boolean;
  error?: string | null;
}

export default function LoginForm({ onSubmit, isLoggingIn = false, error }: LoginFormProps) {
  const colorScheme = useColorScheme();
  const { canUseBiometricLogin, biometricLogin } = useAuth();
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

  const handleSubmit = async () => {
    if (validateForm()) {
      await onSubmit({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
    }
  };

  
  const handleBiometricLogin = async () => {
    try {
      const result = await biometricLogin();

      if (result.success) {
        // The auth store will handle the success state
        showToast.success(
          'Biometric Login',
          'Successfully logged in with biometrics',
          3000
        );
      } else {
        showToast.error(
          'Biometric Login Failed',
          result.error || 'Failed to authenticate with biometrics',
          4000
        );
      }
    } catch {
      showToast.error(
        'Biometric Login Error',
        'An unexpected error occurred during biometric login',
        4000
      );
    }
  };

  return (
    <View className="w-full px-2">
      {/* Email Input Section */}
      <View className="mb-8">
        <Text className={`font-medium text-xs ml-1 mb-3 ${
          colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Email Address
        </Text>
        <View className="relative">
          <View className="absolute left-3 top-3 z-10">
            <Mail size={18} color="#9CA3AF" />
          </View>
          <TextInput
            className={`input-field pl-10 pr-3 text-sm ${
              emailError
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
            editable={!isLoggingIn}
            accessibilityLabel="Email address"
            accessibilityHint="Enter your company email address"
          />
        </View>
        {emailError ? (
          <View className="flex-row items-center mt-2 ml-1">
            <Text className="text-red-500 text-xs font-medium">{emailError}</Text>
          </View>
        ) : null}
      </View>

      {/* Password Input Section */}
      <View className="mb-8">
        <Text className={`font-medium text-xs ml-1 mb-3 ${
          colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Password
        </Text>
        <View className="relative">
          <View className="absolute left-3 top-3 z-10">
            <Lock size={18} color="#9CA3AF" />
          </View>
          <TextInput
            className={`input-field pl-10 pr-10 text-sm ${
              passwordError
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
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
            editable={!isLoggingIn}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
          />
          <TouchableOpacity
            className="absolute right-3 top-3 p-1"
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoggingIn}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} color="#9CA3AF" />
            ) : (
              <Eye size={18} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <View className="flex-row items-center mt-2 ml-1">
            <Text className="text-red-500 text-xs font-medium">{passwordError}</Text>
          </View>
        ) : null}
      </View>

      {/* Error Message Section */}
      {error ? (
        <View className={`border rounded-lg p-3 mb-8 ${
          colorScheme === 'dark'
            ? 'bg-red-900/20 border-red-800'
            : 'bg-red-50 border-red-200'
        }`}>
          <Text className={`text-xs font-medium ${
            colorScheme === 'dark' ? 'text-red-400' : 'text-red-700'
          }`}>{error}</Text>
        </View>
      ) : null}

      {/* Login Button Section */}
      <View className="mb-6">
        <TouchableOpacity
          className={`primary-button py-3 ${
            isLoggingIn || !email.trim() || !password.trim()
              ? 'opacity-50'
              : 'opacity-100 active:scale-[0.98]'
          } transition-all duration-200`}
          onPress={handleSubmit}
          disabled={isLoggingIn || !email.trim() || !password.trim()}
          accessibilityLabel="Sign in"
          accessibilityRole="button"
        >
          {isLoggingIn ? (
            <View className="flex-row items-center justify-center">
              <Spinner size={16} color="#000000" />
              <Text className="text-black font-semibold text-sm ml-2">Signing in...</Text>
            </View>
          ) : (
            <Text className="text-black font-semibold text-sm text-center">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Biometric Login Option */}
      {canUseBiometricLogin && (
        <View className="items-center">
          <View className="flex-row items-center py-2">
            <View className={`h-px flex-1 ${
              colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
            }`} />
            <Text className={`px-4 text-xs font-medium ${
              colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>or</Text>
            <View className={`h-px flex-1 ${
              colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'
            }`} />
          </View>

          <TouchableOpacity
            className="secondary-button active:scale-[0.98] transition-all duration-200 py-3"
            onPress={handleBiometricLogin}
            disabled={isLoggingIn}
          >
            <View className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 items-center justify-center mr-2">
              <Lock size={14} color="#FFB74D" />
            </View>
            <Text className={`font-semibold text-sm ${
              colorScheme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Sign in with Biometrics
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

