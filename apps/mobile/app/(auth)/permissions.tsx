import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  AppState,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Camera,
  MapPin,
  Shield,
  Settings,
  CheckCircle,
} from 'lucide-react-native';
import { permissionService, AppPermissions } from '@/services/permissions';

interface PermissionsScreenProps {
  permissions?: AppPermissions;
  onPermissionsGranted?: () => void;
}

export default function PermissionsScreen({
  permissions: initialPermissions,
  onPermissionsGranted
}: PermissionsScreenProps) {
  const colorScheme = useColorScheme();
  const [permissions, setPermissions] = useState<AppPermissions>(
    initialPermissions || { camera: 'denied', location: 'denied' }
  );
  const [isChecking, setIsChecking] = useState(false);

  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await permissionService.checkAllPermissions();
      setPermissions(result.permissions);

      // If all permissions are now granted, call callback
      if (result.allGranted && onPermissionsGranted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setIsChecking(false);
    }
  }, [onPermissionsGranted]);

  useEffect(() => {
    if (!initialPermissions) {
      checkPermissions();
    }

    // Listen for app state changes to auto-check permissions when returning from settings
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // App came to foreground, check permissions in case they were updated in settings
        // Add a small delay to ensure the system has time to register permission changes
        setTimeout(() => {
          checkPermissions();
        }, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [initialPermissions, checkPermissions]);

  const openSettings = async () => {
    try {
      const success = await permissionService.openAppSettings();
      if (success) {
        // Note: on iOS, the app will be backgrounded when settings open
        // The app will need to check permissions again when it becomes active
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const allGranted = permissions.camera === 'granted' && permissions.location === 'granted';
  const hasAnyBlocked = Object.values(permissions).some(status => status === 'blocked');

  return (
    <View className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Header with icon and title */}
      <View className="flex-1 px-8 pt-20 justify-center">
        <View className="items-center mb-12">
          <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${
            allGranted
              ? 'bg-green-100'
              : colorScheme === 'dark' ? 'bg-primary-900/20' : 'bg-primary-100'
          }`}>
            <Shield
              size={40}
              color={allGranted ? '#10B981' : '#FFB74D'}
            />
          </View>

          <Text className={`text-3xl font-bold text-center mb-2 ${
            colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {allGranted ? 'Permissions Granted' : 'Enable Permissions'}
          </Text>

          <Text className={`text-base text-center px-4 ${
            colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {allGranted
              ? 'All required permissions are enabled. You can now use the app.'
              : 'PGN needs camera and location access for attendance tracking'
            }
          </Text>
        </View>

        {!allGranted && (
          <>
            {/* Permission Items */}
            <View className="space-y-6 mb-10">
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                  permissions.camera === 'granted'
                    ? 'bg-green-100'
                    : colorScheme === 'dark' ? 'bg-primary-900/20' : 'bg-primary-100'
                }`}>
                  {permissions.camera === 'granted' ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <Camera size={24} color="#FFB74D" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold text-base mb-1 ${
                    colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Camera Access
                  </Text>
                  <Text className={`text-sm ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Required for selfie check-in/out and face recognition
                  </Text>
                </View>
                {permissions.camera === 'granted' && (
                  <View className="bg-green-100 rounded-full p-1">
                    <CheckCircle size={16} color="#10B981" />
                  </View>
                )}
              </View>

              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                  permissions.location === 'granted'
                    ? 'bg-green-100'
                    : colorScheme === 'dark' ? 'bg-primary-900/20' : 'bg-primary-100'
                }`}>
                  {permissions.location === 'granted' ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <MapPin size={24} color="#FFB74D" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold text-base mb-1 ${
                    colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Location Access
                  </Text>
                  <Text className={`text-sm ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Required for attendance tracking and verification
                  </Text>
                </View>
                {permissions.location === 'granted' && (
                  <View className="bg-green-100 rounded-full p-1">
                    <CheckCircle size={16} color="#10B981" />
                  </View>
                )}
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              className={`py-4 rounded-2xl flex-row items-center justify-center active:scale-[0.98] transition-all duration-200 mb-4 ${
                hasAnyBlocked
                  ? colorScheme === 'dark' ? 'bg-red-600' : 'bg-red-500'
                  : colorScheme === 'dark' ? 'bg-primary' : 'bg-primary'
              }`}
              onPress={openSettings}
              style={{
                shadowColor: '#FFB74D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Settings size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base ml-3">
                {hasAnyBlocked ? 'Open Settings' : 'Enable Permissions'}
              </Text>
            </TouchableOpacity>

            {/* Refresh Button */}
            {!hasAnyBlocked && (
              <TouchableOpacity
                className={`py-4 rounded-2xl items-center justify-center active:scale-[0.98] transition-all duration-200 ${
                  colorScheme === 'dark' ? 'border border-gray-700' : 'border border-gray-300'
                }`}
                onPress={checkPermissions}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Text className={`text-base font-medium ${
                    colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Checking...
                  </Text>
                ) : (
                  <Text className={`text-base font-medium ${
                    colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Check Again
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Privacy Note */}
        <View className="absolute bottom-8 left-8 right-8">
          <View className="flex-row items-center justify-center">
            <Shield size={12} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
            <Text className={`text-xs ml-2 ${
              colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Your privacy is respected. Permissions used only for work purposes.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}