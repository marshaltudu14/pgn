/**
 * Regional Assignment Form Component
 * Handles regional assignments for employees
 */

'use client';

import { useForm } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin } from 'lucide-react';
import { EmployeeFormData } from './types';

// Sample regions - would come from config or API
const AVAILABLE_REGIONS = [
  { code: 'NORTH', name: 'North Region' },
  { code: 'SOUTH', name: 'South Region' },
  { code: 'EAST', name: 'East Region' },
  { code: 'WEST', name: 'West Region' },
  { code: 'CENTRAL', name: 'Central Region' },
];

interface RegionalAssignmentFormProps {
  form: ReturnType<typeof useForm<EmployeeFormData>>;
}

export function RegionalAssignmentForm({ form }: RegionalAssignmentFormProps) {
  const handleAssignedRegionToggle = (regionCode: string, checked: boolean) => {
    const currentRegions = form.getValues('assigned_regions') || [];
    const newRegions = checked
      ? [...currentRegions, regionCode]
      : currentRegions.filter(code => code !== regionCode);
    form.setValue('assigned_regions', newRegions);
  };

  return (
    <div className="bg-white dark:bg-black border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Regional Assignment</h2>
      </div>

      <FormField
        control={form.control}
        name="assigned_regions"
        render={() => (
          <FormItem>
            <FormLabel>Assigned Regions</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_REGIONS.map((region) => {
                const isChecked = (form.watch('assigned_regions') || []).includes(region.code);
                return (
                  <div
                    key={region.code}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
  );
}