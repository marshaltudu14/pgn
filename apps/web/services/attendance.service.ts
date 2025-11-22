import { createClient } from '@/utils/supabase/server';
import {
  CheckInRequest,
  CheckOutRequest,
  AttendanceResponse,
  AttendanceStatusResponse,
  LocationData,
  AttendanceStatus,
  CheckOutMethod,
  VerificationStatus,
  EmergencyCheckOutRequest,
  LocationUpdateRequest,
  DailyAttendanceRecord,
  AttendanceListParams,
  AttendanceListResponse,
  UpdateVerificationRequest
} from '@pgn/shared';

// Interfaces for database records to avoid using any
interface DatabaseAttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_timestamp: string | null;
  check_out_timestamp: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_selfie_url: string | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_out_selfie_url: string | null;
  check_out_method: string | null;
  check_out_reason: string | null;
  total_work_hours: number | null;
  total_distance_meters: number | null;
  path_data: PathPoint[] | null;
  last_location_update: string | null;
  battery_level_at_check_in: number | null;
  battery_level_at_check_out: number | null;
  device: string | null;
  verification_status: string | null;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    human_readable_user_id?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface PathPoint {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
  batteryLevel?: number;
}

export class AttendanceService {
  /**
   * Check in an employee with location and selfie
   */
  async checkIn(employeeId: string, request: CheckInRequest): Promise<AttendanceResponse> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Check if employee already has attendance for today
      const { data: existingAttendance, error: checkError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing attendance:', checkError);
        return {
          success: false,
          message: 'Failed to check existing attendance records'
        };
      }

      // Allow multiple check-ins per day for disruptions
      // This helps employees resume work after app crashes, network issues, etc.
      // No restriction - employees can always check in to start/resume work

      // Upload selfie to storage
      const photoUrl = await this.uploadSelfieToStorage(
        employeeId,
        request.selfie || '',
        today,
        'checkin'
      );

      // Create or update attendance record
      const attendanceData = {
        employee_id: employeeId,
        attendance_date: today,
        check_in_timestamp: request.timestamp.toISOString(),
        check_in_latitude: request.location.latitude,
        check_in_longitude: request.location.longitude,
        check_in_selfie_url: photoUrl,
        battery_level_at_check_in: request.deviceInfo?.batteryLevel || null,
        device: request.deviceInfo?.model || null,
        path_data: [],
        verification_status: 'PENDING' as VerificationStatus,
        last_location_update: new Date().toISOString()
      };

      let attendanceRecord;
      if (existingAttendance) {
        // Update existing record
        const { data, error } = await supabase
          .from('daily_attendance')
          .update(attendanceData)
          .eq('id', existingAttendance.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating attendance record:', error);
          return {
            success: false,
            message: 'Failed to update attendance record'
          };
        }
        attendanceRecord = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('daily_attendance')
          .insert(attendanceData)
          .select()
          .single();

        if (error) {
          console.error('Error creating attendance record:', error);
          return {
            success: false,
            message: 'Failed to create attendance record'
          };
        }
        attendanceRecord = data;
      }

      return {
        success: true,
        message: 'Check-in successful',
        attendanceId: attendanceRecord.id,
        timestamp: new Date(attendanceRecord.check_in_timestamp!),
        status: 'CHECKED_IN' as AttendanceStatus,
        checkInTime: new Date(attendanceRecord.check_in_timestamp!),
        verificationStatus: attendanceRecord.verification_status
      };
    } catch (error) {
      console.error('Unexpected error during check-in:', error);
      return {
        success: false,
        message: 'Check-in failed due to unexpected error'
      };
    }
  }

  /**
   * Check out an employee with location and selfie
   */
  async checkOut(employeeId: string, request: CheckOutRequest): Promise<AttendanceResponse> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Find today's attendance record
      const { data: attendanceRecord, error: fetchError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .single();

      if (fetchError || !attendanceRecord) {
        return {
          success: false,
          message: 'No check-in record found for today'
        };
      }

      if (attendanceRecord.check_out_timestamp) {
        return {
          success: false,
          message: 'Employee already checked out today'
        };
      }

      // Upload checkout selfie to storage
      const photoUrl = await this.uploadSelfieToStorage(
        employeeId,
        request.selfie || '',
        today,
        'checkout'
      );

      // Calculate work hours
      const checkInTime = new Date(attendanceRecord.check_in_timestamp!);
      const checkOutTime = request.timestamp;
      const workHours = this.calculateWorkHours(checkInTime, checkOutTime);

      // Update attendance record with checkout information
      const updateData = {
        check_out_timestamp: checkOutTime.toISOString(),
        check_out_latitude: request.location.latitude,
        check_out_longitude: request.location.longitude,
        check_out_selfie_url: photoUrl,
        check_out_method: request.method || 'MANUAL' as CheckOutMethod,
        check_out_reason: request.reason || null,
        battery_level_at_check_out: request.deviceInfo?.batteryLevel || null,
        total_work_hours: workHours,
        last_location_update: new Date().toISOString(),
        verification_status: 'PENDING' as VerificationStatus
      };

      const { data: updatedRecord, error: updateError } = await supabase
        .from('daily_attendance')
        .update(updateData)
        .eq('id', attendanceRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating attendance record:', updateError);
        return {
          success: false,
          message: 'Failed to update attendance record'
        };
      }

      return {
        success: true,
        message: 'Check-out successful',
        attendanceId: updatedRecord.id,
        timestamp: new Date(updatedRecord.check_out_timestamp!),
        status: 'CHECKED_OUT' as AttendanceStatus,
        checkInTime: new Date(updatedRecord.check_in_timestamp!),
        checkOutTime: new Date(updatedRecord.check_out_timestamp!),
        workHours: workHours,
        verificationStatus: updatedRecord.verification_status
      };
    } catch (error) {
      console.error('Unexpected error during check-out:', error);
      return {
        success: false,
        message: 'Check-out failed due to unexpected error'
      };
    }
  }

  /**
   * Get current attendance status for an employee
   */
  async getAttendanceStatus(employeeId: string): Promise<AttendanceStatusResponse> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const { data: attendanceRecord, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching attendance status:', error);
        throw new Error('Failed to fetch attendance status');
      }

      if (!attendanceRecord || !attendanceRecord.check_in_timestamp) {
        return {
          employeeId,
          date: today,
          status: 'CHECKED_OUT' as AttendanceStatus,
          requiresCheckOut: false,
          verificationStatus: 'PENDING' as VerificationStatus
        };
      }

      const isCheckedIn = !attendanceRecord.check_out_timestamp;
      const status = isCheckedIn ? 'CHECKED_IN' as AttendanceStatus : 'CHECKED_OUT' as AttendanceStatus;

      let workHours = attendanceRecord.total_work_hours || 0;
      if (isCheckedIn && attendanceRecord.check_in_timestamp) {
        // Calculate current work hours if still checked in
        const checkInTime = new Date(attendanceRecord.check_in_timestamp);
        const currentTime = new Date();
        workHours = this.calculateWorkHours(checkInTime, currentTime);
      }

      return {
        employeeId,
        date: today,
        status,
        currentAttendanceId: attendanceRecord.id,
        checkInTime: attendanceRecord.check_in_timestamp ? new Date(attendanceRecord.check_in_timestamp) : undefined,
        checkOutTime: attendanceRecord.check_out_timestamp ? new Date(attendanceRecord.check_out_timestamp) : undefined,
        workHours,
        totalDistance: attendanceRecord.total_distance_meters || 0,
        lastLocationUpdate: attendanceRecord.last_location_update ? new Date(attendanceRecord.last_location_update) : undefined,
        batteryLevel: attendanceRecord.battery_level_at_check_in || undefined,
        verificationStatus: attendanceRecord.verification_status as VerificationStatus,
        requiresCheckOut: isCheckedIn
      };
    } catch (error) {
      console.error('Unexpected error fetching attendance status:', error);
      throw new Error('Failed to fetch attendance status');
    }
  }

  /**
   * Handle emergency check-out scenarios
   */
  async emergencyCheckOut(employeeId: string, request: EmergencyCheckOutRequest): Promise<AttendanceResponse> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Find today's attendance record
      const { data: attendanceRecord, error: fetchError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .single();

      if (fetchError || !attendanceRecord) {
        return {
          success: false,
          message: 'No check-in record found for today'
        };
      }

      if (attendanceRecord.check_out_timestamp) {
        return {
          success: false,
          message: 'Employee already checked out today'
        };
      }

      // Use last known location if provided
      const location = request.lastLocationData || {
        latitude: attendanceRecord.check_in_latitude || 0,
        longitude: attendanceRecord.check_in_longitude || 0,
        accuracy: 100,
        timestamp: new Date()
      };

      // Calculate work hours
      const checkInTime = new Date(attendanceRecord.check_in_timestamp!);
      const checkOutTime = new Date();
      const workHours = this.calculateWorkHours(checkInTime, checkOutTime);

      // Upload emergency selfie if provided
      let emergencySelfieUrl = null;
      if (request.selfieData) {
        emergencySelfieUrl = await this.uploadSelfieToStorage(
          employeeId,
          request.selfieData,
          today,
          'emergency-checkout'
        );
      }

      // Update attendance record with emergency checkout information
      const updateData = {
        check_out_timestamp: checkOutTime.toISOString(),
        check_out_latitude: location.latitude,
        check_out_longitude: location.longitude,
        check_out_selfie_url: emergencySelfieUrl,
        check_out_method: request.method,
        check_out_reason: request.reason,
        total_work_hours: workHours,
        last_location_update: new Date().toISOString(),
        verification_status: 'FLAGGED' as VerificationStatus,
        verification_notes: `Emergency check-out: ${request.reason}`
      };

      const { data: updatedRecord, error: updateError } = await supabase
        .from('daily_attendance')
        .update(updateData)
        .eq('id', attendanceRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating attendance record:', updateError);
        return {
          success: false,
          message: 'Failed to update attendance record'
        };
      }

      return {
        success: true,
        message: 'Emergency check-out processed successfully',
        attendanceId: updatedRecord.id,
        timestamp: new Date(updatedRecord.check_out_timestamp!),
        status: 'CHECKED_OUT' as AttendanceStatus,
        checkInTime: new Date(updatedRecord.check_in_timestamp!),
        checkOutTime: new Date(updatedRecord.check_out_timestamp!),
        workHours: workHours,
        verificationStatus: updatedRecord.verification_status
      };
    } catch (error) {
      console.error('Unexpected error during emergency check-out:', error);
      return {
        success: false,
        message: 'Emergency check-out failed due to unexpected error'
      };
    }
  }

  /**
   * Update location tracking data for checked-in employees
   */
  async updateLocationTracking(employeeId: string, request: LocationUpdateRequest): Promise<boolean> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Add location point to path data
      const pathPoint = {
        timestamp: request.timestamp.toISOString(),
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        battery_level: request.batteryLevel || null,
        accuracy: request.location.accuracy || null,
        distance_from_previous: 0 // Will be calculated in real implementation
      };

      // Update attendance record with new location point
      const { error } = await supabase
        .from('daily_attendance')
        .update({
          last_location_update: request.timestamp.toISOString(),
          path_data: supabase.rpc('append_path_point', {
            attendance_date: today,
            employee_id: employeeId,
            new_point: pathPoint
          })
        })
        .eq('employee_id', employeeId)
        .eq('attendance_date', today);

      if (error) {
        console.error('Error updating location tracking:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating location tracking:', error);
      return false;
    }
  }

  /**
   * Upload selfie to Supabase storage
   */
  private async uploadSelfieToStorage(
    employeeId: string,
    selfieData: string,
    date: string,
    type: 'checkin' | 'checkout' | 'emergency-checkout'
  ): Promise<string> {
    try {
      const supabase = await createClient();

      // Generate file path for storage
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const timestamp = Date.now();
      const filePath = `attendance/${year}/${month}/${day}/${employeeId}/${type}-${timestamp}.jpg`;

      // Convert base64 to blob
      const base64Data = selfieData.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Upload to storage
      const { error } = await supabase.storage
        .from('attendance')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '31536000', // 1 year
          upsert: false
        });

      if (error) {
        console.error('Error uploading selfie:', error);
        throw new Error('Failed to upload selfie');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading selfie to storage:', error);
      throw new Error('Failed to upload selfie to storage');
    }
  }

  /**
   * Reverse geocode location to get address
   */
  private async reverseGeocode(location: LocationData): Promise<string> {
    try {
      // This is a placeholder implementation
      // In production, you would use a geocoding service like OpenStreetMap Nominatim
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Error reverse geocoding location:', error);
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
  }

  /**
   * Calculate work hours between two timestamps
   */
  private calculateWorkHours(checkInTime: Date, checkOutTime: Date): number {
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  }

  /**
   * List attendance records with filtering and pagination
   */
  async listAttendanceRecords(
    params: AttendanceListParams
  ): Promise<AttendanceListResponse> {
    const supabase = await createClient();

    // Start building the query
    let query = supabase
      .from('daily_attendance')
      .select(`
        *,
        employee:employee_id (
          id,
          human_readable_user_id,
          first_name,
          last_name,
          email
        )
      `)
      .order(params.sortBy || 'attendance_date', { ascending: params.sortOrder === 'asc' });

    // Apply filters
    if (params.date) {
      query = query.eq('attendance_date', params.date);
    } else {
      if (params.dateFrom) {
        query = query.gte('attendance_date', params.dateFrom);
      }
      if (params.dateTo) {
        query = query.lte('attendance_date', params.dateTo);
      }
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.verificationStatus) {
      query = query.eq('verification_status', params.verificationStatus);
    }

    if (params.employeeId) {
      query = query.eq('employee_id', params.employeeId);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('daily_attendance')
      .select('*', { count: 'exact', head: true })
      .match({
        ...(params.date && { attendance_date: params.date }),
        ...(params.status && { status: params.status }),
        ...(params.verificationStatus && { verification_status: params.verificationStatus }),
        ...(params.employeeId && { employee_id: params.employeeId }),
      });

    if (countError) {
      console.error('Error getting attendance count:', countError);
      throw new Error('Failed to get attendance count');
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attendance records:', error);
      throw new Error('Failed to fetch attendance records');
    }

    // Transform the data to match the expected interface
    const transformedRecords: DailyAttendanceRecord[] = (data || []).map((record: DatabaseAttendanceRecord) => ({
      id: record.id,
      employeeId: record.employee_id,
      humanReadableEmployeeId: record.employee?.human_readable_user_id,
      employeeName: record.employee?.first_name && record.employee?.last_name
        ? `${record.employee.first_name} ${record.employee.last_name}`
        : undefined,
      date: record.attendance_date,
      checkInTime: record.check_in_timestamp ? new Date(record.check_in_timestamp) : undefined,
      checkOutTime: record.check_out_timestamp ? new Date(record.check_out_timestamp) : undefined,
      checkInLocation: record.check_in_latitude && record.check_in_longitude
        ? {
            latitude: record.check_in_latitude,
            longitude: record.check_in_longitude,
            accuracy: 10, // Default accuracy if not stored
            timestamp: record.check_in_timestamp ? new Date(record.check_in_timestamp) : new Date(record.attendance_date),
            address: undefined, // Would need geocoding service for address
          }
        : undefined,
      checkOutLocation: record.check_out_latitude && record.check_out_longitude
        ? {
            latitude: record.check_out_latitude,
            longitude: record.check_out_longitude,
            accuracy: 10, // Default accuracy if not stored
            timestamp: record.check_out_timestamp ? new Date(record.check_out_timestamp) : new Date(record.attendance_date),
            address: undefined, // Would need geocoding service for address
          }
        : undefined,
      locationPath: record.path_data ? record.path_data.map((point: PathPoint) => ({
        latitude: point.lat,
        longitude: point.lng,
        timestamp: new Date(point.timestamp),
        accuracy: point.accuracy || 10,
        batteryLevel: point.batteryLevel,
      })) : [],
      status: this.mapAttendanceStatus(record),
      verificationStatus: record.verification_status as VerificationStatus,
      workHours: record.total_work_hours ? Number(record.total_work_hours) : undefined,
      notes: record.verification_notes || undefined,
      device: record.device || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    }));

    // Calculate pagination info
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      records: transformedRecords,
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };
  }

  /**
   * Update attendance verification status
   */
  async updateAttendanceVerification(
    recordId: string,
    request: UpdateVerificationRequest
  ): Promise<DailyAttendanceRecord> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      verification_status: request.verificationStatus,
      verification_notes: request.verificationNotes,
      updated_at: new Date().toISOString(),
    };

    // Get the current user for verification
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      updateData.verified_by = data.user.id;
      updateData.verified_at = new Date().toISOString();
    }

    const { data: recordData, error } = await supabase
      .from('daily_attendance')
      .update(updateData)
      .eq('id', recordId)
      .select(`
        *,
        employee:employee_id (
          id,
          human_readable_user_id,
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error updating attendance verification:', error);
      throw new Error('Failed to update attendance verification');
    }

    // Transform the updated record
    const transformedRecord: DailyAttendanceRecord = {
      id: recordData.id,
      employeeId: recordData.employee_id,
      humanReadableEmployeeId: recordData.employee?.human_readable_user_id,
      employeeName: recordData.employee?.first_name && recordData.employee?.last_name
        ? `${recordData.employee.first_name} ${recordData.employee.last_name}`
        : undefined,
      date: recordData.attendance_date,
      checkInTime: recordData.check_in_timestamp ? new Date(recordData.check_in_timestamp) : undefined,
      checkOutTime: recordData.check_out_timestamp ? new Date(recordData.check_out_timestamp) : undefined,
      checkInLocation: recordData.check_in_latitude && recordData.check_in_longitude
        ? {
            latitude: recordData.check_in_latitude,
            longitude: recordData.check_in_longitude,
            accuracy: 10,
            timestamp: recordData.check_in_timestamp ? new Date(recordData.check_in_timestamp) : new Date(recordData.attendance_date),
            address: undefined,
          }
        : undefined,
      checkOutLocation: recordData.check_out_latitude && recordData.check_out_longitude
        ? {
            latitude: recordData.check_out_latitude,
            longitude: recordData.check_out_longitude,
            accuracy: 10,
            timestamp: recordData.check_out_timestamp ? new Date(recordData.check_out_timestamp) : new Date(recordData.attendance_date),
            address: undefined,
          }
        : undefined,
      locationPath: recordData.path_data ? recordData.path_data.map((point: PathPoint) => ({
        latitude: point.lat,
        longitude: point.lng,
        timestamp: new Date(point.timestamp),
        accuracy: point.accuracy || 10,
        batteryLevel: point.batteryLevel,
      })) : [],
      status: this.mapAttendanceStatus(recordData),
      verificationStatus: recordData.verification_status as VerificationStatus,
      workHours: recordData.total_work_hours ? Number(recordData.total_work_hours) : undefined,
      notes: recordData.verification_notes || undefined,
      device: recordData.device || undefined,
      createdAt: new Date(recordData.created_at),
      updatedAt: new Date(recordData.updated_at),
    };

    return transformedRecord;
  }

  /**
   * Helper function to map database status to application status
   */
  private mapAttendanceStatus(record: DatabaseAttendanceRecord): 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT' {
    if (record.check_in_timestamp && !record.check_out_timestamp) {
      return 'CHECKED_IN';
    }
    if (record.check_in_timestamp && record.check_out_timestamp) {
      return 'CHECKED_OUT';
    }
    return 'ABSENT';
  }
}

// Export singleton instance
export const attendanceService = new AttendanceService();

// Export standalone functions for easier importing
export const listAttendanceRecords = attendanceService.listAttendanceRecords.bind(attendanceService);
export const updateAttendanceVerification = attendanceService.updateAttendanceVerification.bind(attendanceService);