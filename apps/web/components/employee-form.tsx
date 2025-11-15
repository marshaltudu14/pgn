/**
 * Employee Form Component
 * Handles creation and editing of employee information
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
    .optional()
    .refine((val) => !val || val.length >= 8, 'Password must be at least 8 characters'),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Employee' : 'Create New Employee'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update information for ${employee?.firstName} ${employee?.lastName}`
              : 'Fill in the details to create a new employee account'
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="employment">Employment Details</TabsTrigger>
                <TabsTrigger value="regions">Regional Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              {...field}
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
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Enter phone number (optional)"
                              {...field}
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
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter password (min 8 characters)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Employment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {status.replace('_', ' ')}
                                    </Badge>
                                  </div>
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

                    <Separator />

                    <div className="text-sm text-muted-foreground">
                      <p><strong>User ID:</strong> {isEditing ? employee?.humanReadableUserId : 'Will be generated automatically'}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <Separator />

                    <FormField
                      control={form.control}
                      name="assigned_regions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Assigned Regions</FormLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {AVAILABLE_REGIONS.map((region) => {
                              const isChecked = (form.watch('assigned_regions') || []).includes(region.code);
                              return (
                                <div
                                  key={region.code}
                                  className="flex items-center space-x-2"
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
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {region.name}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Employee' : 'Create Employee'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}