import { z } from 'zod';
import { EmploymentStatus } from '../types';

// Zod schemas for employee-related operations

// Base schema for create and edit
const BaseEmployeeSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']) as z.ZodType<EmploymentStatus>,
  can_login: z.boolean().default(true),
  assigned_regions: z.array(z.string().uuid()).optional(),
});

// Schema for creating new employees (password required)
export const CreateEmployeeSchema = BaseEmployeeSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Schema for editing employees (password optional)
export const EditEmployeeSchema = BaseEmployeeSchema.extend({
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  // If password is provided, confirm password must match
  if (data.password && data.password.length > 0) {
    return data.password === data.confirm_password;
  }
  // If no password, no validation needed
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirm_password"],
}).refine((data) => {
  // If password is provided, it must be at least 6 characters
  if (data.password && data.password.length > 0) {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: "Password must be at least 6 characters",
  path: ["password"],
});

// Keep the old schema for backward compatibility (used as default)
export const EmployeeFormSchema = CreateEmployeeSchema;

// Combine base schema with optional password fields
const EmployeeFormWithOptionalPassword = BaseEmployeeSchema.extend({
  password: z.string().optional(),
  confirm_password: z.string().optional(),
});

export type EmployeeFormData = z.infer<typeof EmployeeFormWithOptionalPassword>;

export const UpdateEmployeeRegionsSchema = z.object({
  region_ids: z.array(z.string().uuid()).min(1, 'At least one region ID is required'),
});

export const EmployeeIdParamSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
});

export const PasswordResetRequestSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const EmploymentStatusChangeSchema = z.object({
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  reason: z.string().optional(),
  changed_by: z.string().default('system'),
});