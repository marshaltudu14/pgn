import { z } from 'zod';
import { EmploymentStatus } from '../types';

// Zod schemas for employee-related operations

export const EmployeeFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']) as z.ZodType<EmploymentStatus>,
  can_login: z.boolean().default(true),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm password is required'),
  assigned_regions: z.array(z.string().uuid()).optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export type EmployeeFormData = z.infer<typeof EmployeeFormSchema>;

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