/**
 * Main Employee Form Component
 * Orchestrates all sub-components for employee creation/editing
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import {
  Employee,
  EmploymentStatus,
  UpdateEmployeeRequest,
  CreateEmployeeRequest,
  CityAssignment,
} from '@pgn/shared';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import {
  Loader2,
  Save,
  X,
} from 'lucide-react';

// Import sub-components
import { PersonalInfoForm } from './employee-form/PersonalInfoForm';
import { EmploymentDetailsForm } from './employee-form/EmploymentDetailsForm';
import { RegionalAssignmentForm } from './employee-form/RegionalAssignmentForm';
import { AuditInfoForm } from './employee-form/AuditInfoForm';

// Enhanced form validation schema with comprehensive error messages
const employeeFormSchema = z.object({
  first_name: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => val.trim()),
  last_name: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .transform(val => val.trim()),
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .transform(val => val.toLowerCase().trim()),
  phone: z.string().optional()
    .refine((val) => !val || /^[\d\s-()]+$/.test(val), 'Phone number can only contain digits, spaces, hyphens, and parentheses')
    .transform(val => val ? val.replace(/\s+/g, ' ').trim() : val),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'], {
    message: 'Please select a valid employment status'
  }),
  can_login: z.boolean(),
  assigned_cities: z.array(z.object({
    city: z.string().min(1, 'City name is required'),
    state: z.string().min(1, 'State name is required')
  })).min(1, 'At least one city must be assigned'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .optional(), // Optional for editing, but we'll validate it manually for creation
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

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
  onCancel?: () => void;
}

export function EmployeeForm({ open, onOpenChange, employee, onSuccess, onCancel }: EmployeeFormProps) {
  const { createEmployee, updateEmployee } = useEmployeeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!employee;

  // Use a key to force re-rendering of form when editing different employees
  // This helps prevent hydration mismatches by ensuring clean state
  const formKey = isEditing ? employee?.id || 'edit' : 'create';

  const form = useForm<any>({
    // resolver: zodResolver(employeeFormSchema) as any,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: undefined,
      employment_status: 'ACTIVE',
      can_login: true,
      assigned_cities: [],
      password: undefined,
      confirm_password: undefined,
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || undefined,
        employment_status: employee.employment_status as EmploymentStatus,
        can_login: employee.can_login ?? true,
        assigned_cities: (employee.assigned_cities as unknown as CityAssignment[]) || [],
        password: undefined, // Don't pre-fill password
        confirm_password: undefined, // Don't pre-fill confirm password
      });
    } else if (!employee && open) {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: undefined,
        employment_status: 'ACTIVE',
        can_login: true,
        assigned_cities: [],
        password: undefined,
        confirm_password: undefined,
      });
    }
  }, [employee, open, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      // For new employees, password is required
      if (!isEditing && !data.password) {
        toast.error('Password is required for creating new employees');
        return;
      }

      // Clean phone number - remove formatting, keep digits only
      const cleanPhone = data.phone
        ? data.phone.replace(/\D/g, '').slice(-10) // Keep only last 10 digits
        : undefined;

      let result;

      if (isEditing && employee) {
        const updateData: UpdateEmployeeRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: cleanPhone,
          employment_status: data.employment_status,
          can_login: data.can_login,
          assigned_cities: data.assigned_cities,
        };

        result = await updateEmployee(employee.id, updateData);

        if (result.success) {
          toast.success('Employee updated successfully!');
          onOpenChange(false);
          onSuccess?.(result.data!);
        } else {
          toast.error(result.error || 'Failed to update employee');
        }
      } else {
        const createData: CreateEmployeeRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: cleanPhone,
          employment_status: data.employment_status,
          can_login: data.can_login,
          assigned_cities: data.assigned_cities,
          password: data.password!,
        };

        result = await createEmployee(createData);

        if (result.success) {
          toast.success('Employee created successfully!');
          onOpenChange(false);
          onSuccess?.(result.data!);
          form.reset();
        } else {
          toast.error(result.error || 'Failed to create employee');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error(`An error occurred while ${isEditing ? 'updating' : 'creating'} employee`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <Form {...form} key={formKey}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          {/* Desktop/Tablet View */}
          <div className="hidden lg:block space-y-8">
            <PersonalInfoForm form={form as any} isEditing={isEditing} />
            <EmploymentDetailsForm form={form as any} isEditing={isEditing} employee={employee} />
            <RegionalAssignmentForm form={form as any} />
            {isEditing && <AuditInfoForm employee={employee} />}
          </div>

          {/* Mobile View - Simplified */}
          <div className="lg:hidden space-y-4">
            <PersonalInfoForm form={form as any} isEditing={isEditing} />
            <EmploymentDetailsForm form={form as any} isEditing={isEditing} employee={employee} />
            <RegionalAssignmentForm form={form as any} />
            {isEditing && <AuditInfoForm employee={employee} />}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}