import {
    AttendanceListParams,
    AttendanceListResponse,
    DailyAttendanceRecord,
    VerificationStatus,
} from '@pgn/shared';
import { act, renderHook } from '@testing-library/react';
import { useAttendanceStore } from '../attendanceStore';
import { useAuthStore } from '../authStore';
import { useUIStore } from '../uiStore';

// Mock the global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the authStore
jest.mock('../authStore');

// Mock the uiStore
jest.mock('../uiStore');

// Setup mock implementations
const mockShowNotification = jest.fn();

// Apply mocks directly to the stores
const mockAuthStoreGetState = jest.fn(() => ({
  token: null, // For web admin users, token is null
}));
const mockUIStoreGetState = jest.fn(() => ({
  showNotification: mockShowNotification,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(useAuthStore as jest.MockedFunction<typeof useAuthStore>).getState = mockAuthStoreGetState as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(useUIStore as jest.MockedFunction<typeof useUIStore>).getState = mockUIStoreGetState as any;

// Helper to create a mock response
const createMockResponse = (
  data: unknown,
  ok = true,
  status = 200
): Response => {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '/api/attendance',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response;
};

// Sample test data
const mockAttendanceRecords: DailyAttendanceRecord[] = [
  {
    id: '1',
    employeeId: 'emp1',
    humanReadableEmployeeId: 'EMP001',
    employeeName: 'John Doe',
    date: '2024-01-15',
    checkInTime: new Date('2024-01-15T09:00:00Z'),
    checkOutTime: new Date('2024-01-15T17:00:00Z'),
    checkInSelfieUrl: 'https://example.com/checkin1.jpg',
    checkOutSelfieUrl: 'https://example.com/checkout1.jpg',
    checkInLocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      timestamp: new Date('2024-01-15T09:00:00Z'),
    },
    checkOutLocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      timestamp: new Date('2024-01-15T17:00:00Z'),
    },
    locationPath: [],
    status: 'CHECKED_OUT',
    verificationStatus: 'PENDING',
    workHours: 8,
    notes: undefined,
    device: 'iPhone 12',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T17:00:00Z'),
  },
  {
    id: '2',
    employeeId: 'emp2',
    humanReadableEmployeeId: 'EMP002',
    employeeName: 'Jane Smith',
    date: '2024-01-15',
    checkInTime: new Date('2024-01-15T08:30:00Z'),
    checkOutTime: undefined,
    checkInSelfieUrl: 'https://example.com/checkin2.jpg',
    checkOutSelfieUrl: undefined,
    checkInLocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 10,
      timestamp: new Date('2024-01-15T08:30:00Z'),
    },
    checkOutLocation: undefined,
    locationPath: [],
    status: 'CHECKED_IN',
    verificationStatus: 'VERIFIED',
    workHours: undefined,
    notes: 'Verified by admin',
    device: 'Samsung Galaxy S21',
    createdAt: new Date('2024-01-15T08:30:00Z'),
    updatedAt: new Date('2024-01-15T08:30:00Z'),
  },
];

const mockAttendanceListResponse: AttendanceListResponse = {
  records: mockAttendanceRecords,
  page: 1,
  limit: 20,
  total: 2,
  totalPages: 1,
  hasMore: false,
};

describe('Attendance Store', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockFetch.mockReset();
    // Clear notification mock
    mockShowNotification.mockClear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAttendanceStore());

      expect(result.current.attendanceRecords).toEqual([]);
      expect(result.current.selectedAttendance).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.updateError).toBeNull();
      expect(result.current.filter).toEqual({});
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('fetchAttendanceRecords', () => {
    it('should fetch attendance records successfully with default parameters', async () => {
      const mockResponse = createMockResponse({
        success: true,
        data: mockAttendanceListResponse,
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/attendance?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-client-info': 'pgn-web-client',
            'User-Agent': 'pgn-admin-dashboard/1.0.0',
          }),
        })
      );
      expect(result.current.attendanceRecords).toEqual(mockAttendanceRecords);
      expect(result.current.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalItems: 2,
        itemsPerPage: 20,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch attendance records with custom parameters', async () => {
      const customParams: Partial<AttendanceListParams> = {
        page: 2,
        limit: 10,
        date: '2024-01-15',
        status: 'CHECKED_IN',
        verificationStatus: 'PENDING',
        employeeId: 'emp1',
        sortBy: 'check_in_timestamp',
        sortOrder: 'asc',
      };

      const mockResponse = createMockResponse({
        success: true,
        data: {
          ...mockAttendanceListResponse,
          page: 2,
          limit: 10,
        },
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());

      await act(async () => {
        await result.current.fetchAttendanceRecords(customParams);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/attendance?'),
        expect.any(Object)
      );
      expect(result.current.pagination.currentPage).toBe(2);
      expect(result.current.pagination.itemsPerPage).toBe(10);
    });

    it('should handle fetch attendance records error', async () => {
      const mockErrorResponse = createMockResponse(
        { error: 'Failed to fetch attendance records' },
        false,
        500
      );

      mockFetch.mockResolvedValue(mockErrorResponse);

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.attendanceRecords).toEqual([]);
      expect(showNotificationMock).toHaveBeenCalledWith(
        'An error occurred. Please try again or contact support if the problem persists.',
        'error'
      );
    });

    it('should handle permission error', async () => {
      const mockErrorResponse = createMockResponse(
        { error: 'You do not have permission to view attendance records' },
        false,
        403
      );

      mockFetch.mockResolvedValue(mockErrorResponse);

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(showNotificationMock).toHaveBeenCalledWith(
        'You do not have permission to view attendance records. Please contact your administrator.',
        'error'
      );
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(result.current.error).toBeTruthy();
      expect(showNotificationMock).toHaveBeenCalledWith(
        'Network connection failed. Please check your internet connection and try again.',
        'error'
      );
    });
  });

  describe('updateAttendanceVerification', () => {
    it('should update verification status successfully', async () => {
      const recordId = '1';
      const status: VerificationStatus = 'VERIFIED';
      const notes = 'Verified by admin';

      const updatedRecord = {
        ...mockAttendanceRecords[0],
        verificationStatus: status,
        notes,
      };

      const mockResponse = createMockResponse({
        success: true,
        data: updatedRecord,
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      // Set up initial records in the store
      act(() => {
        result.current.attendanceRecords = mockAttendanceRecords;
        result.current.selectedAttendance = mockAttendanceRecords[0];
      });

      await act(async () => {
        await result.current.updateAttendanceVerification(
          recordId,
          status,
          notes
        );
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/attendance/${recordId}/verify`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            verificationStatus: status,
            verificationNotes: notes,
          }),
        })
      );
      expect(result.current.attendanceRecords[0]).toEqual(updatedRecord);
      expect(result.current.selectedAttendance).toEqual(updatedRecord);
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.updateError).toBeNull();
      expect(showNotificationMock).toHaveBeenCalledWith(
        'Verification status updated successfully',
        'success'
      );
    });

    it('should handle update verification error', async () => {
      const recordId = '999';
      const status: VerificationStatus = 'REJECTED';
      const notes = 'Invalid attendance';

      const mockErrorResponse = createMockResponse(
        { error: 'Attendance record not found' },
        false,
        404
      );

      mockFetch.mockResolvedValue(mockErrorResponse);

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      await act(async () => {
        try {
          await result.current.updateAttendanceVerification(
            recordId,
            status,
            notes
          );
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.updateError).toBeTruthy();
      expect(result.current.isUpdating).toBe(false);
      expect(showNotificationMock).toHaveBeenCalledWith(
        'Attendance record not found in the system.',
        'error'
      );
    });

    it('should handle network error during verification update', async () => {
      const recordId = '1';
      const status: VerificationStatus = 'VERIFIED';

      mockFetch.mockRejectedValue(new Error('timeout'));

      const { result } = renderHook(() => useAttendanceStore());
      const showNotificationMock = useUIStore.getState()
        .showNotification as jest.Mock;

      await act(async () => {
        try {
          await result.current.updateAttendanceVerification(recordId, status);
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.updateError).toBeTruthy();
      expect(showNotificationMock).toHaveBeenCalledWith(
        'Request timed out. Please try again.',
        'error'
      );
    });
  });

  describe('setSelectedAttendance', () => {
    it('should set selected attendance', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.setSelectedAttendance(mockAttendanceRecords[0]);
      });

      expect(result.current.selectedAttendance).toEqual(
        mockAttendanceRecords[0]
      );
    });

    it('should clear selected attendance', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set an attendance record
      act(() => {
        result.current.setSelectedAttendance(mockAttendanceRecords[0]);
      });

      expect(result.current.selectedAttendance).toEqual(
        mockAttendanceRecords[0]
      );

      // Then clear it
      act(() => {
        result.current.setSelectedAttendance(null);
      });

      expect(result.current.selectedAttendance).toBeNull();
    });
  });

  describe('setFilters', () => {
    it('should set filters', () => {
      const { result } = renderHook(() => useAttendanceStore());

      const newFilters = {
        date: '2024-01-15',
        status: 'CHECKED_IN',
        verificationStatus: 'PENDING' as VerificationStatus,
        employeeId: 'emp1',
        sortBy: 'check_in_timestamp',
        sortOrder: 'asc' as const,
      };

      act(() => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filter).toEqual(newFilters);
    });

    it('should merge filters with existing ones', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set some filters
      act(() => {
        result.current.setFilters({
          date: '2024-01-15',
          status: 'CHECKED_IN',
        });
      });

      expect(result.current.filter).toMatchObject({
        date: '2024-01-15',
        status: 'CHECKED_IN',
      });

      // Then add more filters
      act(() => {
        result.current.setFilters({
          verificationStatus: 'PENDING' as VerificationStatus,
          employeeId: 'emp1',
        });
      });

      expect(result.current.filter).toMatchObject({
        date: '2024-01-15',
        status: 'CHECKED_IN',
        verificationStatus: 'PENDING',
        employeeId: 'emp1',
      });
    });
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set some filters
      act(() => {
        result.current.setFilters({
          date: '2024-01-15',
          status: 'CHECKED_IN',
          verificationStatus: 'PENDING' as VerificationStatus,
        });
      });

      expect(result.current.filter).toMatchObject({
        date: '2024-01-15',
        status: 'CHECKED_IN',
        verificationStatus: 'PENDING',
      });

      // Then clear them
      act(() => {
        result.current.clearFilters();
      });

      // Filter should be empty except for any default values applied by the store
      expect(result.current.filter).toEqual({});
    });
  });

  describe('setPagination', () => {
    it('should set pagination page', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.setPagination(2);
      });

      expect(result.current.pagination.currentPage).toBe(2);
      expect(result.current.pagination.itemsPerPage).toBe(10); // Current value
    });

    it('should set pagination page and items per page', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.setPagination(3, 50);
      });

      expect(result.current.pagination.currentPage).toBe(3);
      expect(result.current.pagination.itemsPerPage).toBe(50);
    });
  });

  describe('Error Clearing Methods', () => {
    it('should clear general error', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set an error
      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear update error', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set an update error
      act(() => {
        result.current.setError('Update error');
      });

      // Then clear it
      act(() => {
        result.current.clearUpdateError();
      });

      expect(result.current.updateError).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useAttendanceStore());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');
    });

    it('should clear error when null is passed', () => {
      const { result } = renderHook(() => useAttendanceStore());

      // First set an error
      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');

      // Then clear it
      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty attendance list response', async () => {
      const mockResponse = createMockResponse({
        success: true,
        data: {
          records: [],
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(result.current.attendanceRecords).toEqual([]);
      expect(result.current.pagination.totalItems).toBe(0);
    });

    it('should handle malformed API response', async () => {
      const mockResponse = createMockResponse(null);

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      // The error should be set when response is malformed
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle authentication token in headers', async () => {
      // Mock authStore with a token
      // Mock authStore with a token
      (useAuthStore.getState as jest.Mock).mockReturnValue({
        token: 'mock-jwt-token',
      });

      const mockResponse = createMockResponse({
        success: true,
        data: mockAttendanceListResponse,
      });

      mockFetch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAttendanceStore());

      await act(async () => {
        await result.current.fetchAttendanceRecords();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/attendance?'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-client-info': 'pgn-web-client',
            'User-Agent': 'pgn-admin-dashboard/1.0.0',
            Authorization: 'Bearer mock-jwt-token',
          }),
        })
      );
    });
  });
});
