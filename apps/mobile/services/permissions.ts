import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { Platform, Linking } from 'react-native';
import { showToast } from '@/utils/toast';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

export interface AppPermissions {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
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

  // Check if notification permission is granted
  async checkNotificationPermission(): Promise<PermissionStatus> {
    try {
      // Use expo-notifications for permission checking (more reliable)
      const settings = await Notifications.getPermissionsAsync();


      // Check if permissions are granted or provisionally granted (iOS)
      if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return 'granted';
      }

      // Check if denied
      if (settings.status === 'denied') {
        return 'denied';
      }

      // Check if undetermined
      if (settings.status === 'undetermined') {
        return 'undetermined';
      }

      return 'denied';
    } catch (error) {
      console.error('Error checking notification permission:', error);
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

  // Request notification permission
  async requestNotificationPermission(): Promise<PermissionStatus> {
    try {


      // Use expo-notifications for permission requesting (latest best practice)
      const settings = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });



      // Check if permissions are granted or provisionally granted (iOS)
      if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return 'granted';
      }

      // Check if denied
      if (settings.status === 'denied') {
        return 'denied';
      }

      // Check if undetermined
      if (settings.status === 'undetermined') {
        return 'undetermined';
      }

      return 'denied';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Check all required app permissions
  async checkAllPermissions(): Promise<PermissionCheckResult> {
    const [cameraStatus, locationStatus, notificationStatus] = await Promise.all([
      this.checkCameraPermission(),
      this.checkLocationPermission(),
      this.checkNotificationPermission(),
    ]);

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
      notifications: notificationStatus,
    };

    const allGranted = cameraStatus === 'granted' && locationStatus === 'granted' && notificationStatus === 'granted';
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
    const [cameraStatus, locationStatus, notificationStatus] = await Promise.all([
      this.requestCameraPermission(),
      this.requestLocationPermission(),
      this.requestNotificationPermission(),
    ]);

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
      notifications: notificationStatus,
    };

    const allGranted = cameraStatus === 'granted' && locationStatus === 'granted' && notificationStatus === 'granted';
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
        showToast.error('Please enable camera and location permissions in your browser settings.');
        return false;
      }
    } catch (error) {
      console.error('Error opening app settings:', error);
      showToast.error('Unable to open settings. Please enable permissions manually.');
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
  showPermissionRationale(permission: 'camera' | 'location' | 'notifications'): void {
    let rationale = '';
    let permissionName = '';

    switch (permission) {
      case 'camera':
        rationale = 'Camera permission is required for attendance check-in/out selfies and face recognition authentication.';
        permissionName = 'Camera';
        break;
      case 'location':
        rationale = 'Location permission is required for attendance tracking and ensuring you are at the correct work location.';
        permissionName = 'Location';
        break;
      case 'notifications':
        rationale = 'Notification permission is required for attendance tracking alerts and important work updates.';
        permissionName = 'Notifications';
        break;
    }

    showToast.info(`${permissionName} permission is required. ${rationale}`);
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();