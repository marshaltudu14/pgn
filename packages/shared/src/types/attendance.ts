// Attendance and location tracking types for mobile app
import { z } from 'zod';
import { BaseApiResponseSchema } from '../schemas/base';

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

export interface PathData {
  latitude: number;
  longitude: number;
  accuracy: number;
  batteryLevel: number;
  timestamp: string;
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
  humanReadableEmployeeId?: string; // PGN-YYYY-NNNN format
  employeeName?: string; // First + Last name
  date: string; // YYYY-MM-DD format
  checkInTime?: Date;
  checkOutTime?: Date;
  checkInLocation?: LocationData;
  checkOutLocation?: LocationData;
  checkInSelfieUrl?: string; // Supabase storage URL for check-in selfie
  checkOutSelfieUrl?: string; // Supabase storage URL for check-out selfie
  locationPath?: LocationPath[]; // Array of location points during work hours
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'ABSENT';
  verificationStatus?: VerificationStatus;
  workHours?: number;
  notes?: string;
  device?: string; // Device model used for check-in (e.g., Samsung Galaxy S23)
  lastLocationUpdate?: Date;
  batteryLevelAtCheckIn?: number;
  batteryLevelAtCheckOut?: number;
  totalDistance?: number; // Total distance in meters
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
}

export interface CheckOutRequest {
  employeeId: string;
  attendanceId?: string; // Optional attendanceId for specific record checkout
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

// Export inferred types for compile-time type checking from Zod schemas
export type CheckInMobileRequest = z.infer<typeof CheckInMobileRequestSchema>;
export type CheckOutMobileRequest = z.infer<typeof CheckOutMobileRequestSchema>;

// Additional types needed by the services
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FLAGGED';

export interface EmergencyAttendanceData {
  attendanceId?: string;
  employeeId?: string;
  employeeName?: string;
  trackingActive: boolean;
  lastStoredTime: number; // Timestamp of last storage
  consecutiveFailures: number;
  wasOnline?: boolean; // Track if service was online when stored (for crash vs outage detection)
  offlineStartTime?: number; // Timestamp when internet connection was lost
  location: {
    timestamp: number;
    coordinates: [number, number]; // [latitude, longitude]
    batteryLevel: number;
    accuracy: number;
  }
}

export interface EmergencyCheckOutRequest {
  employeeId: string;
  attendanceId?: string; // Optional attendanceId for specific record checkout
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
  employeeId?: string;
  location: LocationData;
  timestamp: Date;
  batteryLevel?: number;
}

// Additional types needed by the web dashboard
export interface AttendanceListParams {
  page?: number;
  limit?: number;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  verificationStatus?: VerificationStatus;
  employeeId?: string;
  search?: string;
  search_field?: 'first_name' | 'last_name' | 'employee_id';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceListResponse {
  records: DailyAttendanceRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UpdateVerificationRequest {
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
}

// Zod schemas for API validation
export const VerificationStatusSchema = z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED']);

export const AttendanceStatusSchema = z.enum(['CHECKED_IN', 'CHECKED_OUT', 'ABSENT']);

export const CheckOutMethodSchema = z.enum(['MANUAL', 'AUTOMATIC', 'APP_CLOSED', 'BATTERY_DRAIN', 'FORCE_CLOSE']);

export const LocationDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  timestamp: z.union([z.date(), z.string().datetime(), z.number()]),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  address: z.string().optional(),
});

export const DeviceInfoSchema = z.object({
  batteryLevel: z.number().min(0).max(100).optional(),
  platform: z.string().optional(),
  version: z.string().optional(),
  model: z.string().optional(),
});

export const CheckInMobileRequestSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.number().optional().describe('Unix timestamp in milliseconds. Required for accurate location tracking.'),
    address: z.string().optional(),
  }),
  selfie: z.string().min(1, 'Selfie is required'),
  deviceInfo: DeviceInfoSchema.optional(),
});

export const CheckOutMobileRequestSchema = z.object({
  attendanceId: z.string().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  lastLocationData: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  selfie: z.string().optional(),
  deviceInfo: DeviceInfoSchema.optional(),
  method: CheckOutMethodSchema.optional(),
  reason: z.string().optional(),
});

export const LocationUpdateRequestSchema = z.object({
  location: LocationDataSchema,
  batteryLevel: z.number().min(0).max(100).optional(),
});

export const AttendanceListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: AttendanceStatusSchema.optional(),
  verificationStatus: VerificationStatusSchema.optional(),
  employeeId: z.string().optional(),
  search: z.string().optional(),
  search_field: z.enum(['first_name', 'last_name', 'employee_id']).optional(),
  sortBy: z.string().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UpdateVerificationRequestSchema = z.object({
  verificationStatus: VerificationStatusSchema,
  verificationNotes: z.string().optional(),
});


export const CheckInResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
    attendanceId: z.string(),
    checkInTime: z.string(),
    status: AttendanceStatusSchema,
    verificationStatus: VerificationStatusSchema,
    workHours: z.number().optional(),
  }),
});

export const CheckOutResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
    attendanceId: z.string(),
    checkOutTime: z.string(),
    status: AttendanceStatusSchema,
    workHours: z.number(),
    verificationStatus: VerificationStatusSchema,
  }),
});

// Export inferred types for compile-time type checking
export type CheckInResponse = z.infer<typeof CheckInResponseSchema>;
export type CheckOutResponse = z.infer<typeof CheckOutResponseSchema>;
export type CheckInResponseData = z.infer<typeof CheckInResponseSchema>['data'];
export type CheckOutResponseData = z.infer<typeof CheckOutResponseSchema>['data'];

export const AttendanceStatusResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    status: AttendanceStatusSchema,
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    workHours: z.number().optional(),
    employeeId: z.string().optional(),
    totalDistance: z.number().optional(),
    lastLocationUpdate: z.string().optional(),
    batteryLevel: z.number().min(0).max(100).optional(),
    verificationStatus: VerificationStatusSchema.optional(),
    requiresCheckOut: z.boolean(),
    date: z.string().optional(),
    currentAttendanceId: z.string().optional(),
  }),
});

export const LocationUpdateResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export const AttendanceListResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    records: z.array(z.any()), // Will be typed as DailyAttendanceRecord[] at runtime
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasMore: z.boolean(),
  }),
});

export const UpdateVerificationResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
    record: z.any(), // Will be typed as DailyAttendanceRecord at runtime
  }),
});