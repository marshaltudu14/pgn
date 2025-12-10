/**
 * Regional Assignment Form Component
 * Handles regional assignments for employees with state and city selection
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
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
import { MapPin, ChevronDown, Check, Loader2 } from 'lucide-react';
import { type EmployeeFormData } from '@pgn/shared';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { cn } from '@/lib/utils';

interface RegionalAssignmentFormProps {
  form: import('react-hook-form').UseFormReturn<EmployeeFormData>;
}

export function RegionalAssignmentForm({ form }: RegionalAssignmentFormProps) {
  const { regions, isLoading: loading } = useRegionsStore();
  const [openCity, setOpenCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load all regions data once using the store with high limit
  useEffect(() => {
    const store = useRegionsStore.getState();
    store.fetchRegions({ limit: 1000 }); // Fetch all regions at once
  }, []);

  // Client-side filtering function
  const getFilteredRegions = useCallback((search: string, selectedIds: string[]) => {
    if (!regions || !regions.length) return [];

    let baseRegions = regions;

    // If there's a search query, filter regions
    if (search) {
      baseRegions = regions.filter(region =>
        region.city.toLowerCase().includes(search.toLowerCase()) ||
        region.state.toLowerCase().includes(search.toLowerCase()) ||
        `${region.city},${region.state}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Separate selected and unselected regions
    const selected = baseRegions.filter(region => selectedIds.includes(region.id));
    const unselected = baseRegions.filter(region => !selectedIds.includes(region.id));

    // Selected regions first, then unselected
    return [...selected, ...unselected];
  }, [regions]);

  // Only show skeleton when we have no data at all (true initial load)
  const showSkeleton = loading && regions.length === 0;

  if (showSkeleton) {
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
        {/* Regions Selection */}
        <FormField
          control={form.control}
          name="assigned_regions"
          render={({ field }) => {
            const selectedIds = field.value || [];
            const filteredRegions = getFilteredRegions(searchQuery, selectedIds);

            const handleRegionSelect = (regionId: string) => {
              const newSelectedIds = [...selectedIds];
              const isAlreadySelected = newSelectedIds.includes(regionId);

              if (isAlreadySelected) {
                // Remove if already selected
                const index = newSelectedIds.indexOf(regionId);
                newSelectedIds.splice(index, 1);
              } else {
                // Add if not selected
                newSelectedIds.push(regionId);
              }

              field.onChange(newSelectedIds);
            };

            return (
              <FormItem>
                <FormLabel>Assigned Regions</FormLabel>
                <FormControl>
                  <Popover
                    open={openCity}
                    onOpenChange={setOpenCity}
                  >
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
                              <span>Loading regions...</span>
                            </>
                          ) : selectedIds.length > 0 ? (
                            `${selectedIds.length} region${selectedIds.length > 1 ? 's' : ''} selected`
                          ) : (
                            "Select regions..."
                          )}
                        </div>
                        {!loading && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-full p-0 max-h-[400px]"
                      align="start"
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                      key="region-combobox-content" // Stable key to prevent remounting
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search cities or states..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          {loading && regions.length === 0 ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Loading regions...</span>
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>
                                {searchQuery ? 'No regions found matching your search.' : 'No regions available.'}
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredRegions.map((region) => {
                                  const isSelected = selectedIds.includes(region.id);

                                  return (
                                    <CommandItem
                                      key={region.id}
                                      value={`${region.city},${region.state}`}
                                      onSelect={() => handleRegionSelect(region.id)}
                                    >
                                      <div className={cn(
                                        "mr-2 h-4 w-4 rounded-sm border border-primary",
                                        isSelected
                                          ? "bg-primary text-primary-foreground"
                                          : "opacity-50 [&_svg]:invisible"
                                      )}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{region.city}</span>
                                        <span className="text-sm text-muted-foreground">,{region.state}</span>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}