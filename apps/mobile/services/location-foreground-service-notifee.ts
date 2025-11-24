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

interface LocationTrackingState {
  isTracking: boolean;
  employeeId?: string;
  employeeName?: string;
  channelId?: string;
  notificationId?: string;
}

type LocationUpdateCallback = (location: LocationData, batteryLevel: number) => Promise<void>;

class LocationTrackingServiceNotifee {
  private state: LocationTrackingState = {
    isTracking: false,
  };

  private trackingInterval: ReturnType<typeof setInterval> | null = null;
  private notificationUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private locationUpdateCallback?: LocationUpdateCallback;
  private isInitialized = false;
  private nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS;

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

      this.isInitialized = true;
            return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to initialize:', error);
      // Don't fail completely, allow the service to try anyway
      this.isInitialized = true;
      return true;
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
  async startTracking(employeeId: string, employeeName: string): Promise<boolean> {
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

      // Update state
      this.state = {
        isTracking: true,
        employeeId,
        employeeName,
      };

      // Create foreground notification to start tracking
      await this.createForegroundNotification(employeeName);

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
    // Clear any existing intervals
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    if (this.notificationUpdateInterval) {
      clearInterval(this.notificationUpdateInterval);
    }

    // Reset countdown
    this.nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS;

    // Initial location update
    this.sendLocationUpdate();

    // Set interval for location updates based on config
    this.trackingInterval = setInterval(() => {
      this.sendLocationUpdate();
      this.nextSyncCountdown = LOCATION_TRACKING_CONFIG.UPDATE_INTERVAL_SECONDS; // Reset countdown after each sync
    }, UPDATE_INTERVAL_MS);

    // Set interval for 1 second notification updates (countdown)
    this.notificationUpdateInterval = setInterval(() => {
      this.updateNotificationCountdown();
    }, 1000);
  }

  // Send location and battery update
  private async sendLocationUpdate(): Promise<void> {
    try {
      if (!this.state.isTracking) return;

      // Get current location
      const location = await getCurrentLocation();

      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

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



      // Update state
      this.state.isTracking = false;

      // Clear tracking intervals
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }
      if (this.notificationUpdateInterval) {
        clearInterval(this.notificationUpdateInterval);
        this.notificationUpdateInterval = null;
      }

      // Stop the foreground service
      await notifee.stopForegroundService();

      // Cancel scheduled notifications
      await notifee.cancelTriggerNotifications();

      // Cancel the foreground notification
      if (this.state.notificationId) {
        await notifee.cancelNotification(this.state.notificationId);

      }

      // Show stop notification if provided
      if (checkOutData) {
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
        const settings = await notifee.getNotificationSettings();

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
}

export const locationTrackingServiceNotifee = new LocationTrackingServiceNotifee();
export default locationTrackingServiceNotifee;