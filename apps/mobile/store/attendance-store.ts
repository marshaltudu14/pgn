import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashMode } from 'expo-camera';
import {
  AttendanceResponse,
  LocationData,
  AttendanceStatus,
  AttendanceStatusResponse,
  CheckInMobileRequest,
  CheckOutMobileRequest
} from '@pgn/shared';
import { api } from '@/services/api-client';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
// Utility functions
import {
  isCameraAvailable,
  takePhoto,
  pickPhotoFromLibrary,
  validatePhoto,
  CameraError,
  compressPhoto,
  toggleCameraType,
  PhotoCaptureResult,
  CameraOptions
} from '@/utils/camera';
import {
  isLocationAvailable,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
  hasSignificantMovement
} from '@/utils/location';

export interface AttendanceQueueItem {
  id: string;
  type: 'checkin' | 'checkout';
  data: CheckInMobileRequest | CheckOutMobileRequest;
  timestamp: number;
  retryCount: number;
  lastRetry?: number;
}

export interface DeviceInfo {
  batteryLevel?: number;
  platform?: string;
  version?: string;
  model?: string;
  networkInfo?: {
    type?: string;
    strength?: number;
  };
}

interface AttendanceStoreState {
  // Attendance state
  currentStatus: AttendanceStatus;
  isLoading: boolean;
  error: string | null;
  lastLocationUpdate: Date | null;
  batteryLevel: number | null;
  isLocationTracking: boolean;

  // Check-in/out state
  isCheckingIn: boolean;
  isCheckingOut: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  workHours?: number;
  totalDistance?: number;

  // Verification state
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';
  requiresVerification: boolean;
  requiresCheckOut: boolean;

  // Location tracking state
  locationHistory: LocationData[];
  movementThreshold: number; // meters
  locationWatcher: Location.LocationSubscription | null;

  // Offline queue state
  offlineQueue: AttendanceQueueItem[];
  offlineQueueCount: number;
  isOnline: boolean;

  // Camera state
  cameraPermission: boolean;
  locationPermission: boolean;
  isTakingPhoto: boolean;
  lastPhotoCapture: PhotoCaptureResult | null;

  // Actions
  fetchAttendanceStatus: () => Promise<void>;
  checkIn: (request: CheckInMobileRequest) => Promise<AttendanceResponse>;
  checkOut: (request: CheckOutMobileRequest) => Promise<AttendanceResponse>;
  emergencyCheckOut: (request: CheckOutMobileRequest) => Promise<AttendanceResponse>;

  // Location tracking
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  updateLocation: (location: LocationData) => void;

  // Permissions and initialization
  initializePermissions: () => Promise<void>;
  checkPermissions: () => Promise<void>;

  // Offline management
  loadOfflineQueue: () => Promise<void>;
  saveOfflineQueue: () => Promise<void>;
  queueForOffline: (type: 'checkin' | 'checkout', data: CheckInMobileRequest | CheckOutMobileRequest) => Promise<void>;
  processOfflineQueue: () => Promise<{ processed: number; failed: number }>;
  clearOfflineQueue: () => Promise<void>;

  // Utility methods
  getDeviceInfo: () => DeviceInfo;
  shouldQueueForOffline: (error: any) => boolean;

  // Camera methods
  capturePhoto: (options?: CameraOptions) => Promise<PhotoCaptureResult>;
  pickPhoto: (options?: { allowsEditing?: boolean; quality?: number; aspectRatio?: number }) => Promise<PhotoCaptureResult>;
  validateCapturedPhoto: (photo: PhotoCaptureResult) => { isValid: boolean; errors: string[]; warnings: string[] };
  compressCapturedPhoto: (uri: string, targetSize?: number) => Promise<PhotoCaptureResult>;

  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setBatteryLevel: (level: number) => void;
  setIsOnline: (online: boolean) => void;

  // Reset
  reset: () => void;
}

export const useAttendance = create<AttendanceStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentStatus: 'CHECKED_OUT',
        isLoading: false,
        error: null,
        lastLocationUpdate: null,
        batteryLevel: null,
        isLocationTracking: false,
        isCheckingIn: false,
        isCheckingOut: false,
        verificationStatus: 'PENDING',
        requiresVerification: false,
        requiresCheckOut: false,
        locationHistory: [],
        movementThreshold: 50, // 50 meters threshold
        locationWatcher: null,
        offlineQueue: [],
        offlineQueueCount: 0,
        isOnline: true,
        cameraPermission: false,
        locationPermission: false,
        isTakingPhoto: false,
        lastPhotoCapture: null,

        // Initialize permissions only (no API calls - AuthGuard handles authentication)
        initializePermissions: async () => {
          try {
            // Check permissions
            const cameraAvailable = await isCameraAvailable();
            const locationAvailable = await isLocationAvailable();

            set({
              cameraPermission: cameraAvailable,
              locationPermission: locationAvailable,
            });

            // Note: We do NOT fetch attendance status here.
            // The attendance status should only be fetched when explicitly needed
            // (e.g., when user clicks attendance button or opens attendance screen)
            // AuthGuard ensures user is authenticated, so no auth checks needed here.

          } catch (error) {
            console.error('Failed to initialize permissions:', error);
            set({
              cameraPermission: false,
              locationPermission: false,
            });
          }
        },

        // Check current permissions
        checkPermissions: async () => {
          try {
            const cameraAvailable = await isCameraAvailable();
            const locationAvailable = await isLocationAvailable();

            set({
              cameraPermission: cameraAvailable,
              locationPermission: locationAvailable,
            });
          } catch (error) {
            console.error('Failed to check permissions:', error);
          }
        },

        // Fetch current attendance status - only call when explicitly needed
        fetchAttendanceStatus: async () => {
          set({ isLoading: true, error: null });

          try {
            const statusResponse = await api.get<{ success: boolean; data: AttendanceStatusResponse }>('/attendance/status');

            if (!statusResponse.success) {
              throw new Error(statusResponse.error || 'Failed to get attendance status');
            }

            const data = statusResponse.data?.data;
            if (!data) {
              throw new Error('Invalid attendance status response');
            }

            set({
              currentStatus: data.status,
              isLoading: false,
              error: null,
              checkInTime: data.checkInTime,
              checkOutTime: data.checkOutTime,
              workHours: data.workHours,
              totalDistance: data.totalDistance,
              lastLocationUpdate: data.lastLocationUpdate,
              batteryLevel: data.batteryLevel,
              verificationStatus: data.verificationStatus,
              requiresCheckOut: data.requiresCheckOut,
            });

            // Start location tracking if checked in
            if (data.status === 'CHECKED_IN') {
              await get().startLocationTracking();
            }

          } catch (error) {
            console.error('Failed to fetch attendance status:', error);
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch attendance status',
            });
          }
        },

        // Check in with location and selfie
        checkIn: async (request: CheckInMobileRequest): Promise<AttendanceResponse> => {
          set({ isCheckingIn: true, error: null });

          try {
            // Get current location if not provided
            if (!request.location) {
              try {
                const location = await getCurrentLocation();
                request.location = {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: location.timestamp.getTime(),
                  address: location.address
                };
              } catch {
                set({
                  isCheckingIn: false,
                  error: 'Location is required for check-in',
                });
                return {
                  success: false,
                  message: 'Location is required for check-in'
                };
              }
            }

            
            const deviceInfo = request.deviceInfo || await get().getDeviceInfo();

            // Build API request
            const apiRequest = {
              location: {
                latitude: request.location.latitude,
                longitude: request.location.longitude,
                accuracy: request.location.accuracy,
                timestamp: request.location.timestamp ? new Date(request.location.timestamp).toISOString() : new Date().toISOString(),
                address: request.location.address
              },
              selfieData: request.selfie,
              faceConfidence: request.faceConfidence || 0,
              deviceInfo
            };

            // Make API call
            const response = await api.post<{ success: boolean; data: any; message: string }>('/attendance/checkin', apiRequest);

            if (!response.success) {
              throw new Error(response.error || 'Failed to check in');
            }

            const responseData = response.data?.data;
            if (!responseData) {
              throw new Error('Invalid check-in response');
            }

            const result: AttendanceResponse = {
              success: response.data?.success || false,
              message: response.data?.message || 'Check-in successful',
              timestamp: new Date(responseData.timestamp),
              checkInTime: new Date(responseData.checkInTime),
              verificationStatus: responseData.verificationStatus
            };

            if (result.success) {
              set({
                currentStatus: 'CHECKED_IN',
                isCheckingIn: false,
                checkInTime: result.checkInTime,
                error: null,
                verificationStatus: (result.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED') || 'PENDING',
                requiresVerification: result.verificationStatus === 'PENDING'
              });

              // Start location tracking
              await get().startLocationTracking();
            }

            return result;

          } catch (error) {
            console.error('Check-in failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Check-in failed';

            set({
              isCheckingIn: false,
              error: errorMessage,
            });

            return {
              success: false,
              message: errorMessage
            };
          }
        },

        // Check out with location and selfie
        checkOut: async (request: CheckOutMobileRequest): Promise<AttendanceResponse> => {
          set({ isCheckingOut: true, error: null });

          try {
            // Get current location if not provided
            if (!request.location) {
              try {
                const location = await getCurrentLocation();
                request.location = {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                  timestamp: location.timestamp.getTime(),
                  address: location.address
                };
              } catch {
                set({
                  isCheckingOut: false,
                  error: 'Location is required for check-out',
                });
                return {
                  success: false,
                  message: 'Location is required for check-out'
                };
              }
            }

            
            const deviceInfo = request.deviceInfo || await get().getDeviceInfo();

            // Build API request
            const apiRequest: any = {
              location: {
                latitude: request.location.latitude,
                longitude: request.location.longitude,
                accuracy: request.location.accuracy,
                timestamp: request.location.timestamp ? new Date(request.location.timestamp).toISOString() : new Date().toISOString(),
                address: request.location.address
              },
              selfieData: request.selfie,
              faceConfidence: request.faceConfidence || 0,
              deviceInfo
            };

            // Add last location data if available
            if (request.lastLocationData) {
              apiRequest.lastLocationData = {
                latitude: request.lastLocationData.latitude,
                longitude: request.lastLocationData.longitude,
                accuracy: request.lastLocationData.accuracy,
                timestamp: request.lastLocationData.timestamp ? new Date(request.lastLocationData.timestamp).toISOString() : new Date().toISOString(),
                address: request.lastLocationData.address
              };
            }

            // Make API call
            const response = await api.post<{ success: boolean; data: any; message: string }>('/attendance/checkout', apiRequest);

            if (!response.success) {
              throw new Error(response.error || 'Failed to check out');
            }

            const responseData = response.data?.data;
            if (!responseData) {
              throw new Error('Invalid check-out response');
            }

            const result: AttendanceResponse = {
              success: response.data?.success || false,
              message: response.data?.message || 'Check-out successful',
              timestamp: new Date(responseData.timestamp),
              checkOutTime: new Date(responseData.checkOutTime),
              workHours: responseData.workHours,
              verificationStatus: responseData.verificationStatus
            };

            if (result.success) {
              set({
                currentStatus: 'CHECKED_OUT',
                isCheckingOut: false,
                checkOutTime: result.checkOutTime,
                workHours: result.workHours,
                error: null,
                verificationStatus: (result.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED') || 'PENDING',
                requiresVerification: result.verificationStatus === 'PENDING'
              });

              // Stop location tracking
              await get().stopLocationTracking();
            }

            return result;

          } catch (error) {
            console.error('Check-out failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Check-out failed';

            set({
              isCheckingOut: false,
              error: errorMessage,
            });

            return {
              success: false,
              message: errorMessage
            };
          }
        },

        // Emergency check-out (for scenarios like app closure, battery drain, etc.)
        emergencyCheckOut: async (request: CheckOutMobileRequest): Promise<AttendanceResponse> => {
          set({ isCheckingOut: true, error: null });

          try {
            
            const deviceInfo = request.deviceInfo || await get().getDeviceInfo();

            // Build checkout request with emergency method
            const emergencyRequest = {
              location: {
                latitude: request.location?.latitude || 0,
                longitude: request.location?.longitude || 0,
                accuracy: request.location?.accuracy,
                timestamp: request.location?.timestamp ? new Date(request.location.timestamp).toISOString() : new Date().toISOString(),
                address: request.location?.address
              },
              selfieData: request.selfie,
              faceConfidence: request.faceConfidence || 0,
              deviceInfo,
              method: request.method || 'APP_CLOSED',
              reason: request.reason || 'Emergency check-out'
            };

            // Make API call
            const response = await api.post<{ success: boolean; data: any; message: string }>('/attendance/checkout', emergencyRequest);

            if (!response.success) {
              throw new Error(response.error || 'Failed to check out');
            }

            const responseData = response.data?.data;
            if (!responseData) {
              throw new Error('Invalid check-out response');
            }

            const result: AttendanceResponse = {
              success: response.data?.success || false,
              message: response.data?.message || 'Check-out successful',
              timestamp: new Date(responseData.timestamp),
              checkOutTime: new Date(responseData.checkOutTime),
              workHours: responseData.workHours,
              verificationStatus: responseData.verificationStatus
            };

            if (result.success) {
              set({
                currentStatus: 'CHECKED_OUT',
                isCheckingOut: false,
                checkOutTime: result.checkOutTime,
                workHours: result.workHours,
                error: null,
                verificationStatus: 'FLAGGED',
                requiresVerification: true
              });

              // Stop location tracking
              await get().stopLocationTracking();
            }

            return result;

          } catch (error) {
            console.error('Emergency check-out failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Emergency check-out failed';

            set({
              isCheckingOut: false,
              error: errorMessage,
            });

            return {
              success: false,
              message: errorMessage
            };
          }
        },

        // Start background location tracking
        startLocationTracking: async () => {
          try {
            if (get().isLocationTracking) {
              return; // Already tracking
            }

            // Define tracking options for attendance
            const trackingOptions = {
              accuracy: Location.Accuracy.Balanced as Location.Accuracy,
              timeInterval: 5 * 60 * 1000, // 5 minutes
              distanceInterval: 0, // No distance filter
              showsBackgroundLocationIndicator: true,
              foregroundService: {
                notificationTitle: 'PGN Attendance Tracking',
                notificationBody: 'Your location is being tracked during work hours',
              },
            };

            const watcher = await startLocationTracking(trackingOptions, (location) => {
              get().updateLocation(location);
            });

            set({
              isLocationTracking: true,
              lastLocationUpdate: new Date(),
              locationWatcher: watcher,
            });

          } catch (error) {
            console.error('Failed to start location tracking:', error);
            set({
              error: 'Failed to start location tracking',
            });
          }
        },

        // Stop background location tracking
        stopLocationTracking: async () => {
          try {
            if (!get().isLocationTracking) {
              return; // Not tracking
            }

            await stopLocationTracking(get().locationWatcher);

            set({
              isLocationTracking: false,
              lastLocationUpdate: null,
              locationWatcher: null,
            });

          } catch (error) {
            console.error('Failed to stop location tracking:', error);
          }
        },

        // Update location in store
        updateLocation: (location: LocationData) => {
          const { locationHistory, movementThreshold } = get();
          const lastLocation = locationHistory[locationHistory.length - 1];

          // Only add location if it meets movement threshold
          if (!lastLocation || hasSignificantMovement(lastLocation, location, movementThreshold)) {
            set({
              locationHistory: [...locationHistory, location],
              lastLocationUpdate: new Date(),
            });

            // Keep only recent location history (last 100 points)
            const maxHistoryLength = 100;
            if (locationHistory.length > maxHistoryLength) {
              set(state => ({
                locationHistory: state.locationHistory.slice(-maxHistoryLength),
              }));
            }
          } else {
            // Update last location update even without significant movement
            set({ lastLocationUpdate: new Date() });
          }
        },

        // Process offline queue
        processOfflineQueue: async () => {
          try {
            // TODO: Implement offline queue processing
            const result = { processed: 0, failed: 0 };

            set({
              offlineQueueCount: result.processed + result.failed,
            });

            return result;

          } catch (error) {
            console.error('Failed to process offline queue:', error);
            return { processed: 0, failed: 0 };
          }
        },

        // Clear offline queue
        clearOfflineQueue: async () => {
          try {
            // TODO: Implement clear offline queue
            set({ offlineQueue: [], offlineQueueCount: 0 });
            set({ offlineQueueCount: 0 });
          } catch (error) {
            console.error('Failed to clear offline queue:', error);
          }
        },

        // Clear error state
        clearError: () => {
          set({ error: null });
        },

        // Set loading state
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        // Set battery level
        setBatteryLevel: (level: number) => {
          set({ batteryLevel: level });
        },

        // Set online/offline status
        setIsOnline: (online: boolean) => {
          set({ isOnline: online });

          // When coming back online, process offline queue
          if (online && get().offlineQueueCount > 0) {
            setTimeout(() => {
              get().processOfflineQueue();
            }, 1000);
          }
        },

        // Get current device information
        getDeviceInfo: async (): Promise<DeviceInfo> => {
          try {
            const batteryLevel = await Battery.getBatteryLevelAsync();
            return {
              batteryLevel: batteryLevel > 0 ? Math.round(batteryLevel * 100) : undefined,
              platform: 'mobile',
              version: '1.0.0',
              model: 'React Native Device'
            };
          } catch (error) {
            const state = get();
            return {
              batteryLevel: state.batteryLevel || undefined,
              platform: 'mobile',
              version: '1.0.0',
              model: 'React Native Device'
            };
          }
        },

        // Check if error should be queued for offline processing
        shouldQueueForOffline: (error: any): boolean => {
          // Queue for network errors and timeouts
          return (
            error.name === 'TypeError' || // Network error
            error.name === 'AbortError' || // Timeout
            error.message?.includes('Network request failed') ||
            error.message?.includes('timeout')
          );
        },

        // Load offline queue from storage
        loadOfflineQueue: async (): Promise<void> => {
          try {
            const stored = await AsyncStorage.getItem('attendance-offline-queue');
            if (stored) {
              const queue = JSON.parse(stored);
              set({
                offlineQueue: queue,
                offlineQueueCount: queue.length
              });
            }
          } catch (error) {
            console.error('Failed to load offline queue:', error);
          }
        },

        // Save offline queue to storage
        saveOfflineQueue: async (): Promise<void> => {
          try {
            const { offlineQueue } = get();
            await AsyncStorage.setItem('attendance-offline-queue', JSON.stringify(offlineQueue));
            set({ offlineQueueCount: offlineQueue.length });
          } catch (error) {
            console.error('Failed to save offline queue:', error);
          }
        },

        // Queue attendance action for offline processing
        queueForOffline: async (type: 'checkin' | 'checkout', data: CheckInMobileRequest | CheckOutMobileRequest): Promise<void> => {
          const { offlineQueue } = get();
          const queueItem: AttendanceQueueItem = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
            retryCount: 0
          };

          const updatedQueue = [...offlineQueue, queueItem];
          set({ offlineQueue: updatedQueue });
          await get().saveOfflineQueue();
        },

        // Camera methods
        capturePhoto: async (options: CameraOptions = {}) => {
          set({ isTakingPhoto: true, error: null });
          try {
            const photo = await takePhoto(options);

            set({
              lastPhotoCapture: photo,
              isTakingPhoto: false
            });

            return photo;
          } catch (error) {
            set({
              isTakingPhoto: false,
              // Don't set error for user cancellation - let the caller handle it
              error: (error instanceof CameraError && error.code === 'PHOTO_CAPTURE_CANCELED')
                ? null
                : error instanceof Error ? error.message : 'Failed to capture photo'
            });
            throw error;
          }
        },

        pickPhoto: async (options = {}) => {
          set({ isTakingPhoto: true, error: null });
          try {
            const photo = await pickPhotoFromLibrary(options);

            set({
              lastPhotoCapture: photo,
              isTakingPhoto: false
            });

            return photo;
          } catch (error) {
            set({
              isTakingPhoto: false,
              error: error instanceof Error ? error.message : 'Failed to pick photo'
            });
            throw error;
          }
        },

        validateCapturedPhoto: (photo: PhotoCaptureResult) => {
          return validatePhoto(photo);
        },

        compressCapturedPhoto: async (uri: string, targetSize = 100 * 1024) => {
          return await compressPhoto(uri, targetSize);
        },

        
        // Reset store
        reset: () => {
          set({
            currentStatus: 'CHECKED_OUT',
            isLoading: false,
            error: null,
            lastLocationUpdate: null,
            batteryLevel: null,
            isLocationTracking: false,
            isCheckingIn: false,
            isCheckingOut: false,
            checkInTime: undefined,
            checkOutTime: undefined,
            workHours: undefined,
            totalDistance: undefined,
            verificationStatus: 'PENDING',
            requiresVerification: false,
            requiresCheckOut: false,
            locationHistory: [],
            locationWatcher: null,
            offlineQueue: [],
            offlineQueueCount: 0,
            isOnline: true,
            cameraPermission: false,
            locationPermission: false,
            isTakingPhoto: false,
            lastPhotoCapture: null,
          });
        },
      }),
      {
        name: 'attendance-store',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Don't persist temporary states
          isLoading: false,
          isCheckingIn: false,
          isCheckingOut: false,
          error: null,
        }),
      }
    ),
    {
      name: 'attendance-store',
    }
  )
);

// Export hooks for easier usage
export const useAttendanceStore = () => useAttendance();

// Helper hooks
export const useCurrentStatus = () => useAttendance((state) => state.currentStatus);
export const useAttendanceLoading = () => useAttendance((state) => state.isLoading || state.isCheckingIn || state.isCheckingOut);
export const useAttendanceError = () => useAttendance((state) => state.error);
export const useIsCheckedIn = () => useAttendance((state) => state.currentStatus === 'CHECKED_IN');
export const useLocationTracking = () => useAttendance((state) => state.isLocationTracking);
export const useOfflineQueueCount = () => useAttendance((state) => state.offlineQueueCount);

export default useAttendance;