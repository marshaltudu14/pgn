/**
 * Unit tests for AttendanceService using Jest
 */

import { createClient } from '@/utils/supabase/server';
import {
  AttendanceListParams,
  AttendanceStatus,
  CheckInRequest,
  CheckOutMethod,
  CheckOutRequest,
  EmergencyCheckOutRequest,
  LocationUpdateRequest,
  UpdateVerificationRequest,
  VerificationStatus,
} from '@pgn/shared';
import { AttendanceService } from '../attendance.service';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn(),
  },
};

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  const employeeId = '123e4567-e89b-12d3-a456-426614174000';
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    attendanceService = new AttendanceService();
    jest.clearAllMocks();
  });

  describe('checkIn', () => {
    const mockCheckInRequest: CheckInRequest = {
      employeeId,
      timestamp: new Date(),
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: new Date(),
      },
      selfie:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      deviceInfo: {
        model: 'iPhone 13',
        batteryLevel: 0.85,
      },
    };

    const mockExistingAttendance = {
      id: 'attendance-id-123',
      employee_id: employeeId,
      attendance_date: today,
      check_in_timestamp: new Date(Date.now() - 3600000).toISOString(),
      check_out_timestamp: null,
      check_in_latitude: 40.7128,
      check_in_longitude: -74.006,
      check_in_selfie_url: 'https://example.com/checkin.jpg',
      verification_status: 'PENDING',
    };

    it('should successfully check in a new employee', async () => {
      // Mock no existing attendance
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock successful insert
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockExistingAttendance,
          id: 'new-attendance-id',
        },
        error: null,
      });

      // Mock storage upload
      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/new-checkin.jpg' },
        }),
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      mockSupabaseClient.storage.from = mockStorageFrom;

      const result = await attendanceService.checkIn(
        employeeId,
        mockCheckInRequest
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-in successful');
      expect(result.status).toBe('CHECKED_IN');
      expect(result.attendanceId).toBe('new-attendance-id');
      expect(result.verificationStatus).toBe('PENDING');
    });

    it('should successfully update existing attendance record', async () => {
      // Mock existing attendance
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockExistingAttendance,
        error: null,
      });

      // Mock successful update
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockExistingAttendance,
          check_in_timestamp: new Date().toISOString(),
        },
        error: null,
      });

      // Mock storage upload
      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/updated-checkin.jpg' },
        }),
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      mockSupabaseClient.storage.from = mockStorageFrom;

      const result = await attendanceService.checkIn(
        employeeId,
        mockCheckInRequest
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-in successful');
      expect(result.status).toBe('CHECKED_IN');
    });

    it('should handle database error when checking existing attendance', async () => {
      // Mock database error
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.checkIn(
        employeeId,
        mockCheckInRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to check existing attendance records'
      );
    });

    it('should handle error when creating new attendance record', async () => {
      // Mock no existing attendance
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock failed insert
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      // Mock storage upload
      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/checkin.jpg' },
        }),
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      mockSupabaseClient.storage.from = mockStorageFrom;

      const result = await attendanceService.checkIn(
        employeeId,
        mockCheckInRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create attendance record');
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await attendanceService.checkIn(
        employeeId,
        mockCheckInRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Check-in failed due to unexpected error');
    });
  });

  describe('checkOut', () => {
    const mockCheckOutRequest: CheckOutRequest = {
      employeeId,
      timestamp: new Date(),
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: new Date(),
      },
      selfie:
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      method: 'MANUAL' as CheckOutMethod,
      reason: 'End of shift',
      deviceInfo: {
        model: 'iPhone13',
        batteryLevel: 0.75,
      },
    };

    const mockAttendanceRecord = {
      id: 'attendance-id-123',
      employee_id: employeeId,
      attendance_date: today,
      check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
      check_out_timestamp: null,
      verification_status: 'PENDING',
    };

    it('should successfully check out an employee', async () => {
      // Mock attendance record
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: mockAttendanceRecord,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockAttendanceRecord,
            check_out_timestamp: mockCheckOutRequest.timestamp.toISOString(),
            total_work_hours: 8.0,
          },
          error: null,
        });

      // Mock storage upload
      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/checkout.jpg' },
        }),
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      mockSupabaseClient.storage.from = mockStorageFrom;

      const result = await attendanceService.checkOut(
        employeeId,
        mockCheckOutRequest
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Check-out successful');
      expect(result.status).toBe('CHECKED_OUT');
      expect(result.workHours).toBeCloseTo(8.0, 1);
    });

    it('should handle no check-in record found', async () => {
      // Mock no attendance record
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.checkOut(
        employeeId,
        mockCheckOutRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No check-in record found for today');
    });

    it('should handle already checked out employee', async () => {
      // Mock attendance record with checkout
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockAttendanceRecord,
          check_out_timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.checkOut(
        employeeId,
        mockCheckOutRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Employee already checked out today');
    });

    it('should handle update error', async () => {
      // Mock attendance record
      const mockSingle = jest
        .fn()
        .mockResolvedValueOnce({
          data: mockAttendanceRecord,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Update failed' },
        });

      // Mock storage upload
      const mockStorageFrom = jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/checkout.jpg' },
        }),
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      mockSupabaseClient.storage.from = mockStorageFrom;

      const result = await attendanceService.checkOut(
        employeeId,
        mockCheckOutRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update attendance record');
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await attendanceService.checkOut(
        employeeId,
        mockCheckOutRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Check-out failed due to unexpected error');
    });
  });

  describe('getAttendanceStatus', () => {
    it('should return CHECKED_OUT status for employee with no attendance record', async () => {
      // Mock no attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.getAttendanceStatus(employeeId);

      expect(result.employeeId).toBe(employeeId);
      expect(result.date).toBe(today);
      expect(result.status).toBe('CHECKED_OUT');
      expect(result.requiresCheckOut).toBe(false);
      expect(result.verificationStatus).toBe('PENDING');
    });

    it('should return CHECKED_IN status for employee with only check-in', async () => {
      const mockAttendanceRecord = {
        id: 'attendance-id-123',
        employee_id: employeeId,
        attendance_date: today,
        check_in_timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        check_out_timestamp: null,
        verification_status: 'PENDING',
        battery_level_at_check_in: 0.85,
        last_location_update: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      };

      // Mock attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockAttendanceRecord,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.getAttendanceStatus(employeeId);

      expect(result.employeeId).toBe(employeeId);
      expect(result.status).toBe('CHECKED_IN');
      expect(result.requiresCheckOut).toBe(true);
      expect(result.checkInTime).toEqual(
        new Date(mockAttendanceRecord.check_in_timestamp)
      );
      expect(result.workHours).toBeCloseTo(1.0, 1); // Approximately 1 hour
      expect(result.batteryLevel).toBe(0.85);
      expect(result.lastLocationUpdate).toEqual(
        new Date(mockAttendanceRecord.last_location_update)
      );
    });

    it('should return CHECKED_OUT status for employee with check-in and check-out', async () => {
      const mockAttendanceRecord = {
        id: 'attendance-id-123',
        employee_id: employeeId,
        attendance_date: today,
        check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), // 8 hours ago
        check_out_timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        total_work_hours: 7.0,
        verification_status: 'VERIFIED',
      };

      // Mock attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockAttendanceRecord,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.getAttendanceStatus(employeeId);

      expect(result.employeeId).toBe(employeeId);
      expect(result.status).toBe('CHECKED_OUT');
      expect(result.requiresCheckOut).toBe(false);
      expect(result.checkInTime).toEqual(
        new Date(mockAttendanceRecord.check_in_timestamp)
      );
      expect(result.checkOutTime).toEqual(
        new Date(mockAttendanceRecord.check_out_timestamp)
      );
      expect(result.workHours).toBe(7.0);
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('should handle database error', async () => {
      // Mock database error
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      await expect(
        attendanceService.getAttendanceStatus(employeeId)
      ).rejects.toThrow('Failed to get attendance status');
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        attendanceService.getAttendanceStatus(employeeId)
      ).rejects.toThrow('Failed to get attendance status');
    });
  });

  describe('listAttendanceRecords', () => {
    const mockParams: AttendanceListParams = {
      page: 1,
      limit: 10,
      sortBy: 'attendance_date',
      sortOrder: 'desc',
    };

    const mockAttendanceData = [
      {
        id: 'attendance-id-1',
        employee_id: employeeId,
        attendance_date: today,
        check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        check_out_timestamp: new Date(Date.now() - 3600000).toISOString(),
        verification_status: 'VERIFIED',
        check_in_latitude: 40.7128,
        check_in_longitude: -74.006,
        check_out_latitude: 40.7589,
        check_out_longitude: -73.9851,
        created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        employee: {
          id: employeeId,
          human_readable_user_id: 'PGN-2024-0001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@company.com',
        },
      },
      {
        id: 'attendance-id-2',
        employee_id: employeeId,
        attendance_date: new Date(Date.now() - 24 * 3600000)
          .toISOString()
          .split('T')[0],
        check_in_timestamp: new Date(Date.now() - 32 * 3600000).toISOString(),
        check_out_timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        verification_status: 'PENDING',
        check_in_latitude: 40.7128,
        check_in_longitude: -74.006,
        check_out_latitude: null,
        check_out_longitude: null,
        created_at: new Date(Date.now() - 32 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        employee: {
          id: employeeId,
          human_readable_user_id: 'PGN-2024-0001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@company.com',
        },
      },
    ];

    it('should successfully list attendance records', async () => {
      // Mock successful query
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAttendanceData,
        error: null,
        count: 2,
      });

      // Build the proper chain: select -> order -> range
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: mockRange,
          }),
        }),
      });

      const result = await attendanceService.listAttendanceRecords(mockParams);

      expect(result.records).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.records[0].employeeId).toBe(employeeId);
      expect(result.records[0].employeeName).toBe('John Doe');
      expect(result.records[0].humanReadableEmployeeId).toBe('PGN-2024-0001');
    });

    it('should apply date filter', async () => {
      const paramsWithDate = { ...mockParams, date: today };

      // Create mock function that returns the expected data
      const mockRange = jest.fn().mockResolvedValue({
        data: [mockAttendanceData[0]],
        error: null,
        count: 1,
      });

      // Build the proper chain: select -> order -> eq -> range
      const mockOrderResult = {
        eq: jest.fn().mockReturnValue({
          range: mockRange,
        }),
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue(mockOrderResult),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithDate);

      expect(result.records).toHaveLength(1);
      expect(result.records[0].date).toBe(today);
    });

    it('should apply employee filter', async () => {
      const paramsWithEmployee = { ...mockParams, employeeId };

      // Mock successful query with employee filter
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAttendanceData,
        error: null,
        count: 2,
      });

      // Build the proper chain: select -> order -> eq -> range
      const mockEq = jest.fn().mockReturnValue({
        range: mockRange,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithEmployee);

      expect(result.records).toHaveLength(2);
      expect(result.records[0].employeeId).toBe(employeeId);
    });

    it('should apply CHECKED_IN status filter', async () => {
      const paramsWithStatus = {
        ...mockParams,
        status: 'CHECKED_IN' as AttendanceStatus,
      };

      // Mock successful query with status filter
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Build the proper chain: select -> order -> is -> is -> range
      const mockFirstIs = jest.fn().mockReturnValue({
        range: mockRange,
      });
      const mockSecondIs = jest.fn().mockReturnValue({
        is: mockFirstIs,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockSecondIs,
          }),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithStatus);

      expect(result.records).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should apply CHECKED_OUT status filter', async () => {
      const paramsWithStatus = {
        ...mockParams,
        status: 'CHECKED_OUT' as AttendanceStatus,
      };

      // Mock successful query with status filter
      const mockRange = jest.fn().mockResolvedValue({
        data: mockAttendanceData,
        error: null,
        count: 2,
      });

      // Build the proper chain: select -> order -> is -> is -> range
      const mockFirstIs = jest.fn().mockReturnValue({
        range: mockRange,
      });
      const mockSecondIs = jest.fn().mockReturnValue({
        is: mockFirstIs,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: mockSecondIs,
          }),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithStatus);

      expect(result.records).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should apply ABSENT status filter', async () => {
      const paramsWithStatus = {
        ...mockParams,
        status: 'ABSENT' as AttendanceStatus,
      };

      // Mock successful query with status filter
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      // Build the proper chain: select -> order -> is -> range
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            is: jest.fn().mockReturnValue({
              range: mockRange,
            }),
          }),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithStatus);

      expect(result.records).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const paramsWithPagination = { ...mockParams, page: 2, limit: 5 };

      // Mock successful query with pagination
      const mockRange = jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 12,
      });

      // Build the proper chain: select -> order -> range
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: mockRange,
          }),
        }),
      });

      const result =
        await attendanceService.listAttendanceRecords(paramsWithPagination);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(12);
      expect(result.totalPages).toBe(3);
      expect(result.hasMore).toBe(true);
    });

    it('should handle database error', async () => {
      // Mock database error
      const mockRange = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      // Build the proper chain: select -> order -> range
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: mockRange,
          }),
        }),
      });

      await expect(
        attendanceService.listAttendanceRecords(mockParams)
      ).rejects.toThrow('Failed to list attendance records');
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await expect(
        attendanceService.listAttendanceRecords(mockParams)
      ).rejects.toThrow('Failed to list attendance records');
    });
  });

  describe('updateAttendanceVerification', () => {
    const recordId = 'attendance-id-123';
    const mockUpdateRequest: UpdateVerificationRequest = {
      verificationStatus: 'VERIFIED' as VerificationStatus,
      verificationNotes: 'Verified by manager',
    };

    const mockAttendanceRecord = {
      id: recordId,
      employee_id: employeeId,
      attendance_date: today,
      check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      check_out_timestamp: new Date(Date.now() - 3600000).toISOString(),
      verification_status: 'PENDING',
      employee: {
        id: employeeId,
        human_readable_user_id: 'PGN-2024-0001',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
      },
    };

    it('should successfully update attendance verification', async () => {
      // Mock auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'manager-id',
          },
        },
      });

      // Mock successful update
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockAttendanceRecord,
          verification_status: 'VERIFIED',
          verification_notes: 'Verified by manager',
          verified_by: 'manager-id',
          verified_at: new Date().toISOString(),
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.updateAttendanceVerification(
        recordId,
        mockUpdateRequest
      );

      expect(result.id).toBe(recordId);
      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.notes).toBe('Verified by manager');
      expect(result.employeeId).toBe(employeeId);
      expect(result.employeeName).toBe('John Doe');
      expect(result.humanReadableEmployeeId).toBe('PGN-2024-0001');
    });

    it('should handle update error', async () => {
      // Mock auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'manager-id',
          },
        },
      });

      // Mock failed update
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      await expect(
        attendanceService.updateAttendanceVerification(
          recordId,
          mockUpdateRequest
        )
      ).rejects.toThrow('Failed to update attendance verification');
    });

    it('should handle case when no user is authenticated', async () => {
      // Mock no auth user
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: {
          user: null,
        },
      });

      // Mock successful update without verifier
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockAttendanceRecord,
          verification_status: 'VERIFIED',
          verification_notes: 'Verified by manager',
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.updateAttendanceVerification(
        recordId,
        mockUpdateRequest
      );

      expect(result.id).toBe(recordId);
      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.notes).toBe('Verified by manager');
    });
  });

  describe('emergencyCheckOut', () => {
    const mockEmergencyRequest: EmergencyCheckOutRequest = {
      employeeId,
      timestamp: new Date(),
      reason: 'Emergency situation',
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: new Date(),
      },
    };

    const mockAttendanceRecord = {
      id: 'attendance-id-123',
      employee_id: employeeId,
      attendance_date: today,
      check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
      check_out_timestamp: null,
      verification_status: 'PENDING',
    };

    it('should successfully process emergency check-out', async () => {
      // Mock attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockAttendanceRecord,
        error: null,
      });

      // Mock successful update
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockAttendanceRecord,
          check_out_timestamp: mockEmergencyRequest.timestamp,
          verification_status: 'VERIFIED',
          verification_notes: `Emergency check-out: ${mockEmergencyRequest.reason}`,
          check_out_latitude: mockEmergencyRequest.location?.latitude,
          check_out_longitude: mockEmergencyRequest.location?.longitude,
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.emergencyCheckOut(
        employeeId,
        mockEmergencyRequest
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Emergency check-out processed successfully');
      expect(result.status).toBe('CHECKED_OUT');
      expect(result.verificationStatus).toBe('VERIFIED');
      expect(result.attendanceId).toBe('attendance-id-123');
    });

    it('should handle no active check-in found', async () => {
      // Mock no attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.emergencyCheckOut(
        employeeId,
        mockEmergencyRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'No active check-in found for emergency check-out'
      );
    });

    it('should handle update error', async () => {
      // Mock attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockAttendanceRecord,
        error: null,
      });

      // Mock failed update
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.emergencyCheckOut(
        employeeId,
        mockEmergencyRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to process emergency check-out');
    });

    it('should handle emergency check-out without location', async () => {
      const requestWithoutLocation = {
        ...mockEmergencyRequest,
        location: undefined,
      };

      // Mock attendance record
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockAttendanceRecord,
        error: null,
      });

      // Mock successful update
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockAttendanceRecord,
          check_out_timestamp: requestWithoutLocation.timestamp,
          verification_status: 'VERIFIED',
          verification_notes: `Emergency check-out: ${requestWithoutLocation.reason}`,
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: mockSingle,
            }),
          }),
        }),
      });

      const result = await attendanceService.emergencyCheckOut(
        employeeId,
        requestWithoutLocation
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Emergency check-out processed successfully');
      expect(result.status).toBe('CHECKED_OUT');
      expect(result.verificationStatus).toBe('VERIFIED');
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await attendanceService.emergencyCheckOut(
        employeeId,
        mockEmergencyRequest
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Emergency check-out failed due to server error'
      );
    });
  });

  describe('updateLocationTracking', () => {
    const attendanceId = 'attendance-id-123';
    const mockLocationRequest: LocationUpdateRequest = {
      location: {
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        timestamp: new Date(),
      },
      timestamp: new Date(),
      batteryLevel: 0.85,
    };

    const mockActiveRecord = {
      id: attendanceId,
      check_in_timestamp: new Date(Date.now() - 3600000).toISOString(),
      check_out_timestamp: null,
      path_data: [
        {
          lat: 40.712,
          lng: -74.005,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    };

    it('should successfully update location tracking', async () => {
      // Mock active attendance record
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockActiveRecord,
        error: null,
      });

      // Mock successful update
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(true);
    });

    it('should not update location for checked-out record', async () => {
      // Mock checked-out attendance record
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockActiveRecord,
          check_out_timestamp: new Date().toISOString(),
        },
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(false);
    });

    it('should handle record not found', async () => {
      // Mock no attendance record
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(false);
    });

    it('should not add point if movement is below threshold', async () => {
      // Mock active attendance record with nearby last point
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          ...mockActiveRecord,
          path_data: [
            {
              lat: 40.7128,
              lng: -74.006,
              timestamp: new Date(Date.now() - 1800000).toISOString(),
            },
          ],
        },
        error: null,
      });

      // Mock successful update
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(true);
    });

    it('should handle update error', async () => {
      // Mock active attendance record
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockActiveRecord,
        error: null,
      });

      // Mock failed update
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      });

      // Set up the mock chain
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(false);
    });

    it('should handle unexpected errors', async () => {
      // Mock createClient to throw an error
      (createClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      const result = await attendanceService.updateLocationTracking(
        attendanceId,
        mockLocationRequest
      );

      expect(result).toBe(false);
    });
  });

  describe('private methods', () => {
    describe('calculateWorkHours', () => {
      it('should calculate work hours correctly', () => {
        const checkInTime = new Date(Date.now() - 8 * 3600000); // 8 hours ago
        const checkOutTime = new Date(Date.now() - 3600000); // 1 hour ago

        // Access private method through prototype
        const workHours = (
          attendanceService as unknown as {
            calculateWorkHours: (
              checkInTime: Date,
              checkOutTime?: Date
            ) => number;
          }
        ).calculateWorkHours(checkInTime, checkOutTime);

        expect(workHours).toBeCloseTo(7.0, 1);
      });

      it('should calculate work hours with current time when checkOutTime is not provided', () => {
        const checkInTime = new Date(Date.now() - 3600000); // 1 hour ago

        // Access private method through prototype
        const workHours = (
          attendanceService as unknown as {
            calculateWorkHours: (
              checkInTime: Date,
              checkOutTime?: Date
            ) => number;
          }
        ).calculateWorkHours(checkInTime);

        expect(workHours).toBeCloseTo(1.0, 1);
      });
    });

    describe('calculateDistance', () => {
      it('should calculate distance between two points', () => {
        const lat1 = 40.7128;
        const lon1 = -74.006;
        const lat2 = 40.7129;
        const lon2 = -74.0061;

        // Access private method through prototype
        const distance = (
          attendanceService as unknown as {
            calculateDistance: (
              lat1: number,
              lon1: number,
              lat2: number,
              lon2: number
            ) => number;
          }
        ).calculateDistance(lat1, lon1, lat2, lon2);

        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(20); // Should be very close
      });

      it('should return 0 for same points', () => {
        const lat = 40.7128;
        const lon = -74.006;

        // Access private method through prototype
        const distance = (
          attendanceService as unknown as {
            calculateDistance: (
              lat1: number,
              lon1: number,
              lat2: number,
              lon2: number
            ) => number;
          }
        ).calculateDistance(lat, lon, lat, lon);

        expect(distance).toBe(0);
      });
    });

    describe('mapAttendanceStatus', () => {
      it('should map to CHECKED_IN when check-in exists but no check-out', () => {
        const record = {
          check_in_timestamp: new Date().toISOString(),
          check_out_timestamp: null,
        };

        // Access private method through prototype
        const status = (
          attendanceService as unknown as {
            mapAttendanceStatus: (record: unknown) => string;
          }
        ).mapAttendanceStatus(record);

        expect(status).toBe('CHECKED_IN');
      });

      it('should map to CHECKED_OUT when both check-in and check-out exist', () => {
        const record = {
          check_in_timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
          check_out_timestamp: new Date(Date.now() - 3600000).toISOString(),
        };

        // Access private method through prototype
        const status = (
          attendanceService as unknown as {
            mapAttendanceStatus: (record: unknown) => string;
          }
        ).mapAttendanceStatus(record);

        expect(status).toBe('CHECKED_OUT');
      });

      it('should map to ABSENT when no check-in exists', () => {
        const record = {
          check_in_timestamp: null,
          check_out_timestamp: null,
        };

        // Access private method through prototype
        const status = (
          attendanceService as unknown as {
            mapAttendanceStatus: (record: unknown) => string;
          }
        ).mapAttendanceStatus(record);

        expect(status).toBe('ABSENT');
      });
    });

    describe('uploadSelfieToStorage', () => {
      it('should successfully upload selfie to storage', async () => {
        const selfieData =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        const date = '2024-01-15';
        const type = 'checkin';

        // Mock storage upload
        const mockStorageFrom = jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({ error: null }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: {
              publicUrl:
                'https://example.com/attendance/2024/01/15/employee-id-123/checkin-1234567890.jpg',
            },
          }),
        });

        mockSupabaseClient.storage.from = mockStorageFrom;

        // Access private method through prototype
        const result = await (
          attendanceService as unknown as {
            uploadSelfieToStorage: (
              employeeId: string,
              selfieData: string,
              date: string,
              type: string
            ) => Promise<string>;
          }
        ).uploadSelfieToStorage(employeeId, selfieData, date, type);

        expect(result).toBe(
          'https://example.com/attendance/2024/01/15/employee-id-123/checkin-1234567890.jpg'
        );
      });

      it('should handle upload error', async () => {
        const selfieData =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        const date = '2024-01-15';
        const type = 'checkin';

        // Mock storage upload error
        const mockStorageFrom = jest.fn().mockReturnValue({
          upload: jest
            .fn()
            .mockResolvedValue({ error: { message: 'Upload failed' } }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: {
              publicUrl:
                'https://example.com/attendance/2024/01/15/employee-id-123/checkin-1234567890.jpg',
            },
          }),
        });

        mockSupabaseClient.storage.from = mockStorageFrom;

        // Access private method through prototype
        await expect(
          (
            attendanceService as unknown as {
              uploadSelfieToStorage: (
                employeeId: string,
                selfieData: string,
                date: string,
                type: string
              ) => Promise<string>;
            }
          ).uploadSelfieToStorage(employeeId, selfieData, date, type)
        ).rejects.toThrow('Failed to upload selfie');
      });

      it('should handle unexpected errors', async () => {
        const selfieData =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
        const date = '2024-01-15';
        const type = 'checkin';

        // Mock createClient to throw an error
        (createClient as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Unexpected error');
        });

        // Access private method through prototype
        await expect(
          (
            attendanceService as unknown as {
              uploadSelfieToStorage: (
                employeeId: string,
                selfieData: string,
                date: string,
                type: string
              ) => Promise<string>;
            }
          ).uploadSelfieToStorage(employeeId, selfieData, date, type)
        ).rejects.toThrow('Failed to upload selfie to storage');
      });
    });
  });
});
