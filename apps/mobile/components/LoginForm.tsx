import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LoginRequest } from '@pgn/shared';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import Spinner from '@/components/Spinner';
import { createLoginFormStyles } from '@/app/(auth)/_login-styles';

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => Promise<void>;
  isLoggingIn?: boolean;
  error?: string | null;
}

export default function LoginForm({ onSubmit, isLoggingIn = false, error }: LoginFormProps) {
  const colorScheme = useColorScheme();
  const styles = createLoginFormStyles(colorScheme);
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

  return (
    <View style={styles.container}>
      {/* Email Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>
          Email Address
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconContainer}>
            <Mail size={18} color="#9CA3AF" />
          </View>
          <TextInput
            style={[
              styles.input,
              emailError ? styles.inputWithError : styles.inputNormal
            ]}
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{emailError}</Text>
          </View>
        ) : null}
      </View>

      {/* Password Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>
          Password
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconContainer}>
            <Lock size={18} color="#9CA3AF" />
          </View>
          <TextInput
            style={[
              styles.input,
              passwordError ? styles.inputWithError : styles.inputNormal
            ]}
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
            style={styles.passwordToggle}
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
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{passwordError}</Text>
          </View>
        ) : null}
      </View>

      {/* Error Message Section */}
      {error ? (
        <View style={[
          styles.errorMessageContainer,
          colorScheme === 'dark' ? styles.errorMessageContainerDark : styles.errorMessageContainerLight
        ]}>
          <Text style={[
            styles.errorMessageText,
            colorScheme === 'dark' ? styles.errorMessageTextDark : styles.errorMessageTextLight
          ]}>{error}</Text>
        </View>
      ) : null}

      {/* Login Button Section */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.button,
            (isLoggingIn || !email.trim() || !password.trim()) && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isLoggingIn || !email.trim() || !password.trim()}
          accessibilityLabel="Sign in"
          accessibilityRole="button"
        >
          {isLoggingIn ? (
            <View style={styles.loadingContainer}>
              <Spinner size={16} color="#000000" />
              <Text style={styles.loadingText}>Signing in...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

