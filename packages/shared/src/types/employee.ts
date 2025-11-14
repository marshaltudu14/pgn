// Employee-related types
import { EmploymentStatus } from './auth';

export interface EmployeeData {
  id: string;
  human_readable_id: string;
  employment_status: EmploymentStatus;
  can_login: boolean;
  password_hash: string;
  full_name?: string;
  email?: string;
}

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