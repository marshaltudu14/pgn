/**
 * Main Employee Form Component
 * Orchestrates all sub-components for employee creation/editing
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

import {
  EmployeeFormSchema,
  type EmployeeFormData,
} from '@pgn/shared';

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

  const form = useForm<EmployeeFormData>({
    // resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employment_status: 'ACTIVE',
      can_login: true,
      assigned_cities: [],
      password: '',
      confirm_password: '',
    },
    mode: 'onBlur', // Validate on blur for better UX
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        employment_status: employee.employment_status as EmploymentStatus,
        can_login: employee.can_login ?? true,
        assigned_cities: (employee.assigned_cities as unknown as CityAssignment[]) || [],
        password: '', // Don't pre-fill password
        confirm_password: '', // Don't pre-fill confirm password
      });
    } else if (!employee && open) {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        employment_status: 'ACTIVE',
        can_login: true,
        assigned_cities: [],
        password: '',
        confirm_password: '',
      });
    }
  }, [employee, open, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Clean phone number - remove formatting, keep digits only
      const cleanPhone = data.phone
        ? data.phone.replace(/\D/g, '').slice(-10) // Keep only last 10 digits
        : '';

      // For validation, if phone is empty after cleaning, don't include it in validation
      // since EmployeeFormSchema now allows optional phone
      const dataForValidation = {
        ...data,
        phone: cleanPhone || undefined,
      };

      // For editing, create a modified schema that doesn't require password
      const schemaForValidation = isEditing ?
        EmployeeFormSchema.omit({ password: true, confirm_password: true }) :
        EmployeeFormSchema;

      // Manual validation with Zod
      const validationResult = schemaForValidation.safeParse(dataForValidation);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(err => err.message).join(', ');
        toast.error('Validation failed: ' + errorMessages);
        return;
      }

      // For new employees, password is required
      if (!isEditing && !data.password) {
        toast.error('Password is required for creating new employees');
        return;
      }

      // For editing, if password is provided, validate it separately
      if (isEditing && data.password && data.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

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
            <PersonalInfoForm form={form} isEditing={isEditing} />
            <EmploymentDetailsForm form={form} isEditing={isEditing} employee={employee} />
            <RegionalAssignmentForm form={form} />
            {isEditing && <AuditInfoForm employee={employee} />}
          </div>

          {/* Mobile View - Simplified */}
          <div className="lg:hidden space-y-4">
            <PersonalInfoForm form={form} isEditing={isEditing} />
            <EmploymentDetailsForm form={form} isEditing={isEditing} employee={employee} />
            <RegionalAssignmentForm form={form} />
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