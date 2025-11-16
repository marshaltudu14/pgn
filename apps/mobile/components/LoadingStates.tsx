import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  size?: number | 'small' | 'large';
}

export function LoadingScreen({ message = 'Loading...', size = 'large' }: LoadingScreenProps) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size={size} color="#3B82F6" />
      <Text className="mt-4 text-gray-600 text-center">{message}</Text>
    </View>
  );
}

interface LoadingSpinnerProps {
  size?: number | 'small' | 'large';
  color?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'small', color = '#3B82F6', className = '' }: LoadingSpinnerProps) {
  return (
    <ActivityIndicator
      size={size}
      color={color}
      className={className}
    />
  );
}

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message = 'Initializing...' }: AuthLoadingScreenProps) {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      {/* PGN Logo */}
      <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-6">
        <Text className="text-white text-3xl font-bold">PGN</Text>
      </View>

      {/* Loading Indicator */}
      <ActivityIndicator size="large" color="#3B82F6" className="mb-4" />

      {/* Loading Message */}
      <Text className="text-gray-600 text-center font-medium">{message}</Text>

      {/* Version Info */}
      <Text className="text-gray-400 text-xs mt-8">PGN Mobile v1.0.0</Text>
    </View>
  );
}

interface FormLoadingProps {
  isVisible: boolean;
  message?: string;
}

export function FormLoading({ isVisible, message = 'Processing...' }: FormLoadingProps) {
  if (!isVisible) return null;

  return (
    <View className="flex-row items-center justify-center py-2">
      <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
      <Text className="text-gray-600 text-sm">{message}</Text>
    </View>
  );
}

export function ButtonLoading({ isVisible, message = 'Loading...' }: FormLoadingProps) {
  if (!isVisible) return null;

  return (
    <View className="flex-row items-center justify-center">
      <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
      <Text className="text-white font-medium">{message}</Text>
    </View>
  );
}