import { getCurrentLocation } from '@/utils/location';
import { LocationData } from '@pgn/shared';
import { LOCATION_TRACKING_CONFIG, UPDATE_INTERVAL_MS } from '@/constants/location-tracking';
import notifee, {
    AndroidForegroundServiceType,
    AndroidImportance,
    AndroidLaunchActivityFlag,
    AuthorizationStatus,
    EventType
} from '@notifee/react-native';
import * as Battery from 'expo-battery';
import { permissionService } from '@/services/permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationTrackingState {
  isTracking: boolean;
  employeeId?: string;
  employeeName?: string;
  attendanceId?: string;
  channelId?: string;
  notificationId?: string;
}

interface EmergencyAttendanceData {
  attendanceId?: string;
  employeeId?: string;
  lastLocationUpdate: {
    timestamp: number;
    coordinates: [number, number];
    batteryLevel: number;
  };
  trackingActive: boolean;
  lastKnownTime: number;
}

type LocationUpdateCallback = (location: LocationData, batteryLevel: number) => Promise<void>;
type CountdownUpdateCallback = (countdown: number) => void;

class LocationTrackingServiceNotifee {
  private state: LocationTrackingState = {
    isTracking: false,
  };

  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private notificationUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private permissionMonitoringInterval: ReturnType<typeof setInterval> | null = null;
  private batteryMonitoringInterval: ReturnType<typeof setInterval> | null = null;
  private locationUpdateCallback?: LocationUpdateCallback;
  private countdownUpdateCallback?: CountdownUpdateCallback;
  private emergencyDataCallback?: (data: EmergencyAttendanceData) => void;
  private isInitialized = false;
  private nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS;
  private lastEmergencyUpdate = 0;

  private static readonly EMERGENCY_STORAGE_KEY = 'emergency_attendance_data';

  // Setup background event handler to suppress warning
  private setupBackgroundEventHandler(): void {
    try {
      notifee.onBackgroundEvent(async ({ type, detail }) => {
        
        // Handle different event types
        switch (type) {
          case EventType.PRESS:
                        break;
          case EventType.DISMISSED:
                        break;
          case EventType.ACTION_PRESS:
                        break;
          default:
            break;
        }
      });
      ;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to setup background event handler:', error);
    }
  }

  // Set the location update callback
  setLocationUpdateCallback(callback: LocationUpdateCallback): void {
    this.locationUpdateCallback = callback;
  }

  // Set the countdown update callback for UI synchronization
  setCountdownUpdateCallback(callback: CountdownUpdateCallback): void {
    this.countdownUpdateCallback = callback;
  }

  // Set the emergency data callback for handling emergency check-outs
  setEmergencyDataCallback(callback: (data: EmergencyAttendanceData) => void): void {
    this.emergencyDataCallback = callback;
  }

  // Store emergency attendance data for recovery scenarios
  private async storeEmergencyData(location: LocationData, batteryLevel: number, attendanceId?: string): Promise<void> {
    try {
      const emergencyData: EmergencyAttendanceData = {
        attendanceId,
        employeeId: this.state.employeeId,
        lastLocationUpdate: {
          timestamp: location.timestamp.getTime(),
          coordinates: [location.latitude, location.longitude],
          batteryLevel
        },
        trackingActive: this.state.isTracking,
        lastKnownTime: Date.now()
      };

      await AsyncStorage.setItem(
        LocationTrackingServiceNotifee.EMERGENCY_STORAGE_KEY,
        JSON.stringify(emergencyData)
      );

      this.lastEmergencyUpdate = Date.now();
      console.log('[LocationTrackingServiceNotifee] Emergency data stored');
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to store emergency data:', error);
    }
  }

  // Clear emergency data after successful check-out
  async clearEmergencyData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LocationTrackingServiceNotifee.EMERGENCY_STORAGE_KEY);
      console.log('[LocationTrackingServiceNotifee] Emergency data cleared');
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to clear emergency data:', error);
    }
  }

  // Get stored emergency data
  async getEmergencyData(): Promise<EmergencyAttendanceData | null> {
    try {
      const storedData = await AsyncStorage.getItem(LocationTrackingServiceNotifee.EMERGENCY_STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to get emergency data:', error);
      return null;
    }
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check if Notifee is available
      if (!notifee) {
        console.error('[LocationTrackingServiceNotifee] Notifee module not available');
        return false;
      }

      // Set background event handler to suppress warning
      this.setupBackgroundEventHandler();

      // Register foreground service runner (required for Notifee)
      this.registerForegroundServiceRunner();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to initialize:', error);
      // Don't fail completely, allow the service to try anyway
      this.isInitialized = true;
      return true;
    }
  }

  // Register the foreground service runner
  private registerForegroundServiceRunner(): void {
    try {
      notifee.registerForegroundService((notification) => {
        return new Promise<void>((resolve) => {
          // Set up event listener for this service instance
          notifee.onForegroundEvent(async ({ type, detail }) => {
            if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
              // Handle stop action if needed
              await this.stopTracking();
              resolve(); // Resolve to end the service
            } else if (type === EventType.DISMISSED) {
              // Handle notification dismissal - keep service active
            }
          });

          // Keep the service running by not resolving the promise
          // The service will stop when stopTracking is called
        });
      });
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to register foreground service:', error);
    }
  }

  // Request necessary permissions
  private async requestNotificationPermissions(): Promise<boolean> {
    try {
  
      // First check current permissions
      const currentSettings = await notifee.getNotificationSettings();


      if (currentSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {

        return true;
      }

      // Request permissions
      const settings = await notifee.requestPermission();


      const isAuthorized = settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      if (!isAuthorized) {
        console.warn('[LocationTrackingServiceNotifee] Notifications not authorized:', settings.authorizationStatus);

        // On Android, we can still proceed with limited functionality
        if (settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {

          return true;
        }
      }

      return isAuthorized;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to request permissions:', error);
      return false;
    }
  }

  
  // Start location tracking with foreground notification
  async startTracking(employeeId: string, employeeName: string, attendanceId?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize service');
        }
      }

      if (this.state.isTracking) {
        console.warn('[LocationTrackingServiceNotifee] Already tracking');
        return true;
      }

      // Check ALL required permissions for tracking
      const [cameraStatus, locationStatus, notificationStatus] = await Promise.all([
        permissionService.checkCameraPermission(),
        permissionService.checkLocationPermission(),
        permissionService.checkNotificationPermission(),
      ]);

      // Check if all required permissions are granted
      if (cameraStatus !== 'granted') {
        console.error('[LocationTrackingServiceNotifee] Camera permission required for check-in - cannot start tracking');
        return false;
      }

      if (locationStatus !== 'granted') {
        console.error('[LocationTrackingServiceNotifee] Location permission with "Allow all the time" access required for tracking - cannot start tracking');
        return false;
      }

      if (notificationStatus !== 'granted') {
        console.error('[LocationTrackingServiceNotifee] Notification permission required for foreground service - cannot start tracking');
        return false;
      }

      // Update state
      this.state = {
        isTracking: true,
        employeeId,
        employeeName,
        attendanceId,
      };

      // Start permission monitoring to stop service if permissions are revoked
      this.startPermissionMonitoring();

      // Start battery monitoring for automatic check-out at 5%
      this.startBatteryMonitoring();

      // Create foreground notification to start tracking - this is required for the service to work
      try {
        await this.createForegroundNotification(employeeName);
      } catch (notificationError) {
        console.error('[LocationTrackingServiceNotifee] Failed to create foreground notification, stopping tracking:', notificationError);
        this.state.isTracking = false;
        return false; // Cannot proceed without notification
      }

      // Start the tracking loop
      this.startTrackingLoop();

      return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to start tracking:', error);
      this.state.isTracking = false;
      return false;
    }
  }

  // Start the tracking loop (30 seconds interval)
  private startTrackingLoop(): void {
    try {
      // Clear any existing intervals first to prevent memory leaks
      this.cleanupIntervals();

      // Reset countdown
      this.nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS;

      // Initial location update (with error handling)
      this.sendLocationUpdate().catch(error => {
        console.error('[LocationTrackingServiceNotifee] Initial location update failed:', error);
      });

      // Set interval for location updates based on config
      this.trackingInterval = setInterval(() => {
        if (this.state.isTracking) {
          this.sendLocationUpdate().catch(error => {
            console.error('[LocationTrackingServiceNotifee] Scheduled location update failed:', error);
          });
          this.nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS; // Reset countdown after each sync
          // Notify UI components of countdown reset
          if (this.countdownUpdateCallback) {
            this.countdownUpdateCallback(this.nextSyncCountdown);
          }
        } else {
          // Stop intervals if tracking is no longer active
          this.cleanupIntervals();
        }
      }, UPDATE_INTERVAL_MS);

      // Set interval for 1 second notification updates (countdown) - only if notification exists
      this.notificationUpdateInterval = setInterval(() => {
        if (this.state.isTracking && this.state.notificationId) {
          this.updateNotificationCountdown().catch(error => {
            console.error('[LocationTrackingServiceNotifee] Notification update failed:', error);
          });
        }
      }, 1000);

    } catch (error) {
      this.cleanupIntervals();
      throw error;
    }
  }

  // Helper method to clean up intervals
  private cleanupIntervals(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    if (this.notificationUpdateInterval) {
      clearInterval(this.notificationUpdateInterval);
      this.notificationUpdateInterval = null;
    }
    if (this.permissionMonitoringInterval) {
      clearInterval(this.permissionMonitoringInterval);
      this.permissionMonitoringInterval = null;
    }
    if (this.batteryMonitoringInterval) {
      clearInterval(this.batteryMonitoringInterval);
      this.batteryMonitoringInterval = null;
    }
  }

  // Start monitoring permissions and stop service if any get revoked
  private startPermissionMonitoring(): void {
    // Check permissions every 30 seconds while tracking
    this.permissionMonitoringInterval = setInterval(async () => {
      if (!this.state.isTracking) {
        return;
      }

      try {
        const [cameraStatus, locationStatus, notificationStatus] = await Promise.all([
          permissionService.checkCameraPermission(),
          permissionService.checkLocationPermission(),
          permissionService.checkNotificationPermission(),
        ]);

        // If any permission is no longer granted, handle appropriately
        if (cameraStatus !== 'granted' || locationStatus !== 'granted' || notificationStatus !== 'granted') {
          // If location permission is specifically revoked, trigger emergency check-out
          if (locationStatus !== 'granted' && this.state.isTracking) {
            await this.handleLocationPermissionRevoked();
          }
          await this.stopTracking('Permission revoked');
        }
      } catch (error) {
        console.error('[LocationTrackingServiceNotifee] Error checking permissions during monitoring:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // Start battery monitoring for automatic check-out at 5%
  private startBatteryMonitoring(): void {
    // Check battery every 30 seconds while tracking
    this.batteryMonitoringInterval = setInterval(async () => {
      if (!this.state.isTracking) {
        return;
      }

      try {
        const batteryLevel = await Battery.getBatteryLevelAsync();
        const batteryPercentage = Math.round(batteryLevel * 100);

        if (batteryPercentage <= 5) {
          const location = await getCurrentLocation();
          await this.handleLowBatteryCheckOut(location, batteryPercentage);
        }
      } catch (error) {
        console.error('[LocationTrackingServiceNotifee] Error checking battery level:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  // Handle low battery emergency check-out
  private async handleLowBatteryCheckOut(location: LocationData, batteryLevel: number): Promise<void> {
    try {
      console.warn('[LocationTrackingServiceNotifee] Low battery detected, initiating emergency check-out');

      // Store final emergency data
      await this.storeEmergencyData(location, batteryLevel, this.state.attendanceId);

      // Trigger emergency check-out callback
      if (this.emergencyDataCallback) {
        const emergencyData = await this.getEmergencyData();
        if (emergencyData) {
          this.emergencyDataCallback(emergencyData);
        }
      }

      // Stop tracking to save power
      await this.stopTracking('Low battery - automatic check-out');

      // Show low battery notification
      await notifee.displayNotification({
        id: 'low-battery-checkout-' + Date.now(),
        title: 'PGN - Low Battery Check-Out',
        body: 'Phone battery is critically low. You have been automatically checked out to preserve battery.',
        android: {
          channelId: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          autoCancel: true,
          smallIcon: 'ic_launcher_foreground',
          color: '#FF5722',
          colorized: true,
          pressAction: {
            id: 'open-app',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
        },
      });
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Error handling low battery check-out:', error);
    }
  }

  // Handle location permission revocation emergency check-out
  private async handleLocationPermissionRevoked(): Promise<void> {
    try {
      console.warn('[LocationTrackingServiceNotifee] Location permission revoked, initiating emergency check-out');

      // Get current location for emergency check-out
      const location = await getCurrentLocation();
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

      // Store final emergency data
      await this.storeEmergencyData(location, batteryPercentage, this.state.attendanceId);

      // Trigger emergency check-out callback
      if (this.emergencyDataCallback) {
        const emergencyData = await this.getEmergencyData();
        if (emergencyData) {
          this.emergencyDataCallback(emergencyData);
        }
      }

      // Show notification
      await notifee.displayNotification({
        id: 'permission-revoked-checkout-' + Date.now(),
        title: 'PGN - Permission Revoked',
        body: 'Location permission was revoked. You have been automatically checked out.',
        android: {
          channelId: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          autoCancel: true,
          smallIcon: 'ic_launcher_foreground',
          color: '#FF9800',
          colorized: true,
          pressAction: {
            id: 'open-app',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
        },
      });
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Error handling permission revocation:', error);
    }
  }

  // Send location and battery update
  private async sendLocationUpdate(): Promise<void> {
    try {
      if (!this.state.isTracking) {
        return;
      }

      // Get current location
      const location = await getCurrentLocation();

      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

      // Store emergency data every 30 seconds (but not on every update)
      const now = Date.now();
      if (now - this.lastEmergencyUpdate > 30000) {
        await this.storeEmergencyData(location, batteryPercentage, this.state.attendanceId);
      }

      // Check for low battery and trigger emergency check-out if needed
      if (batteryPercentage <= 5) {
        await this.handleLowBatteryCheckOut(location, batteryPercentage);
        return;
      }

      // Send update via callback if available
      if (this.locationUpdateCallback) {
        await this.locationUpdateCallback(location, batteryPercentage);
      } else {
        console.warn('[LocationTrackingServiceNotifee] No location update callback set');
      }

    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to send location update:', error);
    }
  }

  // Update notification with countdown
  private async updateNotificationCountdown(): Promise<void> {
    try {
      if (!this.state.isTracking || !this.state.notificationId) {
        return;
      }

      // Decrement countdown
      if (this.nextSyncCountdown > 0) {
        this.nextSyncCountdown--;
      }

      // Notify UI components of countdown change
      if (this.countdownUpdateCallback) {
        this.countdownUpdateCallback(this.nextSyncCountdown);
      }

      // Update notification with new countdown
      await notifee.displayNotification({
        id: this.state.notificationId,
        title: `PGN Location Tracking - ${this.state.employeeName}`,
        body: `Tracking location every ${LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS} seconds. Next sync in ${this.nextSyncCountdown}s`,
        android: {
          channelId: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_ID,
          asForegroundService: true,
          ongoing: true,
          foregroundServiceTypes: [
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION,
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
          ],
        },
      });
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to update notification countdown:', error);
    }
  }

  // Create and display foreground notification to start tracking
  private async createForegroundNotification(employeeName: string): Promise<void> {
    try {
      const channelId = await notifee.createChannel({
        id: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_ID,
        name: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_NAME,
        importance: AndroidImportance[LOCATION_TRACKING_CONFIG.NOTIFICATION.IMPORTANCE.toUpperCase() as keyof typeof AndroidImportance],
      });





      // Display the notification with employee-specific information
      const notificationId = `location-tracking-${employeeName}-${Date.now()}`;
      await notifee.displayNotification({
        id: notificationId,
        title: `PGN Location Tracking - ${employeeName}`,
        body: `Tracking location every ${LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS} seconds during work hours`,
        android: {
          channelId,
          asForegroundService: true,
          ongoing: true,
          foregroundServiceTypes: [
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION,
            AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
          ],
        },
      });

      this.state.channelId = channelId;
      this.state.notificationId = notificationId;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to create foreground notification:', error);
      throw error;
    }
  }

  
  
  // Stop location tracking
  async stopTracking(checkOutData?: string): Promise<boolean> {
    try {
      if (!this.state.isTracking) {
        return true;
      }

      // Update state first to prevent further operations
      this.state.isTracking = false;

      // Clear tracking intervals using helper method
      this.cleanupIntervals();

      // Stop the foreground service (with error handling)
      try {
        await notifee.stopForegroundService();
      } catch (serviceError) {
        console.error('[LocationTrackingServiceNotifee] Failed to stop foreground service:', serviceError);
      }

      // Cancel scheduled notifications
      try {
        await notifee.cancelTriggerNotifications();
      } catch (cancelError) {
        console.error('[LocationTrackingServiceNotifee] Failed to cancel trigger notifications:', cancelError);
      }

      // Cancel the foreground notification
      if (this.state.notificationId) {
        try {
          await notifee.cancelNotification(this.state.notificationId);
        } catch (notificationError) {
          console.error('[LocationTrackingServiceNotifee] Failed to cancel notification:', notificationError);
        }
      }

      // Show stop notification if provided (optional, don't fail if this fails)
      if (checkOutData) {
        try {
          await notifee.displayNotification({
            id: 'location-stopped-' + Date.now().toString(),
            title: 'PGN Location Tracking',
            body: 'Location tracking stopped',
            android: {
              channelId: LOCATION_TRACKING_CONFIG.NOTIFICATION.CHANNEL_ID,
              importance: AndroidImportance.DEFAULT,
              autoCancel: true,
              smallIcon: 'ic_launcher_foreground',
              color: '#4CAF50',
              colorized: true,
              pressAction: {
                id: 'open-app',
                launchActivity: 'default',
                launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
              },
            },
          });
        } catch (displayError) {
          console.error('[LocationTrackingServiceNotifee] Failed to display stop notification:', displayError);
        }
      }

      // Clear emergency data if normal check-out
      if (checkOutData && checkOutData !== 'Low battery - automatic check-out' && checkOutData !== 'Permission revoked') {
        await this.clearEmergencyData();
      }

      // Clear state
      this.state = {
        isTracking: false,
        channelId: undefined,
        notificationId: undefined,
      };

      return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to stop tracking:', error);
      // Ensure cleanup happens even if stopTracking fails
      this.cleanupIntervals();
      this.state.isTracking = false;
      return false;
    }
  }

  // Check if tracking is active
  isTrackingActive(): boolean {
    return this.state.isTracking;
  }

  // Get current tracking state
  getState(): LocationTrackingState {
    return { ...this.state };
  }

  // Check service availability
  async isServiceAvailable(): Promise<boolean> {
    try {


      // Check if Notifee module is available
      if (!notifee) {
        console.error('[LocationTrackingServiceNotifee] Notifee module not available');
        return false;
      }

      // Check if we can get notification settings (basic functionality test)
      try {
        await notifee.getNotificationSettings();

        return true;
      } catch (settingsError) {
        console.error('[LocationTrackingServiceNotifee] Cannot get notification settings:', settingsError);
        return false;
      }
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Service not available:', error);
      return false;
    }
  }

  // Test notification functionality
  async testNotification(): Promise<boolean> {
    try {


      const testNotificationId = 'test-notification-' + Date.now().toString();
      await notifee.displayNotification({
        id: testNotificationId,
        title: 'PGN Test Notification',
        body: 'This is a test to verify Notifee is working correctly',
        android: {
          channelId: 'location-tracking',
          importance: AndroidImportance.DEFAULT,
          autoCancel: true,
          smallIcon: 'ic_launcher_foreground',
          color: '#2196F3',
          pressAction: {
            id: 'open-app',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
        },
      });



      // Auto-cancel test notification after 3 seconds
      setTimeout(async () => {
        try {
          await notifee.cancelNotification(testNotificationId);

        } catch (cancelError) {
          console.error('[LocationTrackingServiceNotifee] Failed to cancel test notification:', cancelError);
        }
      }, 3000);

      return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Test notification failed:', error);
      return false;
    }
  }

  // Get notification channels
  async getNotificationSettings(): Promise<any> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to get notification settings:', error);
      return null;
    }
  }

  // Get the current countdown for external sync (e.g., bottom navigation timer)
  getNextSyncCountdown(): number {
    return this.nextSyncCountdown;
  }
}

export const locationTrackingServiceNotifee = new LocationTrackingServiceNotifee();
export default locationTrackingServiceNotifee;