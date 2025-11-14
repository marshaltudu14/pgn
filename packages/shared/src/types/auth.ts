// JWT and Authentication Types
export type EmploymentStatus = 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';

export interface JWTPayload {
  sub: string; // Employee human readable ID (PGN-2024-0001)
  employeeId: string; // Internal employee UUID
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
  email?: string;
  userId?: string;
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
}