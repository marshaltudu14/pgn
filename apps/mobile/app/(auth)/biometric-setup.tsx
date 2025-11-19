import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/store/auth-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { secureStorage } from '@/services/secure-storage';
import {
  Fingerprint,
  Shield,
  Clock,
  Smartphone,
  ChevronRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricSetupScreen() {
  const router = useRouter();
  const { user, enableBiometricAuthentication } = useAuth();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ fromLogin?: string }>();
  const isFromLogin = params.fromLogin === 'true';

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [supportedTypes, setSupportedTypes] = useState<LocalAuthentication.AuthenticationType[]>([]);
  const [isChecking, setIsChecking] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      setIsChecking(true);

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setBiometricAvailable(false);
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setBiometricAvailable(false);
        return;
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setSupportedTypes(types);
      setBiometricAvailable(true);

    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleEnableBiometric = async () => {
    setIsSettingUp(true);
    setSetupError(null);

    try {
      const result = await enableBiometricAuthentication();
      if (result.success) {
        // Setup successful - navigate to dashboard
        router.replace('/(dashboard)');
      } else {
        setSetupError(result.error || 'Failed to enable biometric authentication');
      }
    } catch (error) {
      setSetupError('An unexpected error occurred while setting up biometrics');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSkip = async () => {
    // Mark that user has declined biometric setup
    try {
      await secureStorage.setBiometricDeclined();
    } catch (error) {
      console.error('Failed to save biometric decline preference:', error);
    }

    // Navigate to dashboard
    router.replace('/(dashboard)');
  };

  const getBiometricIcon = () => {
    // Only fingerprint is supported
    return (
      <View className={`w-24 h-24 rounded-full items-center justify-center ${
        colorScheme === 'dark' ? 'bg-primary-900/30' : 'bg-primary-100'
      }`}>
        <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center">
          <Fingerprint size={32} color="#FFFFFF" />
        </View>
      </View>
    );
  };

  const getBiometricName = () => {
    return 'Fingerprint';
  };

  // Loading state
  if (isChecking) {
    return (
      <View className={`flex-1 justify-center items-center ${
        colorScheme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        <ActivityIndicator size="large" color="#FFB74D" />
        <Text className={`mt-4 ${
          colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Checking device capabilities...
        </Text>
      </View>
    );
  }

  // Device doesn't support biometrics
  if (!biometricAvailable) {
    return (
      <View className={`flex-1 justify-center items-center px-6 ${
        colorScheme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
          colorScheme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <Smartphone size={40} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
        </View>
        <Text className={`text-2xl font-bold text-center mb-4 ${
          colorScheme === 'dark' ? 'text-white' : 'text-black'
        }`}>
          Biometric Not Available
        </Text>
        <Text className={`text-center mb-8 ${
          colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Your device doesn't support biometric authentication or it's not set up.
          You can continue using your email and password to login.
        </Text>
        <TouchableOpacity
          className="primary-button py-3 px-8 active:scale-[0.98] transition-all duration-200"
          onPress={() => router.replace('/(dashboard)')}
        >
          <Text className="text-black font-semibold text-sm text-center">
            Continue to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View className="flex-1 px-6 py-12">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className={`text-3xl font-bold text-center mb-2 ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Quick Login with {getBiometricName()}
          </Text>
          <Text className={`text-center ${
            colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Set up biometric authentication for faster access
          </Text>
        </View>

        {/* Biometric Icon */}
        <View className="items-center mb-8">
          {getBiometricIcon()}
        </View>

        {/* Welcome Message */}
        <View className={`mb-8 p-4 rounded-lg ${
          colorScheme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'
        }`}>
          <Text className={`text-center font-semibold mb-2 ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Welcome, {user?.fullName || 'Employee'}!
          </Text>
          <Text className={`text-center text-sm ${
            colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            You're successfully logged in. Now let's make your future logins faster and easier.
          </Text>
        </View>

        {/* Why Set Up Biometrics */}
        <View className="mb-8">
          <Text className={`text-lg font-semibold mb-4 ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Why Set Up Biometric Login?
          </Text>

          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1 ${
                colorScheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <Clock size={16} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Save Time Every Login
                </Text>
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  No more typing email and password. Login in seconds with just your fingerprint or face.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1 ${
                colorScheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <Shield size={16} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Extra Security
                </Text>
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Biometric data never leaves your device and is protected by your device's security.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1 ${
                colorScheme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Smartphone size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Perfect for Field Work
                </Text>
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Quick re-login when your session expires. Ideal for sales teams on the go.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View className={`mb-8 p-4 rounded-lg ${
          colorScheme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'
        }`}>
          <Text className={`font-semibold mb-3 ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            How It Works
          </Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-3`}>
                <Text className="text-xs font-bold text-black">1</Text>
              </View>
              <Text className={`text-sm ${
                colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Enable {getBiometricName()} authentication (one-time setup)
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-3`}>
                <Text className="text-xs font-bold text-black">2</Text>
              </View>
              <Text className={`text-sm ${
                colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Use your {getBiometricName()} for quick login from next time
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-6 h-6 rounded-full items-center justify-center mr-3`}>
                <Text className="text-xs font-bold text-black">3</Text>
              </View>
              <Text className={`text-sm ${
                colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Disable anytime in Settings if you change your mind
              </Text>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {setupError ? (
          <View className={`mb-6 p-4 rounded-lg flex-row items-center ${
            colorScheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <AlertCircle size={20} color="#EF4444" className="mr-3" />
            <Text className={`text-sm flex-1 ${
              colorScheme === 'dark' ? 'text-red-400' : 'text-red-700'
            }`}>
              {setupError}
            </Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View className="space-y-3 mb-6">
          <TouchableOpacity
            className="primary-button py-3 active:scale-[0.98] transition-all duration-200"
            onPress={handleEnableBiometric}
            disabled={isSettingUp}
          >
            {isSettingUp ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#000000" className="mr-2" />
                <Text className="text-black font-semibold text-sm">Setting up...</Text>
              </View>
            ) : (
              <Text className="text-black font-semibold text-sm text-center">
                Enable {getBiometricName()} Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="secondary-button py-3 active:scale-[0.98] transition-all duration-200"
            onPress={handleSkip}
            disabled={isSettingUp}
          >
            <Text className={`font-semibold text-sm text-center ${
              colorScheme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              No Thanks
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View className={`text-center px-4`}>
          <Text className={`text-xs ${
            colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Your biometric data is stored securely on your device and never shared with PGN.
            You can enable or disable biometric login anytime in Settings.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}