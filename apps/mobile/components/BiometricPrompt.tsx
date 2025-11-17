import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fingerprint, X, Check, AlertCircle, User } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricPromptProps {
  visible: boolean;
  onClose: () => void;
  onSetup: () => void;
  onSkip: () => void;
  supportedTypes?: LocalAuthentication.AuthenticationType[];
  isLoading?: boolean;
  error?: string | null;
}

export default function BiometricPrompt({
  visible,
  onClose,
  onSetup,
  onSkip,
  supportedTypes = [],
  isLoading = false,
  error = null,
}: BiometricPromptProps) {
  const colorScheme = useColorScheme();

  const getBiometricIcon = () => {
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return (
        <View className={`w-20 h-20 rounded-full items-center justify-center ${
          colorScheme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
        }`}>
          <User size={40} color="#10B981" />
        </View>
      );
    }

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return (
        <View className={`w-20 h-20 rounded-full items-center justify-center ${
          colorScheme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
        }`}>
          <Fingerprint size={40} color="#3B82F6" />
        </View>
      );
    }

    return (
      <View className={`w-20 h-20 rounded-full items-center justify-center ${
        colorScheme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
      }`}>
        <Fingerprint size={40} color="#8B5CF6" />
      </View>
    );
  };

  const getBiometricTitle = () => {
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID Available';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint Available';
    }
    return 'Biometric Authentication Available';
  };

  const getBiometricDescription = () => {
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Use Face ID for quick and secure access to your PGN account. No need to remember passwords.';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Use your fingerprint for quick and secure access to your PGN account. No need to remember passwords.';
    }
    return 'Use biometric authentication for quick and secure access to your PGN account. No need to remember passwords.';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="rgba(0,0,0,0.5)"
        translucent
      />

      <View className="flex-1 justify-center items-center px-6">
        {/* Backdrop */}
        <View className="absolute inset-0 bg-black/60" />

        {/* Modal Content */}
        <View className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl ${
          colorScheme === 'dark' ? 'bg-gray-900' : 'bg-white'
        }`}>
          {/* Header */}
          <View className={`px-6 py-4 flex-row justify-between items-center border-b ${
            colorScheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <Text className={`text-lg font-semibold ${
              colorScheme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Enable Biometric Login
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-1"
              accessibilityLabel="Close biometric setup"
            >
              <X size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="px-6 py-6">
            {/* Icon */}
            <View className="items-center mb-6">
              {getBiometricIcon()}
            </View>

            {/* Title and Description */}
            <View className="mb-6">
              <Text className={`text-xl font-bold text-center mb-3 ${
                colorScheme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {getBiometricTitle()}
              </Text>
              <Text className={`text-sm text-center leading-5 ${
                colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {getBiometricDescription()}
              </Text>
            </View>

            {/* Features */}
            <View className={`space-y-3 mb-6 p-4 rounded-lg ${
              colorScheme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
            }`}>
              <View className="flex-row items-center">
                <Check size={16} color="#10B981" className="mr-3" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Quick access - Login in seconds
                </Text>
              </View>
              <View className="flex-row items-center">
                <Check size={16} color="#10B981" className="mr-3" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Secure - Protected by device security
                </Text>
              </View>
              <View className="flex-row items-center">
                <Check size={16} color="#10B981" className="mr-3" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Optional - Can be disabled anytime
                </Text>
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View className={`flex-row items-center p-3 rounded-lg mb-4 ${
                colorScheme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <AlertCircle size={16} color="#EF4444" className="mr-2" />
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-red-400' : 'text-red-700'
                }`}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Loading State */}
            {isLoading ? (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className={`text-sm mt-3 ${
                  colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Setting up biometric authentication...
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {/* Action Buttons */}
                <TouchableOpacity
                  className="primary-button py-3 active:scale-[0.98] transition-all duration-200"
                  onPress={onSetup}
                  accessibilityLabel="Enable biometric authentication"
                  accessibilityRole="button"
                >
                  <Text className="text-black font-semibold text-sm text-center">
                    Enable Biometric Login
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="secondary-button py-3 active:scale-[0.98] transition-all duration-200"
                  onPress={onSkip}
                  accessibilityLabel="Skip biometric setup"
                  accessibilityRole="button"
                >
                  <Text className={`font-semibold text-sm text-center ${
                    colorScheme === 'dark' ? 'text-white' : 'text-black'
                  }`}>
                    Maybe Later
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Note */}
          <View className={`px-6 py-3 border-t ${
            colorScheme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
            <Text className={`text-xs text-center ${
              colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              You can enable biometric login anytime in Settings
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}