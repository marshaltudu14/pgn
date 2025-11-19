// JWT and Authentication Types
import { Database } from './supabase';

export type EmploymentStatus = 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';

export interface JWTPayload {
  sub: string; // Employee human readable ID (PGN-2024-0001)
  employeeId: string; // Internal employee UUID (now same as auth.users.id)
  employmentStatus: EmploymentStatus;
  canLogin: boolean;
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}

export interface TokenGenerateOptions {
  employeeId: string;
  humanReadableId: string; // PGN-2024-0001 format
  employmentStatus: EmploymentStatus;
  canLogin: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  employee: AuthenticatedUser;
}

export interface RefreshRequest {
  token: string;
}

export interface RefreshResponse {
  token: string;
}

export interface LogoutRequest {
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthErrorResponse {
  error: string;
  message: string;
  employmentStatus?: EmploymentStatus;
  retryAfter?: number;
}

export interface AuthenticatedUser {
  id: string;
  humanReadableId: string;
  fullName: string;
  email: string;
  employmentStatus: EmploymentStatus;
  canLogin: boolean;
  department?: string;
  region?: string;
  startDate?: string;
  profilePhotoUrl?: string;
  phone?: string;
  primaryRegion?: string;
  regionCode?: string;
  assignedRegions?: string[];
}

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

// City-District-State assignment for regional assignments
export interface CityAssignment {
  city: string;
  district: string;
  state: string;
}

// API Request/Response types (not database types)
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  assigned_cities?: CityAssignment[];
  password?: string;
}

export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  assigned_cities?: CityAssignment[];
}

export interface ChangeEmploymentStatusRequest {
  employment_status: EmploymentStatus;
  reason?: string;
  changed_by: string;
}

export interface RegionalAssignmentRequest {
  assigned_regions?: string[];
}

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

export interface EmployeeListResponse {
  employees: Database['public']['Tables']['employees']['Row'][];
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