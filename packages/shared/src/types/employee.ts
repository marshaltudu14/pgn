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
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}