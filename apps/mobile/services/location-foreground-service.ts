import { NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api-client';
import { LocationData } from '@/utils/location';

const { LocationTrackingModule } = NativeModules;

export interface ServiceStatus {
  isRunning: boolean;
  employeeId?: string;
  employeeName?: string;
  checkInTime?: number;
  durationMs?: number;
}

export interface PendingDataCount {
  pendingLocations: number;
  pendingCheckOuts: number;
  totalPending: number;
}

export interface SyncResult {
  syncedLocations: number;
  failedLocations: number;
  syncedCheckOuts: number;
  failedCheckOuts: number;
  totalSynced: number;
  totalFailed: number;
}

export interface LocationUpdate {
  id: number;
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number;
  timestamp: number;
  synced: number;
  syncAttempts: number;
  createdAt: number;
}

export interface EmergencyCheckOut {
  id: number;
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number;
  checkOutTime: number;
  reason: string;
  checkOutData?: string;
  synced: number;
  syncAttempts: number;
  createdAt: number;
}

/**
 * React Native wrapper for the Android foreground location tracking service
 */
class LocationForegroundService {
  private isInitialized = false;
  private eventListeners: Map<string, any> = new Map();

  /**
   * Initialize the service (check if module is available)
   */
  async initialize(): Promise<boolean> {
    try {
      if (!LocationTrackingModule) {
        console.error('[LocationForegroundService] Native module not available');
        return false;
      }

      this.isInitialized = true;

      return true;
    } catch (error) {
      console.error('[LocationForegroundService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Start location tracking for an employee
   */
  async startTracking(employeeId: string, employeeName: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Service not initialized');
        }
      }



      const success = await LocationTrackingModule.startLocationTracking(employeeId, employeeName);

      if (success) {

      } else {
        console.error('[LocationForegroundService] Failed to start tracking');
      }

      return success;
    } catch (error) {
      console.error('[LocationForegroundService] Error starting tracking:', error);
      throw error;
    }
  }

  /**
   * Stop location tracking (check-out)
   */
  async stopTracking(checkOutData?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        console.warn('[LocationForegroundService] Service not initialized, nothing to stop');
        return true;
      }



      const success = await LocationTrackingModule.stopLocationTracking(checkOutData || null);

      if (success) {

      } else {
        console.error('[LocationForegroundService] Failed to stop tracking');
      }

      return success;
    } catch (error) {
      console.error('[LocationForegroundService] Error stopping tracking:', error);
      throw error;
    }
  }

  /**
   * Get current service status
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    try {
      if (!this.isInitialized) {
        return { isRunning: false };
      }

      const status = await LocationTrackingModule.getServiceStatus();
      return status;
    } catch (error) {
      console.error('[LocationForegroundService] Error getting service status:', error);
      return { isRunning: false };
    }
  }

  /**
   * Get count of pending data for an employee
   */
  async getPendingDataCount(employeeId: string): Promise<PendingDataCount> {
    try {
      if (!this.isInitialized) {
        return { pendingLocations: 0, pendingCheckOuts: 0, totalPending: 0 };
      }

      const count = await LocationTrackingModule.getPendingLocationCount(employeeId);
      return count;
    } catch (error) {
      console.error('[LocationForegroundService] Error getting pending count:', error);
      return { pendingLocations: 0, pendingCheckOuts: 0, totalPending: 0 };
    }
  }

  /**
   * Get pending location updates for an employee
   */
  async getPendingLocations(employeeId: string): Promise<LocationUpdate[]> {
    try {
      if (!this.isInitialized) {
        return [];
      }

      const locationsJson = await LocationTrackingModule.getPendingLocations(employeeId);
      const locations = JSON.parse(locationsJson);
      return Array.isArray(locations) ? locations : [];
    } catch (error) {
      console.error('[LocationForegroundService] Error getting pending locations:', error);
      return [];
    }
  }

  /**
   * Get pending emergency check-outs for an employee
   */
  async getPendingEmergencyCheckOuts(employeeId: string): Promise<EmergencyCheckOut[]> {
    try {
      if (!this.isInitialized) {
        return [];
      }

      const checkoutsJson = await LocationTrackingModule.getPendingEmergencyCheckOuts(employeeId);
      const checkouts = JSON.parse(checkoutsJson);
      return Array.isArray(checkouts) ? checkouts : [];
    } catch (error) {
      console.error('[LocationForegroundService] Error getting pending check-outs:', error);
      return [];
    }
  }

  /**
   * Mark location as synced with server
   */
  async markLocationSynced(locationId: number): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      return await LocationTrackingModule.markLocationSynced(locationId);
    } catch (error) {
      console.error('[LocationForegroundService] Error marking location synced:', error);
      return false;
    }
  }

  /**
   * Mark emergency check-out as synced with server
   */
  async markEmergencyCheckOutSynced(checkOutId: number): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }

      return await LocationTrackingModule.markEmergencyCheckOutSynced(checkOutId);
    } catch (error) {
      console.error('[LocationForegroundService] Error marking check-out synced:', error);
      return false;
    }
  }

  /**
   * Clear all stored data for an employee (for new check-in)
   */
  async clearEmployeeData(employeeId: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return true; // Nothing to clear
      }


      return await LocationTrackingModule.clearEmployeeData(employeeId);
    } catch (error) {
      console.error('[LocationForegroundService] Error clearing employee data:', error);
      return false;
    }
  }

  /**
   * Cleanup old records
   */
  async cleanupOldRecords(daysToKeep: number = 30): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return true;
      }

      return await LocationTrackingModule.cleanupOldRecords(daysToKeep);
    } catch (error) {
      console.error('[LocationForegroundService] Error cleaning up records:', error);
      return false;
    }
  }

  /**
   * Sync all pending data to server
   */
  async syncPendingDataToServer(): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        return {
          syncedLocations: 0,
          failedLocations: 0,
          syncedCheckOuts: 0,
          failedCheckOuts: 0,
          totalSynced: 0,
          totalFailed: 0
        };
      }

      // Get API URL and auth token from your API client
      const apiUrl = 'https://your-api-url.com'; // This should come from your config
      const authToken = await this.getAuthToken(); // Get stored auth token

      const result = await LocationTrackingModule.syncPendingDataToServer(apiUrl, authToken);


      return result;
    } catch (error) {
      console.error('[LocationForegroundService] Error syncing pending data:', error);
      return {
        syncedLocations: 0,
        failedLocations: 0,
        syncedCheckOuts: 0,
        failedCheckOuts: 0,
        totalSynced: 0,
        totalFailed: 0
      };
    }
  }

  /**
   * Sync pending data for a specific employee using actual API
   */
  async syncPendingDataForEmployee(employeeId: string): Promise<SyncResult> {
    try {
      if (!this.isInitialized) {
        return {
          syncedLocations: 0,
          failedLocations: 0,
          syncedCheckOuts: 0,
          failedCheckOuts: 0,
          totalSynced: 0,
          totalFailed: 0
        };
      }



      // Get pending locations
      const pendingLocations = await this.getPendingLocations(employeeId);
      let syncedLocations = 0;
      let failedLocations = 0;

      // Sync each location
      for (const location of pendingLocations) {
        try {
          const success = await this.syncLocationToServer(location);
          if (success) {
            await this.markLocationSynced(location.id);
            syncedLocations++;
          } else {
            failedLocations++;
          }
        } catch (error) {
          console.error(`Failed to sync location ${location.id}:`, error);
          failedLocations++;
        }
      }

      // Get pending emergency check-outs
      const pendingCheckOuts = await this.getPendingEmergencyCheckOuts(employeeId);
      let syncedCheckOuts = 0;
      let failedCheckOuts = 0;

      // Sync each emergency check-out
      for (const checkout of pendingCheckOuts) {
        try {
          const success = await this.syncEmergencyCheckOutToServer(checkout);
          if (success) {
            await this.markEmergencyCheckOutSynced(checkout.id);
            syncedCheckOuts++;
          } else {
            failedCheckOuts++;
          }
        } catch (error) {
          console.error(`Failed to sync emergency check-out ${checkout.id}:`, error);
          failedCheckOuts++;
        }
      }

      const result: SyncResult = {
        syncedLocations,
        failedLocations,
        syncedCheckOuts,
        failedCheckOuts,
        totalSynced: syncedLocations + syncedCheckOuts,
        totalFailed: failedLocations + failedCheckOuts
      };


      return result;
    } catch (error) {
      console.error('[LocationForegroundService] Error syncing employee data:', error);
      return {
        syncedLocations: 0,
        failedLocations: 0,
        syncedCheckOuts: 0,
        failedCheckOuts: 0,
        totalSynced: 0,
        totalFailed: 0
      };
    }
  }

  /**
   * Sync individual location to server
   */
  private async syncLocationToServer(location: LocationUpdate): Promise<boolean> {
    try {
      const response = await api.post('/attendance/location-update', {
        employeeId: location.employeeId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        batteryLevel: location.batteryLevel,
        timestamp: new Date(location.timestamp).toISOString(),
      });

      return response.success;
    } catch (error) {
      console.error('Error syncing location to server:', error);
      return false;
    }
  }

  /**
   * Sync emergency check-out to server
   */
  private async syncEmergencyCheckOutToServer(checkout: EmergencyCheckOut): Promise<boolean> {
    try {
      const response = await api.post('/attendance/emergency-checkout', {
        employeeId: checkout.employeeId,
        latitude: checkout.latitude,
        longitude: checkout.longitude,
        accuracy: checkout.accuracy,
        batteryLevel: checkout.batteryLevel,
        checkOutTime: new Date(checkout.checkOutTime).toISOString(),
        reason: checkout.reason,
        checkOutData: checkout.checkOutData ? JSON.parse(checkout.checkOutData) : null,
      });

      return response.success;
    } catch (error) {
      console.error('Error syncing emergency check-out to server:', error);
      return false;
    }
  }

  /**
   * Handle app crash recovery - sync pending data on next launch
   */
  async handleCrashRecovery(employeeId: string): Promise<void> {
    try {


      // First, sync any pending data from previous session
      await this.syncPendingDataForEmployee(employeeId);

      // Clear local storage for fresh check-in
      await this.clearEmployeeData(employeeId);


    } catch (error) {
      console.error('[LocationForegroundService] Error during crash recovery:', error);
    }
  }

  /**
   * Get stored auth token
   */
  private async getAuthToken(): Promise<string> {
    try {
      // Using AsyncStorage instead of SecureStore for simplicity
      return await AsyncStorage.getItem('auth_token') || '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  }

  /**
   * Add event listener for location updates
   */
  addLocationUpdateListener(callback: (location: LocationData) => void): () => void {
    const listener = DeviceEventEmitter.addListener('locationUpdate', callback);
    this.eventListeners.set('locationUpdate', listener);
    return () => listener.remove();
  }

  /**
   * Add event listener for service status changes
   */
  addServiceStatusListener(callback: (status: ServiceStatus) => void): () => void {
    const listener = DeviceEventEmitter.addListener('serviceStatusChange', callback);
    this.eventListeners.set('serviceStatusChange', listener);
    return () => listener.remove();
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.eventListeners.forEach((listener) => listener.remove());
    this.eventListeners.clear();
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!LocationTrackingModule;
  }
}

// Export singleton instance
export const locationForegroundService = new LocationForegroundService();

