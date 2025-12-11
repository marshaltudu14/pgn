// JWT and Authentication Types
import { Database } from './supabase';
import { z } from 'zod';
import { BaseApiResponseSchema } from '../schemas/base';

export type EmploymentStatus = 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';

export interface CityAssignment {
  city: string;
  state: string;
}

export interface RegionAssignment {
  id: string;
  city: string;
  state: string;
  label: string;
}

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
  refreshToken: string;
  expiresIn: number;
  employee: AuthenticatedUser;
}

export interface RefreshRequest {
  token: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  token: string;
}

export interface LogoutResponse {
  message: string;
}

// Authentication error codes for consistent error handling
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_SUSPENDED'
  | 'EMPLOYMENT_ENDED'
  | 'EMPLOYMENT_TERMINATED'
  | 'EMPLOYMENT_ON_LEAVE'
  | 'ACCOUNT_ACCESS_DENIED'
  | 'EMAIL_NOT_CONFIRMED'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'TOKEN_EXPIRED'
  | 'ACCESS_DENIED';

export interface AuthErrorResponse {
  error: string;
  message: string;
  code: AuthErrorCode;
  employmentStatus?: EmploymentStatus;
  retryAfter?: number;
}

export interface AuthenticatedUser {
  id: string;
  humanReadableId: string;
  firstName: string;
  lastName: string;
  email: string;
  employmentStatus: EmploymentStatus;
  canLogin: boolean;
  phone?: string;
  assignedCities?: RegionAssignment[];
  employmentStatusChangedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

// City-State assignment for regional assignments

// API Request/Response types (not database types)
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  assigned_regions?: string[];
  password?: string;
}

export interface UpdateEmployeeRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  employment_status?: EmploymentStatus;
  can_login?: boolean;
  assigned_regions?: string[];
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
  search_field?: 'human_readable_user_id' | 'first_name' | 'last_name' | 'email' | 'phone';
  employment_status?: EmploymentStatus[];
  assigned_regions?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export type EmployeeRow = Database['public']['Tables']['employees']['Row'];

export interface EmployeeWithRegions extends EmployeeRow {
  assigned_regions?: {
    regions: Array<{
      id: string;
      city: string;
      state: string;
    }>;
    total_count: number;
  };
  regions?: Array<{
    id: string;
    city: string;
    state: string;
  }>;
}

// Type for joined employee_regions query result
export interface EmployeeRegionWithDetails {
  region_id: string;
  regions: {
    id: string;
    city: string;
    state: string;
  }[];
}

export interface EmployeeListResponse {
  employees: EmployeeWithRegions[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EmployeeFilters {
  search: string;
  searchField: 'human_readable_user_id' | 'first_name' | 'last_name' | 'email' | 'phone';
  status: EmploymentStatus | 'all';
  assigned_regions?: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
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

// Zod schemas for API validation
export const EmploymentStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']);

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const LogoutRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const CreateEmployeeRequestSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  employment_status: EmploymentStatusSchema.default('ACTIVE'),
  can_login: z.boolean().default(true),
  assigned_regions: z.array(z.string().uuid()).optional(), // Array of region IDs
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// Import EmployeeFormSchema from schemas
export { EmployeeFormSchema, type EmployeeFormData } from '../schemas/employee.schema';

export const UpdateEmployeeRequestSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  employment_status: EmploymentStatusSchema.optional(),
  can_login: z.boolean().optional(),
});

export const ChangeEmploymentStatusRequestSchema = z.object({
  employment_status: EmploymentStatusSchema,
  reason: z.string().optional(),
  changed_by: z.string(),
});

export const EmployeeListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  search_field: z.enum(['human_readable_user_id', 'first_name', 'last_name', 'email', 'phone']).optional(),
  employment_status: z.array(EmploymentStatusSchema).optional(),
  assigned_regions: z.array(z.string()).optional(),
  sort_by: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const LoginResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
    employee: z.object({
      id: z.string(),
      humanReadableId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      employmentStatus: EmploymentStatusSchema,
      canLogin: z.boolean(),
      phone: z.string().optional(),
      assignedCities: z.array(z.string()).optional(),
      employmentStatusChangedAt: z.string().optional(),
      createdAt: z.string().optional(),
      updatedAt: z.string().optional(),
    }),
  }),
});

export const RefreshResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    token: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
});

export const LogoutResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export const UserResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    humanReadableId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    employmentStatus: EmploymentStatusSchema,
    canLogin: z.boolean(),
    assignedCities: z.array(z.any()).optional(), // Allow any format since backend returns objects
    employmentStatusChangedAt: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
});

export const AdminLogoutResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export const AuthErrorResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(false),
  error: z.string(),
  code: z.enum([
    'INVALID_CREDENTIALS',
    'ACCOUNT_NOT_FOUND',
    'ACCOUNT_SUSPENDED',
    'EMPLOYMENT_ENDED',
    'EMPLOYMENT_TERMINATED',
    'EMPLOYMENT_ON_LEAVE',
    'ACCOUNT_ACCESS_DENIED',
    'EMAIL_NOT_CONFIRMED',
    'RATE_LIMITED',
    'VALIDATION_ERROR',
    'SERVER_ERROR',
    'NETWORK_ERROR',
    'SESSION_EXPIRED',
    'TOKEN_EXPIRED',
    'ACCESS_DENIED',
  ]).optional(),
  employmentStatus: EmploymentStatusSchema.optional(),
  retryAfter: z.number().optional(),
});

