/**
 * Regional Assignment Form Component
 * Handles regional assignments for employees through the employee_regions junction table
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { MapPin, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { cn } from '@/lib/utils';
import { Database } from '@pgn/shared';
import { UseFormReturn } from 'react-hook-form';
import { EmployeeFormData } from '@pgn/shared';

interface RegionalAssignmentFormProps {
  form: UseFormReturn<EmployeeFormData>;
}

type Region = Database['public']['Tables']['regions']['Row'];

export function RegionalAssignmentForm({ form }: RegionalAssignmentFormProps) {
  const { regions, isLoading: loading, fetchRegions } = useRegionsStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get current assigned region IDs from form
  const currentAssignedRegionIds = form.watch('assigned_regions') || [];

  // Load all regions initially
  useEffect(() => {
    fetchRegions({ limit: 100, search: '' });
  }, [fetchRegions]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRegions({
        limit: 100,
        page: 1,
        search: searchQuery.trim(),
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchRegions]);

  // Filter regions based on search
  const filteredRegions = regions.filter(region =>
    region.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${region.city}, ${region.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get current assigned regions
  const currentAssignedRegions = currentAssignedRegionIds
    .map((id: string) => regions.find(r => r.id === id))
    .filter(Boolean) as Region[];

  const handleSelect = (regionId: string) => {
    const currentIds = form.getValues('assigned_regions') || [];
    const isAlreadyAssigned = currentIds.includes(regionId);

    let newIds: string[];
    if (isAlreadyAssigned) {
      // Remove if already assigned
      newIds = currentIds.filter((id: string) => id !== regionId);
    } else {
      // Add if not assigned
      newIds = [...currentIds, regionId];
    }

    form.setValue('assigned_regions', newIds, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  const removeRegion = (regionId: string) => {
    const currentIds = form.getValues('assigned_regions') || [];
    const newIds = currentIds.filter((id: string) => id !== regionId);
    form.setValue('assigned_regions', newIds, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  if (loading && regions.length === 0) {
    return (
      <div className="bg-white dark:bg-black border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Regional Assignment</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Regional Assignment</h2>
      </div>

      <div className="space-y-6">
        {/* Cities Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Assigned Cities</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between h-12"
                type="button"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  {loading && regions.length === 0 ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading cities...</span>
                    </>
                  ) : currentAssignedRegionIds.length > 0 ? (
                    `${currentAssignedRegionIds.length} cit${currentAssignedRegionIds.length > 1 ? 'ies' : 'y'} selected`
                  ) : (
                    "Select cities..."
                  )}
                </div>
                {!loading && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-full p-0 max-h-[400px]"
              align="start"
              style={{ width: 'var(--radix-popover-trigger-width)' }}
            >
              <Command>
                <CommandInput
                  placeholder="Search cities or states..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading cities...</span>
                    </div>
                  ) : filteredRegions.length === 0 ? (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-sm text-muted-foreground">
                        {searchQuery ? 'No cities found matching your search.' : 'No cities available'}
                      </span>
                    </div>
                  ) : (
                    <CommandGroup>
                      {filteredRegions.map((region) => {
                        const isAssigned = currentAssignedRegionIds.includes(region.id);

                        return (
                          <CommandItem
                            key={region.id}
                            value={`${region.city}, ${region.state}`}
                            onSelect={() => handleSelect(region.id)}
                          >
                            <div className={cn(
                              "mr-2 h-4 w-4 rounded-sm border border-primary",
                              isAssigned
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}>
                              {isAssigned && <Check className="h-3 w-3" />}
                            </div>
                            {region.city}, {region.state}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {currentAssignedRegions.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-foreground mb-2">
                Selected Cities ({currentAssignedRegions.length})
              </div>
              <div className="border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {currentAssignedRegions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{region.city}</span>
                        <span className="text-sm text-muted-foreground">{region.state}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          removeRegion(region.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {region.city}, {region.state}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}