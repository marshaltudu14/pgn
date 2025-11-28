import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import { showToast } from '@/utils/toast';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'blocked';

// Enhanced permission status to include detailed location permission info
export interface LocationPermissionDetails {
  foreground: PermissionStatus;
  background: PermissionStatus;
  needsAlwaysAccess: boolean;
}

export interface AppPermissions {
  camera: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  locationDetails?: LocationPermissionDetails;
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
        // If foreground is granted but background is not, that means user has "Allow while in app"
        // but not "Allow all the time" - we need to show permission screen
        return 'undetermined';
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'denied';
    }
  }

  // Enhanced location permission check with detailed status
  async checkLocationPermissionDetailed(): Promise<LocationPermissionDetails> {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      return {
        foreground: foregroundStatus as PermissionStatus,
        background: backgroundStatus as PermissionStatus,
        needsAlwaysAccess: foregroundStatus === 'granted' && backgroundStatus !== 'granted'
      };
    } catch (error) {
      console.error('Error checking detailed location permission:', error);
      return {
        foreground: 'denied',
        background: 'denied',
        needsAlwaysAccess: false
      };
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

  // Request location permission with persistent retry logic
  async requestLocationPermission(): Promise<PermissionStatus> {
    try {
      // First request foreground permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
        return foregroundStatus as PermissionStatus;
      }

      // Then request background permission for "Allow all the time"
      // On Android 11+, background location permission requires a special explanation
      // and the user may need to go to settings
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      // Return combined status since we need both for full functionality
      if (foregroundStatus === Location.PermissionStatus.GRANTED && backgroundStatus === Location.PermissionStatus.GRANTED) {
        return 'granted';
      } else if (backgroundStatus === Location.PermissionStatus.DENIED) {
        return 'denied';
      } else {
        return 'undetermined';
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return 'denied';
    }
  }

  // Request individual permission with retry logic
  async requestPermissionWithRetry(
    permissionType: 'camera' | 'location' | 'notifications',
    maxRetries: number = 3
  ): Promise<PermissionStatus> {
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;

      try {
        let status: PermissionStatus;

        switch (permissionType) {
          case 'camera':
            status = await this.requestCameraPermission();
            break;
          case 'location':
            status = await this.requestLocationPermission();
            break;
          case 'notifications':
            status = await this.requestNotificationPermission();
            break;
        }

        // If granted, return immediately
        if (status === 'granted') {
          return 'granted';
        }

        // If denied and we can ask again, continue retrying
        if (status === 'denied' && attempts < maxRetries) {
          // Show rationale for why permission is needed
          this.showPermissionRationale(permissionType);

          // Wait a bit before retrying (to allow user to consider)
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Return current status if we can't retry or it's undetermined/blocked
        return status;

      } catch (error) {
        console.error(`Error requesting ${permissionType} permission (attempt ${attempts}):`, error);

        if (attempts >= maxRetries) {
          return 'denied';
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return 'denied';
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

  // Request all required permissions with persistent retry
  async requestAllPermissions(): Promise<PermissionCheckResult> {
    const [cameraStatus, locationStatus, notificationStatus] = await Promise.all([
      this.requestPermissionWithRetry('camera'),
      this.requestPermissionWithRetry('location'),
      this.requestPermissionWithRetry('notifications'),
    ]);

    // Get detailed location info for better UI handling
    const locationDetails = await this.checkLocationPermissionDetailed();

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
      notifications: notificationStatus,
      locationDetails,
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

  // Check all required app permissions with detailed location info
  async checkAllPermissionsDetailed(): Promise<PermissionCheckResult> {
    const [cameraStatus, locationStatus, notificationStatus, locationDetails] = await Promise.all([
      this.checkCameraPermission(),
      this.checkLocationPermission(),
      this.checkNotificationPermission(),
      this.checkLocationPermissionDetailed(),
    ]);

    const permissions: AppPermissions = {
      camera: cameraStatus,
      location: locationStatus,
      notifications: notificationStatus,
      locationDetails,
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
        rationale = 'Location permission with "Allow all the time" access is required for attendance tracking during work hours. This enables the app to track your location in the background using a foreground service, which is necessary for monitoring work attendance throughout the day.';
        permissionName = 'Location';
        break;
      case 'notifications':
        rationale = 'Notification permission is required for attendance tracking alerts and important work updates.';
        permissionName = 'Notifications';
        break;
    }

    showToast.info(`${permissionName} permission is required. ${rationale}`);
  }

  // Show detailed rationale for background location permission
  showLocationAlwaysRationale(): void {
    const rationale = 'PGN requires "Allow all the time" location access to:\n\n' +
      '• Track your location throughout the work day for accurate attendance\n' +
      '• Run a foreground service to monitor location while you\'re checked in\n' +
      '• Ensure compliance with work location requirements\n\n' +
      'Location is only tracked during work hours and is used solely for attendance purposes.';

    showToast.info(rationale);
  }

  // Check if permission can be requested again (not permanently denied)
  canRequestPermission(status: PermissionStatus): boolean {
    return status !== 'blocked' && status !== 'denied';
  }

  // Determine if user needs to be directed to settings for manual permission enable
  requiresSettingsIntervention(permissions: AppPermissions): boolean {
    return Object.values(permissions).some(status => status === 'blocked' || status === 'denied');
  }
}

// Export singleton instance
export const permissionService = PermissionService.getInstance();