// Attendance and location tracking types for mobile app

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface LocationPath {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
  batteryLevel?: number;
}

export interface DailyAttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD format
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
  locationPath?: LocationPath[]; // Array of location points during work hours
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT';
  workHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceStatistics {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  averageWorkHours: number;
  overtimeHours: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface CheckInRequest {
  employeeId: string;
  location: LocationData;
  timestamp: Date;
  selfie?: string; // Base64 encoded image
}

export interface CheckOutRequest {
  employeeId: string;
  location: LocationData;
  timestamp: Date;
  selfie?: string; // Base64 encoded image
}

export interface AttendanceResponse {
  success: boolean;
  record?: DailyAttendanceRecord;
  error?: string;
  message?: string;
}

// GPS tracking settings
export interface LocationTrackingSettings {
  enabled: boolean;
  trackingInterval: number; // milliseconds
  movementThreshold: number; // meters
  onlyWhenCheckedIn: boolean;
  batteryOptimization: boolean;
}

// Attendance validation rules
export interface AttendanceValidationRules {
  maxWorkHours: number;
  minWorkHours: number;
  requiredAccuracy: number; // GPS accuracy in meters
  maxDistanceFromWorkplace: number; // meters
  allowedBreakDuration: number; // minutes
}