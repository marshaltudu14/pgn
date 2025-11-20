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
  address?: string;
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
  deviceInfo?: {
    batteryLevel?: number;
    platform?: string;
    version?: string;
    model?: string;
  };
  faceConfidence?: number;
}

export interface CheckOutRequest {
  employeeId: string;
  location: LocationData;
  timestamp: Date;
  selfie?: string; // Base64 encoded image
  method?: CheckOutMethod;
  reason?: string;
  deviceInfo?: {
    batteryLevel?: number;
    platform?: string;
    version?: string;
    model?: string;
  };
  faceConfidence?: number;
}

export interface AttendanceResponse {
  success: boolean;
  record?: DailyAttendanceRecord;
  error?: string;
  message?: string;
  timestamp?: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  workHours?: number;
  verificationStatus?: string;
  attendanceId?: string;
  status?: string;
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

// Mobile-specific attendance types
export type AttendanceStatus = 'CHECKED_IN' | 'CHECKED_OUT';
export type CheckOutMethod = 'MANUAL' | 'AUTOMATIC' | 'APP_CLOSED' | 'BATTERY_DRAIN' | 'FORCE_CLOSE';

export interface AttendanceStatusResponse {
  status: AttendanceStatus;
  checkInTime?: Date;
  checkOutTime?: Date;
  workHours?: number;
  employeeId?: string;
  totalDistance?: number;
  lastLocationUpdate?: Date;
  batteryLevel?: number;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';
  requiresCheckOut: boolean;
  date?: string;
  currentAttendanceId?: string;
}

export interface CheckInMobileRequest {
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
    address?: string;
  };
  selfie: string; // Base64 encoded image
  faceConfidence?: number;
  deviceInfo?: {
    batteryLevel?: number;
    platform?: string;
    version?: string;
    model?: string;
  };
}

export interface CheckOutMobileRequest {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
    address?: string;
  };
  lastLocationData?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
    address?: string;
  };
  selfie?: string; // Optional for emergency check-out
  faceConfidence?: number;
  deviceInfo?: {
    batteryLevel?: number;
    platform?: string;
    version?: string;
    model?: string;
  };
  method?: CheckOutMethod;
  reason?: string;
}

// Additional types needed by the services
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';

export interface EmergencyCheckOutRequest {
  employeeId: string;
  timestamp: Date;
  reason?: string;
  location?: LocationData;
  selfie?: string;
  method?: CheckOutMethod;
  lastLocationData?: LocationData;
  selfieData?: string;
  deviceInfo?: {
    batteryLevel?: number;
    platform?: string;
    version?: string;
    model?: string;
  };
}

export interface LocationUpdateRequest {
  employeeId: string;
  location: LocationData;
  timestamp: Date;
  batteryLevel?: number;
}