/**
 * Main Employee Form Component
 * Orchestrates all sub-components for employee creation/editing
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
} from '@/components/ui/form';
import {
  Employee,
  EmploymentStatus,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from '@pgn/shared';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import { useFaceRecognitionStore } from '@/app/lib/stores/faceRecognitionStore';
import {
  Loader2,
  Save,
  X,
} from 'lucide-react';

// Import sub-components
import { PersonalInfoForm } from './employee-form/PersonalInfoForm';
import { EmploymentDetailsForm } from './employee-form/EmploymentDetailsForm';
import { RegionalAssignmentForm } from './employee-form/RegionalAssignmentForm';
import { FaceRecognitionForm } from './employee-form/FaceRecognitionForm';
import { AuditInfoForm } from './employee-form/AuditInfoForm';

// Form validation schema
const employeeFormSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^[\d\s-()]+$/.test(val), 'Invalid phone number format'),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  can_login: z.boolean(),
  assigned_regions: z.array(z.string()),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .optional(), // Optional for editing, but we'll validate it manually for creation
  confirm_password: z.string().optional(),
});

type EmployeeFormDataType = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
  onCancel?: () => void;
}

export function EmployeeForm({ open, onOpenChange, employee, onSuccess, onCancel }: EmployeeFormProps) {
  const { createEmployee, updateEmployee } = useEmployeeStore();
  const {
    generateEmbedding
  } = useFaceRecognitionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!employee;

  // Enhanced features state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);

  // Use a key to force re-rendering of form when editing different employees
  // This helps prevent hydration mismatches by ensuring clean state
  const formKey = isEditing ? employee?.id || 'edit' : 'create';

  const form = useForm<EmployeeFormDataType>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employment_status: 'ACTIVE',
      can_login: true,
      assigned_regions: [],
      password: '',
      confirm_password: '',
    },
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
        assigned_regions: employee.assigned_regions || [],
        password: '', // Don't pre-fill password
        confirm_password: '', // Don't pre-fill confirm password
      });
    } else if (!employee && open) {
      form.reset();
    }
  }, [employee, open, form]);

  const onSubmit = async (data: EmployeeFormDataType) => {
    try {
      setLoading(true);
      setError(null);

      // For new employees, password is required
      if (!isEditing && !data.password) {
        setError('Password is required for creating new employees');
        return;
      }

      // Validate password match
      if (data.password && data.password !== data.confirm_password) {
        setError('Passwords do not match');
        return;
      }

      // Clean phone number - remove +91 prefix, spaces, hyphens, parentheses, ensure 10 digits
      const cleanPhone = data.phone
        ? data.phone.replace(/^[\+91]|[\s\-\(\)]/g, '').replace(/^91/, '').slice(0, 10).padEnd(10, '0')
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
          assigned_regions: data.assigned_regions,
        };

        result = await updateEmployee(employee.id, updateData);
      } else {
        const createData: CreateEmployeeRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: cleanPhone,
          employment_status: data.employment_status,
          can_login: data.can_login,
          assigned_regions: data.assigned_regions,
          password: data.password, // Password only required for creation
        };

        result = await createEmployee(createData);
      }

      if (result.success) {
        onOpenChange(false);
        onSuccess?.(result.data!);
        form.reset();
      } else {
        setError(result.error || `Failed to ${isEditing ? 'update' : 'create'} employee`);
      }
    } catch (err) {
      setError(`An error occurred while ${isEditing ? 'updating' : 'creating'} employee`);
      console.error('Error submitting form:', err);
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handlers with client-side embedding generation
  const handlePhotoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Photo must be less than 5MB');
        return;
      }

      setPhotoUploadLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        setPhotoPreview(e.target?.result as string);

        // Generate face embedding client-side using Zustand store
        try {
          const result = await generateEmbedding(file, employee?.id);

          if (result.success && result.embedding) {
            // Store embedding for form submission
              handleEmbeddingGenerated();

            // Show processing time for user feedback
            const resultWithPerformance = result as { performance?: { totalTime?: number } };
            if (resultWithPerformance.performance?.totalTime) {
              }
          } else if (result.error) {
            setError(result.error);
          }
        } catch (error) {
          console.error('Error generating face embedding:', error);
          setError('Failed to generate face recognition embedding');
        } finally {
          setPhotoUploadLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setPhotoPreview(null);
  };

  const handleEmbeddingGenerated = () => {
    // Store embedding for form submission
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
            <FaceRecognitionForm
              employee={employee}
              onPhotoSelect={handlePhotoSelect}
              onPhotoRemove={handlePhotoRemove}
              photoPreview={photoPreview}
              photoUploadLoading={photoUploadLoading}
              onEmbeddingGenerated={handleEmbeddingGenerated}
            />
            <PersonalInfoForm form={form} isEditing={isEditing} />
            <EmploymentDetailsForm form={form} isEditing={isEditing} employee={employee} />
            <RegionalAssignmentForm form={form} />
            {isEditing && <AuditInfoForm employee={employee} />}
          </div>

          {/* Mobile View - Simplified */}
          <div className="lg:hidden space-y-4">
            <div className="text-sm text-muted-foreground">
              Mobile view components will be implemented here
            </div>
            <FaceRecognitionForm
              employee={employee}
              onPhotoSelect={handlePhotoSelect}
              onPhotoRemove={handlePhotoRemove}
              photoPreview={photoPreview}
              photoUploadLoading={photoUploadLoading}
              onEmbeddingGenerated={handleEmbeddingGenerated}
            />
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