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

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
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
    <View className="w-full max-w-sm">
      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-gray-700 text-sm font-medium mb-2">
          Email Address
        </Text>
        <TextInput
          className={`w-full px-4 py-3 border rounded-lg text-gray-900 ${
            emailError
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          } focus:border-blue-500 focus:bg-white`}
          placeholder="Enter your email"
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
        {emailError ? (
          <Text className="text-red-500 text-xs mt-1">{emailError}</Text>
        ) : null}
      </View>

      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-gray-700 text-sm font-medium mb-2">
          Password
        </Text>
        <View className="relative">
          <TextInput
            className={`w-full px-4 py-3 pr-12 border rounded-lg text-gray-900 ${
              passwordError
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 bg-gray-50'
            } focus:border-blue-500 focus:bg-white`}
            placeholder="Enter your password"
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
            className="absolute right-3 top-3.5 p-1"
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Text className="text-gray-500 text-sm">
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <Text className="text-red-500 text-xs mt-1">{passwordError}</Text>
        ) : null}
      </View>

      {/* Error Message */}
      {error ? (
        <View className="mb-4 p-3 bg-red-100 border border-red-400 rounded-lg">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      ) : null}

      {/* Login Button */}
      <TouchableOpacity
        className={`w-full py-3 px-4 rounded-lg flex flex-row items-center justify-center ${
          isLoading
            ? 'bg-blue-400'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onPress={handleSubmit}
        disabled={isLoading || !email.trim() || !password.trim()}
        accessibilityLabel="Sign in"
        accessibilityRole="button"
      >
        {isLoading ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
            <Text className="text-white font-medium">Signing in...</Text>
          </>
        ) : (
          <Text className="text-white font-medium text-center">Sign In</Text>
        )}
      </TouchableOpacity>

      {/* Biometric Login Option */}
      {showBiometricLoginOption && (
        <View className="mt-4 items-center">
          <View className="flex-row items-center">
            <View className="h-px bg-gray-300 flex-1" />
            <Text className="px-4 text-gray-500 text-sm">or</Text>
            <View className="h-px bg-gray-300 flex-1" />
          </View>

          <TouchableOpacity
            className="mt-4 px-6 py-3 border border-gray-300 rounded-lg flex flex-row items-center justify-center"
            onPress={handleBiometricLogin}
            disabled={isLoading}
          >
            <Text className="text-2xl mr-2">👆</Text>
            <Text className="text-gray-700 font-medium">
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