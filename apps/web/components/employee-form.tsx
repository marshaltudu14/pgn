/**
 * Employee Form Component
 * Handles creation and editing of employee information with responsive design
 * Mobile: List-style layout
 * Desktop/Tablet: Grid layout
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
import { Loader2, Save, User, Building, MapPin, Shield, X } from 'lucide-react';

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
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        phone: employee.phone || '',
        employment_status: employee.employment_status as EmploymentStatus,
        can_login: employee.can_login ?? true,
        primary_region: employee.primary_region || '',
        region_code: employee.region_code || '',
        assigned_regions: employee.assigned_regions || [],
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
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <p className="text-red-800 dark:text-red-200 text-sm font-medium">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
          {/* Desktop/Tablet View - Grid Layout */}
          <div className="hidden lg:block space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white dark:bg-black border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
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
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter phone number (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password (min 6 characters)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Employment Details Section */}
            <div className="bg-white dark:bg-black border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Employment Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employment_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Can Login</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allow this employee to access the system
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {isEditing && (
                <div className="mt-4 p-4 bg-muted/30 border-l-4 border-border">
                  <p className="text-sm">
                    <span className="font-medium">User ID:</span> {employee?.human_readable_user_id}
                  </p>
                </div>
              )}
            </div>

            {/* Regional Assignment Section */}
            <div className="bg-white dark:bg-black border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Regional Assignment</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primary_region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Region</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel>Region Code</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
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
                      <FormLabel>Assigned Regions</FormLabel>
                      <div className="space-y-2">
                        {AVAILABLE_REGIONS.map((region) => {
                          const isChecked = (form.watch('assigned_regions') || []).includes(region.code);
                          return (
                            <div
                              key={region.code}
                              className="flex items-center space-x-3 p-3 border rounded-lg"
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
                                className="text-sm font-medium cursor-pointer flex-1"
                              >
                                {region.name}
                              </label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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
          </div>

          {/* Mobile View - List Layout */}
          <div className="lg:hidden space-y-1">
            {/* Personal Information Header */}
            <div className="bg-white dark:bg-black border-b border-t p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Personal Information</h3>
              </div>
            </div>

            {/* Personal Information Fields */}
            <div className="bg-white dark:bg-black divide-y divide-border">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number (optional)" {...field} />
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
                    <FormItem className="px-4 py-3">
                      <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password (min 6 characters)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Employment Details Header */}
            <div className="bg-white dark:bg-black border-b border-t p-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Employment Details</h3>
              </div>
            </div>

            {/* Employment Details Fields */}
            <div className="bg-white dark:bg-black divide-y divide-border">
              <FormField
                control={form.control}
                name="employment_status"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                  <FormItem className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <FormLabel className="text-sm font-medium">Can Login</FormLabel>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <div className="px-4 py-3 bg-muted/20 border-t border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">User ID:</span>
                    <span className="text-sm font-medium">{employee?.human_readable_user_id}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Regional Assignment Header */}
            <div className="bg-white dark:bg-black border-b border-t p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Regional Assignment</h3>
              </div>
            </div>

            {/* Regional Assignment Fields */}
            <div className="bg-white dark:bg-black divide-y divide-border">
              <FormField
                control={form.control}
                name="primary_region"
                render={({ field }) => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primary Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
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
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Region Code</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="assigned_regions"
                render={() => (
                  <FormItem className="px-4 py-3">
                    <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Regions</FormLabel>
                    <div className="space-y-3 mt-3">
                      {AVAILABLE_REGIONS.map((region) => {
                        const isChecked = (form.watch('assigned_regions') || []).includes(region.code);
                        return (
                          <div
                            key={region.code}
                            className="flex items-center justify-between py-2 border-b border-border"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`mobile-region-${region.code}`}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleAssignedRegionToggle(region.code, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`mobile-region-${region.code}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {region.name}
                              </label>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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
          <div className="bg-white dark:bg-black border-t border-b p-4 lg:hidden">
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onCancel?.();
                  onOpenChange(false);
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>

  {/* Desktop Action Buttons */}
          <div className="hidden lg:flex justify-end gap-3 pt-6">
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