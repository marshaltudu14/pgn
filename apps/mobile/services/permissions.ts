import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Linking, Alert } from 'react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface AppPermissions {
  camera: PermissionStatus;
  location: PermissionStatus;
}

export interface PermissionCheckResult {
  allGranted: boolean;
  permissions: AppPermissions;
  deniedPermissions: string[];
  undeterminedPermissions: string[];
}

export class PermissionService {
  private static instance: PermissionService;

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  // Check if camera permission is granted
  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      return status as PermissionStatus;
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return 'denied';
    }
  }

  // Check if location permission is granted
  async checkLocationPermission(): Promise<PermissionStatus> {
    try {
      // Check both foreground and background permissions
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      // Consider location granted only if both foreground and background are granted
      if (foregroundStatus === 'granted' && backgroundStatus === 'granted') {
        return 'granted';
      } else if (foregroundStatus === 'denied' || backgroundStatus === 'denied') {
        return 'denied';
      } else {
        return 'undetermined';
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'denied';
    }
  }

  // Request camera permission
  async requestCameraPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status as PermissionStatus;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return 'denied';
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      // First request foreground permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        return foregroundStatus as PermissionStatus;
      }

      // Then request background permission for "Allow all the time"
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      // Return background status since we need both for full functionality
      return backgroundStatus as PermissionStatus;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return 'denied';
    }
  }

  // Check all required app permissions
  async checkAllPermissions(): Promise<PermissionCheckResult> {
    const [cameraStatus, locationStatus] = await Promise.all([
      this.checkCameraPermission(),
      this.checkLocationPermission(),
    ]);

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
    };

    const allGranted = cameraStatus === 'granted' && locationStatus === 'granted';
    const deniedPermissions = Object.entries(permissions)
      .filter(([_, status]) => status === 'denied')
      .map(([permission]) => permission);
    const undeterminedPermissions = Object.entries(permissions)
      .filter(([_, status]) => status === 'undetermined')
      .map(([permission]) => permission);

    return {
      allGranted,
      permissions,
      deniedPermissions,
      undeterminedPermissions,
    };
  }

  // Request all required permissions
  async requestAllPermissions(): Promise<PermissionCheckResult> {
    const [cameraStatus, locationStatus] = await Promise.all([
      this.requestCameraPermission(),
      this.requestLocationPermission(),
    ]);

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
    };

    const allGranted = cameraStatus === 'granted' && locationStatus === 'granted';
    const deniedPermissions = Object.entries(permissions)
      .filter(([_, status]) => status === 'denied')
      .map(([permission]) => permission);
    const undeterminedPermissions = Object.entries(permissions)
      .filter(([_, status]) => status === 'undetermined')
      .map(([permission]) => permission);

    return {
      allGranted,
      permissions,
      deniedPermissions,
      undeterminedPermissions,
    };
  }

  // Open app settings for permissions
  async openAppSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
        return true;
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
        return true;
      } else {
        // Web - cannot open settings programmatically
        Alert.alert(
          'Browser Settings',
          'Please enable camera and location permissions in your browser settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
      Alert.alert(
        'Settings Unavailable',
        'Unable to open settings. Please enable permissions manually.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  // Check if location services are enabled
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get permission status explanation
  getPermissionStatusExplanation(status: PermissionStatus): string {
    switch (status) {
      case 'granted':
        return 'Permission granted';
      case 'denied':
        return 'Permission denied - please enable in settings';
      case 'undetermined':
        return 'Permission not yet requested';
      default:
        return 'Permission status unknown';
    }
  }

  // Show rationale for why permissions are needed
  showPermissionRationale(permission: 'camera' | 'location'): void {
    const rationale = permission === 'camera'
      ? 'Camera permission is required for attendance check-in/out selfies and face recognition authentication.'
      : 'Location permission is required for attendance tracking and ensuring you are at the correct work location. We need &quot;Allow all the time&quot; access to track your location during work hours even when the app is in the background.';

    Alert.alert(
      `${permission === 'camera' ? 'Camera' : 'Location'} Permission Required`,
      rationale,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Grant Permission', style: 'default' }
      ]
    );
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();