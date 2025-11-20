import { createLoginFormStyles } from '@/styles/auth/login-styles';
import Spinner from '@/components/Spinner';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginRequest } from '@pgn/shared';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
  
  // Focus states
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

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

  const iconColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
  const activeIconColor = '#FF9933'; // Saffron

  return (
    <View style={styles.container}>
      {/* Email Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>
          Email Address
        </Text>
        <View style={styles.inputContainer}>
          <View style={styles.iconContainer}>
            <Mail 
              size={18} 
              color={focusedField === 'email' ? activeIconColor : iconColor} 
            />
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'email' && styles.inputFocused,
              emailError ? styles.inputWithError : null
            ]}
            placeholder="Enter your email address"
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#A1A1AA'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
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
            <AlertCircle size={12} color="#EF4444" />
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
            <Lock 
              size={18} 
              color={focusedField === 'password' ? activeIconColor : iconColor} 
            />
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'password' && styles.inputFocused,
              passwordError ? styles.inputWithError : null
            ]}
            placeholder="Enter your password"
            placeholderTextColor={colorScheme === 'dark' ? '#52525B' : '#A1A1AA'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError('');
            }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
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
              <EyeOff size={18} color={iconColor} />
            ) : (
              <Eye size={18} color={iconColor} />
            )}
          </TouchableOpacity>
        </View>
        {passwordError ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={12} color="#EF4444" />
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
          <AlertCircle size={18} color={colorScheme === 'dark' ? '#F87171' : '#B91C1C'} style={{ marginRight: 8 }} />
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
          activeOpacity={0.8}
        >
          {isLoggingIn ? (
            <View style={styles.loadingContainer}>
              <Spinner size={18} color="#FFFFFF" />
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

