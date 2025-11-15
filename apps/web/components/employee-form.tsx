/**
 * Employee Form Component
 * Handles creation and editing of employee information
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Employee, EmploymentStatus, CreateEmployeeRequest, UpdateEmployeeRequest } from '@pgn/shared';
import { useEmployeeStore } from '@/app/lib/stores/employeeStore';
import { Loader2, Save, X } from 'lucide-react';

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

// Sample regions - would come from config or API
const AVAILABLE_REGIONS = [
  { code: 'NORTH', name: 'North Region' },
  { code: 'SOUTH', name: 'South Region' },
  { code: 'EAST', name: 'East Region' },
  { code: 'WEST', name: 'West Region' },
  { code: 'CENTRAL', name: 'Central Region' },
];

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
    .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), 'Invalid phone number format'),
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  can_login: z.boolean(),
  primary_region: z.string().optional(),
  region_code: z.string().optional(),
  assigned_regions: z.array(z.string()).default([]),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .optional(), // Optional for editing, but we'll validate it manually for creation
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess?: (employee: Employee) => void;
  onCancel?: () => void;
  // Note: asDialog prop removed since form is always rendered as a page now
}

export function EmployeeForm({ open, onOpenChange, employee, onSuccess, onCancel }: EmployeeFormProps) {
  const { createEmployee, updateEmployee } = useEmployeeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!employee;

  const form = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      employment_status: 'ACTIVE',
      can_login: true,
      primary_region: '',
      region_code: '',
      assigned_regions: [],
      password: '',
    },
  });

  useEffect(() => {
    if (employee && open) {
      form.reset({
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email,
        phone: employee.phone || '',
        employment_status: employee.employmentStatus,
        can_login: employee.canLogin,
        primary_region: employee.primaryRegion || '',
        region_code: employee.regionCode || '',
        assigned_regions: employee.assignedRegions || [],
        password: '', // Don't pre-fill password
      });
    } else if (!employee && open) {
      form.reset();
    }
  }, [employee, open, form]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);
      setError(null);

      // For new employees, password is required
      if (!isEditing && !data.password) {
        setError('Password is required for creating new employees');
        return;
      }

      let result;

      if (isEditing && employee) {
        const updateData: UpdateEmployeeRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          employment_status: data.employment_status,
          can_login: data.can_login,
          primary_region: data.primary_region,
          region_code: data.region_code,
          assigned_regions: data.assigned_regions,
        };

        result = await updateEmployee(employee.id, updateData);
      } else {
        const createData: CreateEmployeeRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          employment_status: data.employment_status,
          can_login: data.can_login,
          primary_region: data.primary_region,
          region_code: data.region_code,
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

  const handleAssignedRegionToggle = (regionCode: string, checked: boolean) => {
    const currentRegions = form.getValues('assigned_regions') || [];
    const newRegions = checked
      ? [...currentRegions, regionCode]
      : currentRegions.filter(code => code !== regionCode);
    form.setValue('assigned_regions', newRegions);
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-4xl mx-auto space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="border-l-4 border-[hsl(var(--primary))] pl-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Basic employee details</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          {...field}
                          className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          {...field}
                          className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                        className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter phone number (optional)"
                        {...field}
                        className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Password *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter password (min 6 characters)"
                          {...field}
                          className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          {/* Employment Details Section */}
          <div className="space-y-4">
            <div className="border-l-4 border-[hsl(var(--primary))] pl-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Employment Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Work status and access permissions</p>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="employment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Employment Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]">
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_login"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Can Login</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow this employee to access the system
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">User ID:</span> {isEditing ? employee?.humanReadableUserId : 'Will be generated automatically'}
                </p>
              </div>
            </div>
          </div>

          {/* Regional Assignment Section */}
          <div className="space-y-4">
            <div className="border-l-4 border-[hsl(var(--primary))] pl-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Regional Assignment</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Regional work locations</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primary_region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Region</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]">
                            <SelectValue placeholder="Select primary region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_REGIONS.map((region) => (
                            <SelectItem key={region.code} value={region.name}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="region_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Region Code</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]">
                            <SelectValue placeholder="Select region code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_REGIONS.map((region) => (
                            <SelectItem key={region.code} value={region.code}>
                              {region.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="assigned_regions"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Regions</FormLabel>
                    <div className="space-y-3">
                      {AVAILABLE_REGIONS.map((region) => {
                        const isChecked = (form.watch('assigned_regions') || []).includes(region.code);
                        return (
                          <div
                            key={region.code}
                            className="flex items-center space-x-3 rounded-lg border border-gray-200 dark:border-gray-600 p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Checkbox
                              id={`region-${region.code}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleAssignedRegionToggle(region.code, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`region-${region.code}`}
                              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                            >
                              {region.name}
                            </label>
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {region.code}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
              className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
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