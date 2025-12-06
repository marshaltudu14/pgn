import { createClient } from '@/utils/supabase/server';
import {
    AttendanceListParams,
    AttendanceListResponse,
    AttendanceResponse,
    AttendanceStatus,
    AttendanceStatusResponse,
    CheckInRequest,
    CheckOutMethod,
    CheckOutRequest,
    DailyAttendanceRecord,
    EmergencyCheckOutRequest,
    LocationUpdateRequest,
    PathData,
    UpdateVerificationRequest,
    VerificationStatus,
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
    } catch {
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
      console.error('Error in getAttendanceStatus:', error);
      throw new Error('Failed to get attendance status');
    }
  }

  /**
   * Transform database records to expected interface
   */
  private transformAttendanceRecords(data: DatabaseAttendanceRecord[] | null): DailyAttendanceRecord[] {
    // Transform the data to match the expected interface
    const transformedRecords: DailyAttendanceRecord[] = (data || []).map((record: DatabaseAttendanceRecord) => {
      if (!record) {
        throw new Error('Attendance record is null or undefined');
      }

      return {
      id: record.id,
      employeeId: record.employee_id,
      humanReadableEmployeeId: record.employee?.human_readable_user_id,
      employeeName: record.employee?.first_name && record.employee?.last_name
        ? `${record.employee.first_name} ${record.employee.last_name}`
        : undefined,
      date: record.attendance_date,
      checkInTime: record.check_in_timestamp ? new Date(record.check_in_timestamp) : undefined,
      checkOutTime: record.check_out_timestamp ? new Date(record.check_out_timestamp) : undefined,
      checkInSelfieUrl: record.check_in_selfie_url || undefined,
      checkOutSelfieUrl: record.check_out_selfie_url || undefined,
      checkInLocation: record.check_in_latitude && record.check_in_longitude
        ? {
            latitude: typeof record.check_in_latitude === 'string' ? parseFloat(record.check_in_latitude) : record.check_in_latitude,
            longitude: typeof record.check_in_longitude === 'string' ? parseFloat(record.check_in_longitude) : record.check_in_longitude,
            accuracy: 10, // Default accuracy if not stored
            timestamp: record.check_in_timestamp ? new Date(record.check_in_timestamp) : new Date(record.attendance_date),
            address: undefined, // Would need geocoding service for address
          }
        : undefined,
      checkOutLocation: record.check_out_latitude != null && record.check_out_longitude != null
        ? {
            latitude: typeof record.check_out_latitude === 'string' ? parseFloat(record.check_out_latitude) : record.check_out_latitude,
            longitude: typeof record.check_out_longitude === 'string' ? parseFloat(record.check_out_longitude) : record.check_out_longitude,
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
    lastLocationUpdate: record.last_location_update ? new Date(record.last_location_update) : undefined,
    batteryLevelAtCheckIn: record.battery_level_at_check_in !== null ? Number(record.battery_level_at_check_in) : undefined,
    batteryLevelAtCheckOut: record.battery_level_at_check_out !== null ? Number(record.battery_level_at_check_out) : undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
      };
    });

    return transformedRecords;
  }

  async listAttendanceRecords(params: AttendanceListParams): Promise<AttendanceListResponse> {
    try {
      const supabase = await createClient();
      const { page = 1, limit = 10, date, employeeId } = params;
      const offset = (page - 1) * limit;

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
        query = query.eq('attendance_date', date);
      }
      if (params.employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      if (params.status) {
        if (params.status === 'CHECKED_IN') {
          query = query.is('check_in_timestamp', 'not null').is('check_out_timestamp', 'null');
        } else if (params.status === 'CHECKED_OUT') {
          query = query.is('check_in_timestamp', 'not null').is('check_out_timestamp', 'not null');
        } else if (params.status === 'ABSENT') {
          query = query.is('check_in_timestamp', 'null');
        }
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching attendance records:', error);
        throw new Error('Failed to fetch attendance records');
      }

      // Transform the data
      const transformedRecords = this.transformAttendanceRecords(data);

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
    } catch (error) {
      console.error('Error in listAttendanceRecords:', error);
      throw new Error('Failed to list attendance records');
    }
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

    // Debug logging

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

    // Debug: Log the updated record

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
      checkInSelfieUrl: recordData.check_in_selfie_url || undefined,
      checkOutSelfieUrl: recordData.check_out_selfie_url || undefined,
      checkInLocation: recordData.check_in_latitude && recordData.check_in_longitude
        ? {
            latitude: typeof recordData.check_in_latitude === 'string' ? parseFloat(recordData.check_in_latitude) : recordData.check_in_latitude,
            longitude: typeof recordData.check_in_longitude === 'string' ? parseFloat(recordData.check_in_longitude) : recordData.check_in_longitude,
            accuracy: 10,
            timestamp: recordData.check_in_timestamp ? new Date(recordData.check_in_timestamp) : new Date(recordData.attendance_date),
            address: undefined,
          }
        : undefined,
      checkOutLocation: recordData.check_out_latitude && recordData.check_out_longitude
        ? {
            latitude: typeof recordData.check_out_latitude === 'string' ? parseFloat(recordData.check_out_latitude) : recordData.check_out_latitude,
            longitude: typeof recordData.check_out_longitude === 'string' ? parseFloat(recordData.check_out_longitude) : recordData.check_out_longitude,
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

  /**
   * Upload selfie to Supabase storage
   */
  private async uploadSelfieToStorage(
    employeeId: string,
    selfieData: string,
    date: string,
    type: 'checkin' | 'checkout'
  ): Promise<string> {
    try {
      const supabase = await createClient();
      // Format: attendance/YYYY/MM/DD/employeeId/checkin-timestamp.jpg
      const [year, month, day] = date.split('-');
      const fileName = `attendance/${year}/${month}/${day}/${employeeId}/${type}-${Date.now()}.jpg`;

      // Convert base64 to blob
      const base64Data = selfieData.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Buffer.from(base64Data, 'base64');

      const { error } = await supabase.storage
        .from('attendance')
        .upload(fileName, binaryData, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        console.error('Error uploading selfie:', error);
        throw new Error('Failed to upload selfie');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attendance')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error in uploadSelfieToStorage:', error);
      throw new Error('Failed to upload selfie to storage');
    }
  }

  /**
   * Handle emergency check-out
   */
  async emergencyCheckOut(employeeId: string, request: EmergencyCheckOutRequest): Promise<AttendanceResponse> {
    try {
      const supabase = await createClient();
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance record
      const { data: attendanceRecord, error } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error || !attendanceRecord || !attendanceRecord.check_in_timestamp) {
        return {
          success: false,
          message: 'No active check-in found for emergency check-out'
        };
      }

      // Update with emergency check-out data
      const updateData: Record<string, unknown> = {
        check_out_timestamp: request.timestamp,
        verification_status: 'VERIFIED' as const, // Auto-approve emergency check-outs
        verification_notes: `Emergency check-out: ${request.reason}`,
        updated_at: new Date().toISOString()
      };

      // Add location if provided
      if (request.location) {
        updateData.check_out_latitude = request.location.latitude;
        updateData.check_out_longitude = request.location.longitude;
      }

      const { data: updatedRecord, error: updateError } = await supabase
        .from('daily_attendance')
        .update(updateData)
        .eq('id', attendanceRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating emergency check-out:', updateError);
        return {
          success: false,
          message: 'Failed to process emergency check-out'
        };
      }

      return {
        success: true,
        message: 'Emergency check-out processed successfully',
        attendanceId: updatedRecord.id,
        timestamp: updatedRecord.check_out_timestamp,
        status: this.mapAttendanceStatus(updatedRecord),
        checkInTime: updatedRecord.check_in_timestamp,
        checkOutTime: updatedRecord.check_out_timestamp,
        workHours: updatedRecord.total_work_hours || 0,
        verificationStatus: 'VERIFIED'
      };
    } catch (error) {
      console.error('Error in emergencyCheckOut:', error);
      return {
        success: false,
        message: 'Emergency check-out failed due to server error'
      };
    }
  }

  /**
   * Update location tracking for an attendance record
   */
  async updateLocationTracking(attendanceId: string, request: LocationUpdateRequest): Promise<boolean> {
    try {
      const supabase = await createClient();

      // Get current attendance record to check if it's active
      const { data: record, error } = await supabase
        .from('daily_attendance')
        .select('check_in_timestamp, check_out_timestamp, path_data')
        .eq('id', attendanceId)
        .single();

      if (error || !record) {
        console.error('Attendance record not found:', error);
        return false;
      }

      // Don't update location for checked-out records
      if (record.check_out_timestamp) {
        return false;
      }

      // Get current path data or initialize empty array
      const currentPath = record.path_data || [];

      // Add new location point
      const newPathPoint = {
        lat: request.location.latitude,
        lng: request.location.longitude,
        timestamp: request.location.timestamp.toISOString(),
        accuracy: request.location.accuracy,
        batteryLevel: request.batteryLevel || 0
      };

      // Only add if movement exceeds threshold (50 meters) or it's the first point
      let shouldAddPoint = currentPath.length === 0;

      if (currentPath.length > 0) {
        const lastPoint = currentPath[currentPath.length - 1];
        const distance = this.calculateDistance(
          lastPoint.lat, lastPoint.lng,
          request.location.latitude, request.location.longitude
        );
        shouldAddPoint = distance > 50; // 50 meter threshold
      }

      let updatedPath: PathData[] = currentPath;
      if (shouldAddPoint) {
        updatedPath = [...currentPath, newPathPoint];
      }

      // Update record with new path data and last location info
      const updateData = {
        path_data: updatedPath,
        last_location_update: new Date().toISOString(),
        battery_level_at_check_in: request.batteryLevel
      };

      const { error: updateError } = await supabase
        .from('daily_attendance')
        .update(updateData)
        .eq('id', attendanceId);

      if (updateError) {
        console.error('Error updating location:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateLocationTracking:', error);
      return false;
    }
  }

  /**
   * Calculate work hours between check-in and check-out
   */
  private calculateWorkHours(checkInTime: Date, checkOutTime?: Date): number {
    const endTime = checkOutTime || new Date();
    const diffMs = endTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}


// Export singleton instance
export const attendanceService = new AttendanceService();

// Export standalone functions for easier importing
export const listAttendanceRecords = attendanceService.listAttendanceRecords.bind(attendanceService);
export const updateAttendanceVerification = attendanceService.updateAttendanceVerification.bind(attendanceService);