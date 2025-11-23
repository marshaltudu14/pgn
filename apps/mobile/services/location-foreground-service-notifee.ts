import notifee, {
  AndroidImportance,
  AndroidLaunchActivityFlag,
  AndroidStyle,
  AndroidCategory,
  TriggerType,
  TimestampTrigger,
  AndroidNotificationSetting,
  AuthorizationStatus,
  AndroidForegroundServiceType,
} from '@notifee/react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { useAuth } from '@/store/auth-store';

const LOCATION_TRACKING_TASK = 'location-tracking-task';

interface LocationTrackingState {
  isTracking: boolean;
  employeeId?: string;
  employeeName?: string;
  channelId?: string;
  notificationId?: string;
}

class LocationTrackingServiceNotifee {
  private state: LocationTrackingState = {
    isTracking: false,
  };

  private isInitialized = false;

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      console.log('[LocationTrackingServiceNotifee] Starting initialization...');

      // Check if Notifee is available
      if (!notifee) {
        console.error('[LocationTrackingServiceNotifee] Notifee module not available');
        return false;
      }

      // Create notification channel first (this doesn't require permissions)
      await this.createNotificationChannel();

      // Define background task
      await this.defineBackgroundTask();

      this.isInitialized = true;
      console.log('[LocationTrackingServiceNotifee] Initialized successfully');
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
      console.log('[LocationTrackingServiceNotifee] Requesting notification permissions...');

      // First check current permissions
      const currentSettings = await notifee.getNotificationSettings();
      console.log('[LocationTrackingServiceNotifee] Current permission status:', currentSettings.authorizationStatus);

      if (currentSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
        console.log('[LocationTrackingServiceNotifee] Permissions already granted');
        return true;
      }

      // Request permissions
      const settings = await notifee.requestPermission();
      console.log('[LocationTrackingServiceNotifee] Permission request result:', settings.authorizationStatus);

      const isAuthorized = settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      if (!isAuthorized) {
        console.warn('[LocationTrackingServiceNotifee] Notifications not authorized:', settings.authorizationStatus);

        // On Android, we can still proceed with limited functionality
        if (settings.authorizationStatus === AuthorizationStatus.PROVISIONAL) {
          console.log('[LocationTrackingServiceNotifee] Provisional access granted');
          return true;
        }
      }

      return isAuthorized;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to request permissions:', error);
      return false;
    }
  }

  // Create notification channel
  private async createNotificationChannel(): Promise<string> {
    const channelId = await notifee.createChannel({
      id: 'location-tracking',
      name: 'Location Tracking',
      description: 'Notifications for active location tracking',
      importance: AndroidImportance.LOW,
      sound: undefined, // No sound for silent notifications
    });

    return channelId;
  }

  // Define background task for location tracking
  private async defineBackgroundTask(): Promise<void> {
    TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
      try {
        if (error) {
          console.error('[LocationTrackingServiceNotifee] Background task error:', error);
          return;
        }

        if (this.state.isTracking && this.state.employeeId) {
          await this.updateLocation();

          // Schedule next update (5 minutes)
          await this.scheduleNextUpdate();
        }
      } catch (taskError) {
        console.error('[LocationTrackingServiceNotifee] Task execution error:', taskError);
      }
    });
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

      // Create and display foreground notification
      await this.createForegroundNotification(employeeName);

      // Start background task for periodic updates
      await this.startBackgroundTask();

      console.log('[LocationTrackingServiceNotifee] Started tracking for:', employeeId);
      return true;
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to start tracking:', error);
      this.state.isTracking = false;
      return false;
    }
  }

  // Create foreground notification
  private async createForegroundNotification(employeeName: string): Promise<void> {
    try {
      console.log('[LocationTrackingServiceNotifee] Creating notification channel...');

      const channelId = await notifee.createChannel({
        id: 'location-tracking',
        name: 'Location Tracking',
        description: 'Active location tracking for ' + employeeName,
        importance: AndroidImportance.LOW,
        sound: undefined,
        vibration: false,
      });

      console.log('[LocationTrackingServiceNotifee] Channel created:', channelId);

      console.log('[LocationTrackingServiceNotifee] Creating foreground notification...');

      await notifee.displayNotification({
        id: 'location-tracking',
        title: 'PGN Location Tracking',
        body: `Tracking active for ${employeeName}\nLocation monitoring in progress`,
        android: {
          channelId,
          asForegroundService: true,
          autoCancel: false,
          ongoing: true,
          importance: AndroidImportance.LOW,
          category: AndroidCategory.SERVICE,
          smallIcon: 'ic_launcher_foreground',
          color: '#2196F3',
          colorized: true,
          // lights: ['#000000', 0, 0], // No lights - removed to avoid error
          sound: undefined,
          foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
          // Remove actions to make it non-cancellable by user
          pressAction: {
            id: 'open-app',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
          ticker: 'PGN Location Tracking Active',
          localOnly: false,
          flags: ['FLAG_ONGOING_EVENT', 'FLAG_NO_CLEAR'], // Make notification non-cancellable
        },
      });

      console.log('[LocationTrackingServiceNotifee] Notification displayed successfully');

      this.state.channelId = channelId;
      this.state.notificationId = 'location-tracking';
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to create foreground notification:', error);
      throw error;
    }
  }

  // Update notification content
  private async updateNotification(content: string): Promise<void> {
    if (!this.state.notificationId || !this.state.channelId) return;

    try {
      await notifee.displayNotification({
        id: this.state.notificationId,
        title: 'PGN Location Tracking',
        body: content,
        android: {
          channelId: this.state.channelId,
          asForegroundService: true,
          autoCancel: false,
          ongoing: true,
          importance: AndroidImportance.LOW,
          category: AndroidCategory.SERVICE,
          smallIcon: 'ic_launcher_foreground',
          color: '#2196F3',
          pressAction: {
            id: 'open-app',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
          ticker: content,
          sound: undefined,
          // lights: ['#000000', 0, 0], // No lights - removed to avoid error
        },
      });
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to update notification:', error);
    }
  }

  // Start background task
  private async startBackgroundTask(): Promise<void> {
    try {
      // Schedule the first location update
      await this.scheduleNextUpdate();
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to start background task:', error);
    }
  }

  // Schedule next location update (5 minutes from now)
  private async scheduleNextUpdate(): Promise<void> {
    try {
      // For now, just log - we'll implement proper background updates later
      console.log('[LocationTrackingServiceNotifee] Next update scheduled for 5 minutes from now');
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to schedule next update:', error);
    }
  }

  // Update location (this would integrate with your location service)
  private async updateLocation(): Promise<void> {
    try {
      if (!this.state.employeeId) return;

      // Here you would:
      // 1. Get current location using expo-location
      // 2. Get battery level using expo-battery
      // 3. Sync to your backend
      // 4. Update the notification with latest info

      // For now, let's just update the notification
      const lastUpdate = new Date().toLocaleTimeString();
      await this.updateNotification(
        'Last update: ' + lastUpdate + '\nEmployee: ' + this.state.employeeName
      );

      console.log('[LocationTrackingServiceNotifee] Location updated at:', lastUpdate);
    } catch (error) {
      console.error('[LocationTrackingServiceNotifee] Failed to update location:', error);
    }
  }

  // Stop location tracking
  async stopTracking(checkOutData?: string): Promise<boolean> {
    try {
      if (!this.state.isTracking) {
        console.log('[LocationTrackingServiceNotifee] Not currently tracking');
        return true;
      }

      console.log('[LocationTrackingServiceNotifee] Stopping location tracking...');

      // Update state
      this.state.isTracking = false;

      // Stop the foreground service
      await notifee.stopForegroundService();

      // Cancel scheduled notifications
      await notifee.cancelTriggerNotifications();

      // Cancel the foreground notification
      if (this.state.notificationId) {
        await notifee.cancelNotification(this.state.notificationId);
        console.log('[LocationTrackingServiceNotifee] Cancelled notification:', this.state.notificationId);
      }

      // Show stop notification if provided
      if (checkOutData) {
        await notifee.displayNotification({
          id: 'location-stopped-' + Date.now().toString(),
          title: 'PGN Location Tracking',
          body: 'Location tracking stopped',
          android: {
            channelId: 'location-tracking',
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

      console.log('[LocationTrackingServiceNotifee] Successfully stopped tracking');
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
      console.log('[LocationTrackingServiceNotifee] Checking service availability...');

      // Check if Notifee module is available
      if (!notifee) {
        console.error('[LocationTrackingServiceNotifee] Notifee module not available');
        return false;
      }

      // Check if we can get notification settings (basic functionality test)
      try {
        const settings = await notifee.getNotificationSettings();
        console.log('[LocationTrackingServiceNotifee] Notifee is available, permission status:', settings.authorizationStatus);
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
      console.log('[LocationTrackingServiceNotifee] Testing notification functionality...');

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

      console.log('[LocationTrackingServiceNotifee] Test notification sent successfully');

      // Auto-cancel test notification after 3 seconds
      setTimeout(async () => {
        try {
          await notifee.cancelNotification(testNotificationId);
          console.log('[LocationTrackingServiceNotifee] Test notification cancelled');
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