import { create } from 'zustand';
import {
  DailyAttendanceRecord,
  VerificationStatus,
  AttendanceListParams,
  AttendanceListResponse,
  UpdateVerificationRequest
} from '@pgn/shared';
import { useUIStore } from './uiStore';
import { useAuthStore } from './authStore';

/**
 * Transform technical error messages into user-friendly ones
 */
function getUserFriendlyErrorMessage(error: string): string {
  // Clean up the error message first
  const cleanError = error.replace(/AuthApiError:\s*/, '').replace(/DatabaseError:\s*/, '').trim();

  // Handle common errors
  if (cleanError.includes('You do not have permission to view attendance records') ||
      error.includes('You do not have permission to view attendance records')) {
    return 'You do not have permission to view attendance records. Please contact your administrator.';
  }

  if (cleanError.includes('Attendance record not found')) {
    return 'Attendance record not found in the system.';
  }

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to access this attendance record. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'An attendance record for this date already exists.';
  }

  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Generic fallback
  return 'An error occurred. Please try again or contact support if the problem persists.';
}

interface AttendanceFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  verificationStatus?: VerificationStatus;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AttendanceState {
  attendanceRecords: DailyAttendanceRecord[];
  selectedAttendance: DailyAttendanceRecord | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  updateError: string | null;
  filter: AttendanceFilters;
  signedImageUrls: { [key: string]: string }; // Cache for signed URLs
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  fetchAttendanceRecords: (params?: Partial<AttendanceListParams>) => Promise<void>;
  updateAttendanceVerification: (recordId: string, status: VerificationStatus, notes?: string) => Promise<void>;
  getSignedImageUrl: (imagePath: string) => Promise<string>;
  getSignedImageUrls: (imagePaths: string[]) => Promise<{ [key: string]: string }>;
  setSelectedAttendance: (attendance: DailyAttendanceRecord | null) => void;
  setFilters: (filters: Partial<AttendanceFilters>) => void;
  setPagination: (page: number, itemsPerPage?: number) => void;
  clearFilters: () => void;
  clearError: () => void;
  clearUpdateError: () => void;
  setError: (error: string | null) => void;
}

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;

  // For web requests, identify the client for security middleware
  // Web users are authenticated via Supabase sessions handled by middleware
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'pgn-web-client',
    'User-Agent': 'pgn-admin-dashboard/1.0.0',
  };

  // Add Authorization header only if we have a token (for mobile users)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendanceRecords: [],
  selectedAttendance: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  updateError: null,
  filter: {},
  signedImageUrls: {},
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  },

  fetchAttendanceRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { filter, pagination } = get();
      const queryParams: AttendanceListParams = {
        page: params?.page || pagination.currentPage,
        limit: params?.limit || pagination.itemsPerPage,
        date: params?.date || filter.date || undefined,
        dateFrom: params?.dateFrom || filter.dateFrom || undefined,
        dateTo: params?.dateTo || filter.dateTo || undefined,
        status: params?.status || filter.status || undefined,
        verificationStatus: params?.verificationStatus || filter.verificationStatus || undefined,
        employeeId: params?.employeeId || filter.employeeId || undefined,
        sortBy: params?.sortBy || filter.sortBy || 'attendance_date',
        sortOrder: params?.sortOrder || filter.sortOrder || 'desc',
      };

      const queryString = new URLSearchParams();
      if (queryParams.page) queryString.set('page', queryParams.page.toString());
      if (queryParams.limit) queryString.set('limit', queryParams.limit.toString());
      if (queryParams.date) queryString.set('date', queryParams.date);
      if (queryParams.dateFrom) queryString.set('dateFrom', queryParams.dateFrom);
      if (queryParams.dateTo) queryString.set('dateTo', queryParams.dateTo);
      if (queryParams.status) queryString.set('status', queryParams.status);
      if (queryParams.verificationStatus) queryString.set('verificationStatus', queryParams.verificationStatus);
      if (queryParams.employeeId) queryString.set('employeeId', queryParams.employeeId);
      if (queryParams.sortBy) queryString.set('sortBy', queryParams.sortBy);
      if (queryParams.sortOrder) queryString.set('sortOrder', queryParams.sortOrder);

      const response = await fetch(`/api/attendance?${queryString}`, {
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch attendance records');
      }

      const data: AttendanceListResponse = result.data;
      const totalPages = Math.ceil(data.total / data.limit);

      set({
        attendanceRecords: data.records,
        pagination: {
          currentPage: data.page,
          totalPages,
          totalItems: data.total,
          itemsPerPage: data.limit,
          hasNextPage: data.hasMore,
          hasPreviousPage: data.page > 1,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to fetch attendance records';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error fetching attendance records:', error);
      set({
        isLoading: false,
        error: technicalMessage,
        attendanceRecords: [],
      });
      useUIStore.getState().showNotification(userFriendlyMessage, 'error');
    }
  },

  updateAttendanceVerification: async (recordId, status, notes) => {
    set({ isUpdating: true, updateError: null });
    try {
      const updateRequest: UpdateVerificationRequest = {
        verificationStatus: status,
        verificationNotes: notes,
      };

      const response = await fetch(`/api/attendance/${recordId}/verify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateRequest),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update verification status');
      }

      const updatedRecord = result.data;

      // Optimistically update the record in the list
      set((state) => ({
        attendanceRecords: state.attendanceRecords.map((record) =>
          record.id === recordId ? updatedRecord : record
        ),
        selectedAttendance: state.selectedAttendance?.id === recordId ? updatedRecord : state.selectedAttendance,
        isUpdating: false,
        updateError: null,
      }));

      useUIStore.getState().showNotification('Verification status updated successfully', 'success');
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : 'Failed to update verification status';
      const userFriendlyMessage = getUserFriendlyErrorMessage(technicalMessage);
      console.error('Error updating verification status:', error);

      set({
        isUpdating: false,
        updateError: technicalMessage,
      });

      useUIStore.getState().showNotification(userFriendlyMessage, 'error');
      throw error; // Re-throw so the calling component can handle it
    }
  },

  getSignedImageUrl: async (imagePath: string) => {
    if (!imagePath) {
      console.log('🔍 [DEBUG] No image path provided, returning empty string');
      return '';
    }

    const { signedImageUrls } = get();

    // Return cached URL if available
    if (signedImageUrls[imagePath]) {
      console.log('🔍 [DEBUG] Using cached signed URL for image path:', imagePath);
      return signedImageUrls[imagePath];
    }

    console.log('🔍 [DEBUG] Fetching new signed URL for image path:', imagePath);

    try {
      const response = await fetch(`/api/attendance/image?path=${encodeURIComponent(imagePath)}`, {
        headers: getAuthHeaders(),
      });

      console.log('🔍 [DEBUG] Signed URL API response status:', response.status);

      const result = await response.json();
      console.log('🔍 [DEBUG] Signed URL API response:', {
        success: !!result.signedUrl,
        hasError: !!result.error,
        error: result.error,
        urlLength: result.signedUrl?.length
      });

      if (!response.ok || !result.signedUrl) {
        console.error('❌ [ERROR] Failed to generate signed URL for image:', imagePath, 'Response:', result);
        return '';
      }

      // Cache the URL
      set((state) => ({
        signedImageUrls: {
          ...state.signedImageUrls,
          [imagePath]: result.signedUrl,
        },
      }));

      console.log('✅ [SUCCESS] Cached and returning signed URL for image path:', imagePath);
      return result.signedUrl;
    } catch (error) {
      console.error('❌ [ERROR] Error generating signed URL for path:', imagePath, 'Error:', error);
      return '';
    }
  },

  getSignedImageUrls: async (imagePaths: string[]) => {
    const { signedImageUrls } = get();
    const urls: { [key: string]: string } = { ...signedImageUrls };

    console.log('🔍 [DEBUG] Batch fetching signed URLs for image paths:', imagePaths);

    await Promise.all(
      imagePaths.map(async (imagePath) => {
        if (!imagePath) {
          console.log('🔍 [DEBUG] Skipping empty image path');
          return;
        }

        if (urls[imagePath]) {
          console.log('🔍 [DEBUG] Using cached URL for image path:', imagePath);
          return;
        }

        console.log('🔍 [DEBUG] Fetching signed URL for image path:', imagePath);

        try {
          const response = await fetch(`/api/attendance/image?path=${encodeURIComponent(imagePath)}`, {
            headers: getAuthHeaders(),
          });

          const result = await response.json();

          if (response.ok && result.signedUrl) {
            urls[imagePath] = result.signedUrl;
            console.log('✅ [SUCCESS] Got signed URL for image path:', imagePath, 'URL length:', result.signedUrl.length);
          } else {
            console.error('❌ [ERROR] Failed to get signed URL for image path:', imagePath, 'Response:', result);
          }
        } catch (error) {
          console.error(`❌ [ERROR] Failed to generate signed URL for ${imagePath}:`, error);
        }
      })
    );

    // Update cache
    set({ signedImageUrls: urls });
    console.log('🔍 [DEBUG] Updated signed URL cache with', Object.keys(urls).length, 'entries');
    return urls;
  },

  setSelectedAttendance: (attendance) => {
    set({ selectedAttendance: attendance });
  },

  setFilters: (filters) => {
    set((state) => ({
      filter: {
        ...state.filter,
        ...filters,
      },
    }));
  },

  setPagination: (page, itemsPerPage) => {
    set((state) => ({
      pagination: {
        ...state.pagination,
        currentPage: page,
        itemsPerPage: itemsPerPage || state.pagination.itemsPerPage,
      },
    }));
  },

  clearFilters: () => {
    set({
      filter: {},
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearUpdateError: () => {
    set({ updateError: null });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));