// Employee-related types
import { EmploymentStatus } from './auth';

// Frontend-friendly camelCase interface for consistency across apps
export interface Employee {
  id: string;
  humanReadableUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employmentStatus: EmploymentStatus;
  canLogin: boolean;
  employmentStatusChangedAt?: Date;
  employmentStatusChangedBy?: string;
  faceEmbedding?: number[];
  referencePhotoUrl?: string;
  referencePhotoData?: ArrayBuffer;
  assignedRegions?: string[];
  primaryRegion?: string;
  regionCode?: string;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  deviceInfo?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Database-aligned snake_case interface for Supabase operations
export interface EmployeeDatabase {
  id: string;
  human_readable_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_status: EmploymentStatus;
  can_login: boolean;
  employment_status_changed_at?: Date;
  employment_status_changed_by?: string;
  face_embedding?: number[];
  reference_photo_url?: string;
  reference_photo_data?: ArrayBuffer;
  assigned_regions?: string[];
  primary_region?: string;
  region_code?: string;
  failed_login_attempts?: number;
  account_locked_until?: Date;
  device_info?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Employee creation payload
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  primary_region?: string;
  region_code?: string;
  assigned_regions?: string[];
  password?: string;
}

// Employee update payload
export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  primary_region?: string;
  region_code?: string;
  assigned_regions?: string[];
}

// Employment status change request
export interface ChangeEmploymentStatusRequest {
  employment_status: EmploymentStatus;
  reason?: string;
  changed_by: string;
}

// Regional assignment request
export interface RegionalAssignmentRequest {
  primary_region?: string;
  region_code?: string;
  assigned_regions?: string[];
}

// Employee list query parameters
export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  employment_status?: EmploymentStatus[];
  primary_region?: string;
  assigned_regions?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Employee list response
export interface EmployeeListResponse {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// User ID generation types
export interface UserIdSequence {
  year: number;
  last_sequence: number;
}

export interface GeneratedUserId {
  userId: string;
  sequence: number;
  year: number;
}