// JWT and Authentication Types
import { Database } from './supabase';
import { z } from 'zod';
import { BaseApiResponseSchema } from '../schemas/base';

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

// City-State assignment for regional assignments
export interface CityAssignment {
  city: string;
  state: string;
}

// API Request/Response types (not database types)
export interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
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
  search_field?: 'human_readable_user_id' | 'first_name' | 'last_name' | 'email' | 'phone';
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
  assigned_cities: z.array(z.object({
    city: z.string(),
    state: z.string(),
  })).optional(), // Make city assignment optional
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export const EmployeeFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Allow empty phone
    return /^[0-9]{10}$/.test(val); // Must be exactly 10 digits if provided
  }, 'Phone number must be exactly 10 digits if provided'),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  can_login: z.boolean(),
  assigned_cities: z.array(z.object({
    city: z.string(),
    state: z.string(),
  })).optional(), // Make city assignment optional
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  // Custom validation for password confirmation
  if (data.password && data.password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirm_password']
});

export type EmployeeFormData = z.infer<typeof EmployeeFormSchema>;

export const UpdateEmployeeRequestSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  employment_status: EmploymentStatusSchema.optional(),
  can_login: z.boolean().optional(),
  assigned_cities: z.array(z.object({
    city: z.string(),
    state: z.string(),
  })).optional(),
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
  primary_region: z.string().optional(),
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
      department: z.string().optional(),
      region: z.string().optional(),
      startDate: z.string().optional(),
      profilePhotoUrl: z.string().optional(),
      phone: z.string().optional(),
      primaryRegion: z.string().optional(),
      regionCode: z.string().optional(),
      assignedRegions: z.array(z.string()).optional(),
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
    employmentStatus: EmploymentStatusSchema,
    canLogin: z.boolean(),
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

