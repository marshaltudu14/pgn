import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashMode } from 'expo-camera';
import { useAuth } from './auth-store';
import {
  AttendanceResponse,
  LocationData,
  AttendanceStatus,
  AttendanceStatusResponse,
  CheckInMobileRequest,
  CheckOutMobileRequest,
  DailyAttendanceRecord,
  AttendanceListParams,
  AttendanceListResponse
} from '@pgn/shared';
import { api } from '@/services/api-client';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { locationTrackingServiceNotifee } from '@/services/location-foreground-service-notifee';
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
  getCurrentLocation
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

  // Attendance history state
  attendanceHistory: DailyAttendanceRecord[];
  isHistoryLoading: boolean;
  historyError: string | null;
  currentPage: number;
  totalPages: number;
  hasMoreHistory: boolean;
  isRefreshingHistory: boolean;

  // Location tracking state (updated for native service)
  locationHistory: LocationData[];

  // Native service state
  serviceStatus: any; // ServiceStatus from native service
  pendingDataCount: any; // PendingDataCount from native service
  isServiceAvailable: boolean;

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

  // Attendance history actions
  fetchAttendanceHistory: (params?: AttendanceListParams) => Promise<void>;
  loadMoreAttendanceHistory: () => Promise<void>;
  refreshAttendanceHistory: () => Promise<void>;
  clearAttendanceHistory: () => void;

  // Location tracking (native service)
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => Promise<void>;
  updateLocation: (location: LocationData) => void;

  // Native service methods
  initializeLocationService: () => Promise<void>;
  syncPendingData: () => Promise<void>;
  clearEmployeeLocationData: (employeeId: string) => Promise<void>;
  checkServiceStatus: () => Promise<void>;

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

        // Attendance history initial state
        attendanceHistory: [],
        isHistoryLoading: false,
        historyError: null,
        currentPage: 1,
        totalPages: 1,
        hasMoreHistory: true,
        isRefreshingHistory: false,

        locationHistory: [],

        // Native service state
        serviceStatus: null,
        pendingDataCount: null,
        isServiceAvailable: false,

        offlineQueue: [],
        offlineQueueCount: 0,
        isOnline: true,
        cameraPermission: false,
        locationPermission: false,
        isTakingPhoto: false,
        lastPhotoCapture: null,

        // Initialize permissions and check service status
        initializePermissions: async () => {
          try {
            // Check permissions
            const cameraAvailable = await isCameraAvailable();
            const locationAvailable = await isLocationAvailable();

            set({
              cameraPermission: cameraAvailable,
              locationPermission: locationAvailable,
            });

            // Initialize location service and check if tracking is already active
            await get().initializeLocationService();

            // Check if service is already running (persisted across restarts)
            const isTracking = locationTrackingServiceNotifee.isTrackingActive();
            if (isTracking) {
                set({
                currentStatus: 'CHECKED_IN',
                isLocationTracking: true,
                lastLocationUpdate: new Date(),
                checkInTime: new Date(),
                requiresCheckOut: true,
              });
            }

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
            const authStore = useAuth.getState();
            const employeeId = authStore.user?.humanReadableId;

            if (!employeeId) {
              throw new Error('Employee ID not available');
            }

            // Call attendance status API
            const response = await fetch(`${API_BASE_URL}/attendance/status/${employeeId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${employeeId}`, // Using employeeId as token for now
              },
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `Failed to fetch attendance status (${response.status})`;

              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }

              set({
                isLoading: false,
                error: errorMessage,
              });

              return;
            }

            const apiData = await response.json();

            // Convert API response to store format
            set({
              currentStatus: apiData.status || 'CHECKED_OUT',
              isLoading: false,
              error: null,
              checkInTime: apiData.checkInTime ? new Date(apiData.checkInTime) : undefined,
              checkOutTime: apiData.checkOutTime ? new Date(apiData.checkOutTime) : undefined,
              workHours: apiData.workHours,
              totalDistance: apiData.totalDistance,
              lastLocationUpdate: apiData.lastLocationUpdate ? new Date(apiData.lastLocationUpdate) : undefined,
              batteryLevel: apiData.batteryLevel,
              verificationStatus: apiData.verificationStatus || 'PENDING',
              requiresCheckOut: apiData.requiresCheckOut || false,
            });

            // Note: Don't automatically start location tracking on status fetch
            // Let the user explicitly check in to start tracking

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
              } catch (locationError) {
                console.error('Failed to get location:', locationError);
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
              deviceInfo
            };

            // Make API call
            const response = await api.post<any>('/attendance/checkin', apiRequest);

            if (!response.success) {
              throw new Error(response.error || 'Failed to check in');
            }

            const responseData = response.data;

            if (!responseData) {
              throw new Error('Invalid check-in response');
            }

            const result: AttendanceResponse = {
              success: response.success,
              message: response.message || 'Check-in successful',
              timestamp: new Date(responseData.timestamp),
              checkInTime: new Date(responseData.checkInTime),
              verificationStatus: responseData.verificationStatus,
              attendanceId: responseData.attendanceId
            };

            if (result.success) {
              set({
                currentStatus: 'CHECKED_IN',
                isCheckingIn: false,
                checkInTime: result.checkInTime,
                error: null,
                verificationStatus: result.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED',
                requiresVerification: result.verificationStatus === 'PENDING'
              });

              // Start location tracking using Notifee
                const authStore = useAuth.getState();
              const employeeId = authStore.user?.humanReadableId;
              const employeeName = authStore.user?.firstName;

              if (employeeId && employeeName) {
                try {
                  const success = await locationTrackingServiceNotifee.startTracking(employeeId, employeeName);
                  if (success) {
                    set({
                      isLocationTracking: true,
                      lastLocationUpdate: new Date(),
                    });
                    }
                } catch (trackingError) {
                  console.warn('[AttendanceStore] Failed to start location tracking:', trackingError);
                  // Don't fail check-in if tracking fails
                }
              }
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
            const apiRequest: CheckOutMobileRequest = {
              employeeId: request.employeeId,
              location: {
                latitude: request.location.latitude,
                longitude: request.location.longitude,
                accuracy: request.location.accuracy || 0,
                timestamp: request.location.timestamp || Date.now(),
                address: request.location.address || undefined,
              },
              selfieImage: request.selfieImage,
              confidenceScore: request.confidenceScore,
              deviceInfo: deviceInfo,
              checkoutNotes: request.checkoutNotes,
            };

            // Call check-out API
            const response = await fetch(`${API_BASE_URL}/attendance/checkout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${request.employeeId}`, // Using employeeId as token for now
              },
              body: JSON.stringify(apiRequest),
            });

            if (!response.ok) {
              const errorText = await response.text();
              let errorMessage = `Check-out failed (${response.status})`;

              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
              } catch {
                errorMessage = errorText || errorMessage;
              }

              set({
                isCheckingOut: false,
                error: errorMessage,
              });

              return {
                success: false,
                message: errorMessage
              };
            }

            const apiResponse: AttendanceResponse = await response.json();
            const checkOutTime = new Date(apiResponse.timestamp);

            // Convert API response to store format
            const result: AttendanceResponse = {
              success: apiResponse.success,
              message: apiResponse.message,
              timestamp: checkOutTime,
              checkOutTime: checkOutTime,
              workHours: apiResponse.workHours,
              verificationStatus: apiResponse.verificationStatus,
              attendanceId: apiResponse.attendanceId
            };

            if (result.success) {
              set({
                currentStatus: 'CHECKED_OUT',
                isCheckingOut: false,
                checkOutTime: result.checkOutTime,
                workHours: result.workHours,
                error: null,
                verificationStatus: result.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED',
                requiresVerification: result.verificationStatus === 'PENDING'
              });

              // Stop location tracking using Notifee
              try {
                const checkOutData = JSON.stringify({
                  checkOutTime: checkOutTime.toISOString(),
                  deviceInfo: deviceInfo,
                });
                const success = await locationTrackingServiceNotifee.stopTracking(checkOutData);
                if (success) {
                  set({
                    isLocationTracking: false,
                    lastLocationUpdate: null,
                  });
                }
              } catch (trackingError) {
                // Don't fail check-out if tracking fails
              }
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
            const response = await api.post<any>('/attendance/checkout', emergencyRequest);

            if (!response.success) {
              throw new Error(response.error || 'Failed to check out');
            }

            const responseData = response.data;
            if (!responseData) {
              throw new Error('Invalid check-out response');
            }

            const result: AttendanceResponse = {
              success: response.success,
              message: response.message || 'Check-out successful',
              timestamp: new Date(responseData.timestamp),
              checkOutTime: new Date(responseData.checkOutTime),
              workHours: responseData.workHours,
              verificationStatus: responseData.verificationStatus,
              attendanceId: responseData.attendanceId
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

        // Fetch attendance history
        fetchAttendanceHistory: async (params: AttendanceListParams = {}) => {
          set({ isHistoryLoading: true, historyError: null });

          try {
            // Default parameters
            const requestParams: AttendanceListParams = {
              page: 1,
              limit: 20,
              sortBy: 'attendance_date',
              sortOrder: 'desc',
              ...params
            };

            // Build query string
            const queryString = new URLSearchParams(
              Object.entries(requestParams).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = value.toString();
                }
                return acc;
              }, {} as Record<string, string>)
            ).toString();

            const url = queryString ? `/attendance?${queryString}` : '/attendance';
            const response = await api.get<{ records: DailyAttendanceRecord[], page: number, limit: number, total: number, totalPages: number, hasMore: boolean }>(url);

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Failed to fetch attendance history');
            }

            // The actual data is in response.data (no more double wrapping)
            const data = response.data;
            if (!data || !data.records) {
              throw new Error('Invalid attendance history response structure');
            }
            const attendanceRecords: DailyAttendanceRecord[] = data.records.map((record: any) => ({
              id: record.id,
              employeeId: record.employeeId,
              humanReadableEmployeeId: record.humanReadableEmployeeId,
              employeeName: record.employeeName,
              date: record.date,
              checkInTime: record.checkInTime,
              checkOutTime: record.checkOutTime,
              checkInLocation: record.checkInLocation,
              checkOutLocation: record.checkOutLocation,
              locationPath: record.locationPath || [],
              status: record.status,
              verificationStatus: record.verificationStatus,
              workHours: record.workHours,
              notes: record.notes,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            }));

            set({
              attendanceHistory: attendanceRecords,
              isHistoryLoading: false,
              historyError: null,
              currentPage: data.page,
              totalPages: data.totalPages,
              hasMoreHistory: data.hasMore && attendanceRecords.length >= 20,
            });

          } catch (error) {
            console.error('Failed to fetch attendance history:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance history';

            set({
              isHistoryLoading: false,
              historyError: errorMessage,
            });
          }
        },

        // Load more attendance history (infinite scroll)
        loadMoreAttendanceHistory: async () => {
          const { isHistoryLoading, hasMoreHistory, currentPage } = get();

          if (isHistoryLoading || !hasMoreHistory) {
            return;
          }

          set({ isHistoryLoading: true, historyError: null });

          try {
            const nextPage = currentPage + 1;
            const requestParams: AttendanceListParams = {
              page: nextPage,
              limit: 20,
              sortBy: 'attendance_date',
              sortOrder: 'desc',
            };

            // Build query string
            const queryString = new URLSearchParams(
              Object.entries(requestParams).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = value.toString();
                }
                return acc;
              }, {} as Record<string, string>)
            ).toString();

            const url = queryString ? `/attendance?${queryString}` : '/attendance';
            const response = await api.get<{ records: DailyAttendanceRecord[], page: number, limit: number, total: number, totalPages: number, hasMore: boolean }>(url);

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Failed to load more attendance history');
            }

            // The actual data is in response.data (no more double wrapping)
            const data = response.data;
            if (!data || !data.records) {
              throw new Error('Invalid attendance history response structure');
            }
            const newRecords: DailyAttendanceRecord[] = data.records.map((record: any) => ({
              id: record.id,
              employeeId: record.employee_id,
              date: record.attendance_date,
              checkInTime: record.check_in_timestamp ? new Date(record.check_in_timestamp) : undefined,
              checkOutTime: record.check_out_timestamp ? new Date(record.check_out_timestamp) : undefined,
              checkInLocation: record.check_in_latitude && record.check_in_longitude ? {
                latitude: record.check_in_latitude,
                longitude: record.check_in_longitude,
                accuracy: record.check_in_accuracy || undefined,
                timestamp: record.check_in_timestamp ? new Date(record.check_in_timestamp) : new Date(),
                address: record.check_in_address || undefined
              } : undefined,
              checkOutLocation: record.check_out_latitude && record.check_out_longitude ? {
                latitude: record.check_out_latitude,
                longitude: record.check_out_longitude,
                accuracy: record.check_out_accuracy || undefined,
                timestamp: record.check_out_timestamp ? new Date(record.check_out_timestamp) : new Date(),
                address: record.check_out_address || undefined
              } : undefined,
              checkInSelfieUrl: record.check_in_selfie_url,
              checkOutSelfieUrl: record.check_out_selfie_url,
              checkOutMethod: record.check_out_method as any,
              checkOutReason: record.check_out_reason,
              workHours: record.total_work_hours ? parseFloat(record.total_work_hours) : undefined,
              totalDistance: record.total_distance_meters || undefined,
              locationPath: record.path_data || [],
              lastLocationUpdate: record.last_location_update ? new Date(record.last_location_update) : undefined,
              batteryLevelAtCheckIn: record.battery_level_at_check_in,
              batteryLevelAtCheckOut: record.battery_level_at_check_out,
              verificationStatus: record.verification_status as any,
              verifiedBy: record.verified_by,
              verifiedAt: record.verified_at ? new Date(record.verified_at) : undefined,
              verificationNotes: record.verification_notes,
              status: record.status as any,
              createdAt: record.created_at ? new Date(record.created_at) : new Date(),
              updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(),
            }));

            set(state => ({
              attendanceHistory: [...state.attendanceHistory, ...newRecords],
              isHistoryLoading: false,
              historyError: null,
              currentPage: nextPage,
              totalPages: data.totalPages,
              hasMoreHistory: nextPage < data.totalPages && newRecords.length >= 20,
            }));

          } catch (error) {
            console.error('Failed to load more attendance history:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load more attendance history';

            set({
              isHistoryLoading: false,
              historyError: errorMessage,
            });
          }
        },

        // Refresh attendance history
        refreshAttendanceHistory: async () => {
          set({ isRefreshingHistory: true, historyError: null });

          try {
            const requestParams: AttendanceListParams = {
              page: 1,
              limit: 20,
              sortBy: 'attendance_date',
              sortOrder: 'desc',
            };

            // Build query string
            const queryString = new URLSearchParams(
              Object.entries(requestParams).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = value.toString();
                }
                return acc;
              }, {} as Record<string, string>)
            ).toString();

            const url = queryString ? `/attendance?${queryString}` : '/attendance';
            const response = await api.get<{ records: DailyAttendanceRecord[], page: number, limit: number, total: number, totalPages: number, hasMore: boolean }>(url);

            if (!response.success || !response.data) {
              throw new Error(response.error || 'Failed to refresh attendance history');
            }

            // The actual data is in response.data (no more double wrapping)
            const data = response.data;
            if (!data || !data.records) {
              throw new Error('Invalid attendance history response structure');
            }
            const attendanceRecords: DailyAttendanceRecord[] = data.records.map((record: any) => ({
              id: record.id,
              employeeId: record.employeeId,
              humanReadableEmployeeId: record.humanReadableEmployeeId,
              employeeName: record.employeeName,
              date: record.date,
              checkInTime: record.checkInTime,
              checkOutTime: record.checkOutTime,
              checkInLocation: record.checkInLocation,
              checkOutLocation: record.checkOutLocation,
              locationPath: record.locationPath || [],
              status: record.status,
              verificationStatus: record.verificationStatus,
              workHours: record.workHours,
              notes: record.notes,
              createdAt: record.createdAt,
              updatedAt: record.updatedAt,
            }));

            set({
              attendanceHistory: attendanceRecords,
              isRefreshingHistory: false,
              historyError: null,
              currentPage: data.page,
              totalPages: data.totalPages,
              hasMoreHistory: data.hasMore && attendanceRecords.length >= 20,
            });

          } catch (error) {
            console.error('Failed to refresh attendance history:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh attendance history';

            set({
              isRefreshingHistory: false,
              historyError: errorMessage,
            });
          }
        },

        // Clear attendance history
        clearAttendanceHistory: () => {
          set({
            attendanceHistory: [],
            isHistoryLoading: false,
            historyError: null,
            currentPage: 1,
            totalPages: 1,
            hasMoreHistory: true,
            isRefreshingHistory: false,
          });
        },

        // Initialize native location service
        initializeLocationService: async () => {
          try {
                const isAvailable = await locationTrackingServiceNotifee.initialize();

  
            set({
              isServiceAvailable: isAvailable,
              error: isAvailable ? null : 'Location service not available',
            });

            if (isAvailable) {
              await get().checkServiceStatus();
            }
          } catch (error) {
            console.error('[AttendanceStore] Failed to initialize location service:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to initialize location service',
            });
          }
        },

        // Check service status
        checkServiceStatus: async () => {
          try {
            if (!get().isServiceAvailable) {
              return;
            }

            const isTracking = locationTrackingServiceNotifee.isTrackingActive();
            const state = locationTrackingServiceNotifee.getState();

            set({
              serviceStatus: isTracking ? 'tracking' : 'idle',
              pendingDataCount: 0, // Notifee doesn't queue data
              isLocationTracking: isTracking,
              lastLocationUpdate: state.isTracking ? new Date() : null,
            });

              } catch (error) {
            console.error('[AttendanceStore] Failed to check service status:', error);
          }
        },

        // Start background location tracking (now integrated into checkIn)
        startLocationTracking: async () => {
            // This method is kept for compatibility but tracking is now handled in checkIn
        },

        // Stop background location tracking (using native service)
        stopLocationTracking: async () => {
          try {
            if (!get().isLocationTracking) {
                return; // Not tracking
            }

            if (!get().isServiceAvailable) {
                set({
                isLocationTracking: false,
                lastLocationUpdate: null,
              });
              return;
            }

    
            const checkOutData = JSON.stringify({
              checkOutTime: new Date().toISOString(),
              deviceInfo: await get().getDeviceInfo(),
            });

            const success = await locationTrackingServiceNotifee.stopTracking(checkOutData);

            set({
              isLocationTracking: false,
              lastLocationUpdate: null,
              error: success ? null : 'Failed to stop location tracking cleanly',
            });

            // Update service status
            await get().checkServiceStatus();

              } catch (error) {
            console.error('[AttendanceStore] Failed to stop location tracking:', error);
          }
        },

        // Update location in store (modified for native service - no 50m filter)
        updateLocation: (location: LocationData) => {
          const { locationHistory } = get();
          const lastLocation = locationHistory[locationHistory.length - 1];

          // Add every location (no movement threshold filter)
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
        },

        // Sync pending data to server
        syncPendingData: async () => {
          try {
            if (!get().isServiceAvailable) {
                  return;
            }

      
            // Notifee doesn't have sync functionality - data is sent directly
            const syncResult = { synced: 0, failed: 0 };

      
            if (syncResult.synced > 0) {
              set({
                error: null, // Clear any previous errors
              });
            }

            // Update pending data count after sync
            await get().checkServiceStatus();

          } catch (error) {
            console.error('[AttendanceStore] Failed to sync pending data:', error);
            set({
              error: error instanceof Error ? error.message : 'Failed to sync pending data',
            });
          }
        },

        // Clear employee location data (for new check-in)
        clearEmployeeLocationData: async (employeeId: string) => {
          try {
      
            if (get().isServiceAvailable) {
              // Notifee doesn't need data clearing handled this way
            }

            // Clear local location history
            set({
              locationHistory: [],
            });

                } catch (error) {
            console.error('[AttendanceStore] Failed to clear employee data:', error);
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

            // Get device info
            const deviceInfo = await import('react-native-device-info');
            const deviceModel = deviceInfo.default.getModel();
            const deviceBrand = deviceInfo.default.getBrand();
            const deviceSystemVersion = deviceInfo.default.getSystemVersion();

            return {
              batteryLevel: batteryLevel > 0 ? Math.round(batteryLevel * 100) : undefined,
              platform: 'mobile',
              version: '1.0.0',
              model: `${deviceBrand} ${deviceModel}` || 'Unknown Device'
            };
          } catch (error) {
            const state = get();
            console.warn('[ATTENDANCE STORE] Could not get device info:', error);
            return {
              batteryLevel: state.batteryLevel || undefined,
              platform: 'mobile',
              version: '1.0.0',
              model: 'Unknown Device'
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

            // Reset attendance history
            attendanceHistory: [],
            isHistoryLoading: false,
            historyError: null,
            currentPage: 1,
            totalPages: 1,
            hasMoreHistory: true,
            isRefreshingHistory: false,

            locationHistory: [],
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