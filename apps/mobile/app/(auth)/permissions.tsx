import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Camera,
  MapPin,
  AlertTriangle,
  Settings,
  ExternalLink,
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

  useEffect(() => {
    if (!initialPermissions) {
      checkPermissions();
    }
  }, [initialPermissions]);

  const checkPermissions = async () => {
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
  };

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

  const getPermissionIcon = (type: 'camera' | 'location', status: string) => {
    const size = 24;
    const iconColor = status === 'granted' ? '#10B981' : status === 'blocked' ? '#EF4444' : '#F59E0B';

    if (type === 'camera') {
      return <Camera size={size} color={iconColor} />;
    } else {
      return <MapPin size={size} color={iconColor} />;
    }
  };

  const getPermissionStatusText = (status: string): string => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Not Granted';
      default:
        return 'Not Available';
    }
  };

  const getPermissionStatusColor = (status: string): string => {
    if (colorScheme === 'dark') {
      switch (status) {
        case 'granted':
          return 'text-green-400';
        case 'denied':
          return 'text-yellow-400';
        default:
          return 'text-gray-400';
      }
    } else {
      switch (status) {
        case 'granted':
          return 'text-green-600';
        case 'denied':
          return 'text-yellow-600';
        default:
          return 'text-gray-600';
      }
    }
  };

  const hasAnyGrantedPermission = Object.values(permissions).some(status => status === 'granted');
  const hasAnyBlockedPermission = Object.values(permissions).some(status => status === 'blocked');

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
        {/* Warning Icon */}
        <View className="items-center mb-8">
          <View className={`w-24 h-24 rounded-full items-center justify-center ${
            colorScheme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
          }`}>
            <AlertTriangle size={40} color="#EF4444" />
          </View>
          <Text className={`text-2xl font-bold text-center mt-4 mb-2 ${
            colorScheme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Permissions Required
          </Text>
          <Text className={`text-center ${
            colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            This app requires camera and location permissions to function properly
          </Text>
        </View>

        {/* Permission Status Cards */}
        <View className="space-y-4 mb-8">
          {/* Camera Permission */}
          <View className={`p-4 rounded-lg border ${
            colorScheme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <View className="flex-row items-start">
              <View className="mr-3">
                {getPermissionIcon('camera', permissions.camera)}
              </View>
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Camera Permission
                </Text>
                <Text className={`text-sm mb-2 ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Required for attendance check-in/out selfies and face recognition authentication
                </Text>
                <View className="flex-row items-center">
                  <Text className={`text-sm font-medium ${getPermissionStatusColor(permissions.camera)}`}>
                    Status: {getPermissionStatusText(permissions.camera)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Location Permission */}
          <View className={`p-4 rounded-lg border ${
            colorScheme === 'dark'
              ? 'bg-gray-900/50 border-gray-800'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <View className="flex-row items-start">
              <View className="mr-3">
                {getPermissionIcon('location', permissions.location)}
              </View>
              <View className="flex-1">
                <Text className={`font-semibold mb-1 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Location Permission
                </Text>
                <Text className={`text-sm mb-2 ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Required for attendance tracking and location verification during work hours
                </Text>
                <View className="flex-row items-center">
                  <Text className={`text-sm font-medium ${getPermissionStatusColor(permissions.location)}`}>
                    Status: {getPermissionStatusText(permissions.location)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Why These Permissions Are Needed */}
        <View className={`mb-8 p-4 rounded-lg ${
          colorScheme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <Text className={`font-semibold mb-3 text-center ${
            colorScheme === 'dark' ? 'text-blue-400' : 'text-blue-700'
          }`}>
            Why These Permissions Are Essential
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Text className="font-semibold">Camera:</Text> Captures your selfie for attendance check-in/out and ensures the right person is clocking in/out
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center mr-3 mt-0.5">
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Text className="font-semibold">Location:</Text> Tracks your location during work hours for attendance compliance and safety monitoring
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View className="space-y-3">
          {/* Instructions */}
          <View className={`text-center p-4 rounded-lg ${
            colorScheme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'
          }`}>
            {hasAnyBlockedPermission ? (
              <>
                <Text className={`font-semibold mb-2 ${
                  colorScheme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Permission Permanently Denied
                </Text>
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  One or more permissions were permanently denied. You must enable them in your device settings to continue using this app.
                </Text>
              </>
            ) : (
              <>
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Please enable the required permissions in your device settings to continue using the PGN employee app.
                </Text>
              </>
            )}
          </View>

          {/* Open Settings Button */}
          <TouchableOpacity
            className={`py-4 rounded-lg flex-row items-center justify-center active:scale-[0.98] transition-all duration-200 ${
              colorScheme === 'dark'
                ? 'bg-blue-600 active:bg-blue-700'
                : 'bg-blue-500 active:bg-blue-600'
            }`}
            onPress={openSettings}
          >
            <Settings size={20} color="#FFFFFF" className="mr-2" />
            <Text className="text-white font-semibold text-center">
              Open Settings
            </Text>
          </TouchableOpacity>

          {/* Optional: Refresh Permissions Button */}
          {hasAnyGrantedPermission && (
            <TouchableOpacity
              className={`py-3 rounded-lg flex-row items-center justify-center active:scale-[0.98] transition-all duration-200 border ${
                colorScheme === 'dark'
                  ? 'border-gray-700 active:bg-gray-800'
                  : 'border-gray-300 active:bg-gray-50'
              }`}
              onPress={checkPermissions}
              disabled={isChecking}
            >
              {isChecking ? (
                <Text className={`text-sm ${
                  colorScheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Checking permissions...
                </Text>
              ) : (
                <>
                  <ExternalLink size={16} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} className="mr-2" />
                  <Text className={`text-sm font-medium ${
                    colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Refresh Permissions
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Footer Note */}
        <View className={`mt-8 text-center px-4`}>
          <Text className={`text-xs ${
            colorScheme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
            PGN respects your privacy. These permissions are used only for work-related activities and compliance.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}