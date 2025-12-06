/**
 * Employment Details Form Component
 * Handles employment status, login permissions, and related settings
 */

'use client';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { Building } from 'lucide-react';
import { EmploymentStatus, Employee, type EmployeeFormData } from '@pgn/shared';

const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

interface EmploymentDetailsFormProps {
  form: import('react-hook-form').UseFormReturn<EmployeeFormData>;
  isEditing: boolean;
  employee?: Employee | null;
}

export function EmploymentDetailsForm({ form, isEditing, employee }: EmploymentDetailsFormProps) {
  return (
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
              <Select onValueChange={field.onChange} value={field.value}>
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
  );
}