/**
 * Regional Assignment Form Component
 * Handles regional assignments for employees with state and city selection
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { MapPin, X, ChevronDown, Check, Loader2 } from 'lucide-react';
import { type EmployeeFormData } from '@pgn/shared';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { cn } from '@/lib/utils';

interface RegionalAssignmentFormProps {
  form: import('react-hook-form').UseFormReturn<EmployeeFormData>;
}

export function RegionalAssignmentForm({ form }: RegionalAssignmentFormProps) {
  const { regions, isLoading: loading, fetchRegions, searchRegions } = useRegionsStore();
  const [openCity, setOpenCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load regions data using the store
  useEffect(() => {
    const store = useRegionsStore.getState();
    store.fetchStates();
    store.fetchRegions();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchRegions(searchQuery);
      } else {
        fetchRegions();
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchRegions, searchRegions]);

  // Get form values - assigned_regions is an array of region IDs (strings)
  const selectedRegionIds = (form.watch('assigned_regions') as string[]) || [];

  // Create flat list of city pairs for combobox
  const allCityPairs = useMemo(() => {
    if (!regions || !regions.length) return [];

    const pairs: Array<{id: string, city: string, state: string, display: string}> = [];

    regions.forEach((region) => {
      pairs.push({
        id: region.id, // Use region.id directly
        city: region.city,
        state: region.state,
        display: `${region.city}, ${region.state}`
      });
    });

    return pairs;
  }, [regions]);

  // All cities are available, but we'll mark the ones that are already selected
  const allAvailableCities = useMemo(() => {
    return allCityPairs;
  }, [allCityPairs]);

  // Handle city selection - toggle region ID selection
  const handleCitySelect = (city: string, state: string, regionId?: string) => {
    const currentRegions = [...selectedRegionIds];
    const targetRegionId = regionId || regions.find(r => r.city === city && r.state === state)?.id;

    if (!targetRegionId) {
      console.error(`Region ID not found for ${city}, ${state}`);
      return;
    }

    const existingIndex = currentRegions.indexOf(targetRegionId);

    if (existingIndex >= 0) {
      // Remove if already selected
      currentRegions.splice(existingIndex, 1);
    } else {
      // Add if not selected
      currentRegions.push(targetRegionId);
    }

    form.setValue('assigned_regions', currentRegions, { shouldValidate: true, shouldDirty: true });

    // Close the popover after selection
    setOpenCity(false);
  };

  // Remove region
  const removeRegion = (regionId: string) => {
    const currentRegions = [...selectedRegionIds];
    const index = currentRegions.indexOf(regionId);
    if (index >= 0) {
      currentRegions.splice(index, 1);
      form.setValue('assigned_regions', currentRegions, { shouldValidate: true, shouldDirty: true });
    }
  };

  
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
        {/* Cities Selection */}
        <FormField
          control={form.control}
          name="assigned_regions"
          render={({ field: _field }) => (
            <FormItem>
              <FormLabel>Assigned Cities</FormLabel>
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
                            <span>Loading cities...</span>
                          </>
                        ) : selectedRegionIds.length > 0 ? (
                          `${selectedRegionIds.length} cit${selectedRegionIds.length > 1 ? 'ies' : 'y'} selected`
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
                            <span className="text-sm text-muted-foreground">Loading cities...</span>
                          </div>
                        ) : (
                          <>
                            <CommandEmpty>
                              {searchQuery ? 'No cities found matching your search.' : 'No cities available.'}
                            </CommandEmpty>
                            <CommandGroup>
                          {allAvailableCities.map((pair) => {
                            const isSelected = selectedRegionIds.includes(pair.id);

                            return (
                              <CommandItem
                                key={pair.id}
                                value={pair.display}
                                onSelect={() => handleCitySelect(pair.city, pair.state, pair.id)}
                              >
                                <div className={cn(
                                  "mr-2 h-4 w-4 rounded-sm border border-primary",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}>
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                                {pair.display}
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
              {selectedRegionIds.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Selected Cities ({selectedRegionIds.length})
                  </div>
                  <div className="border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedRegionIds.map((regionId) => {
                        const region = regions.find(r => r.id === regionId);
                        if (!region) return null;

                        return (
                          <div
                            key={region.id}
                            className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {region.city}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {region.state}
                              </span>
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
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}