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

  // Get form values
  const selectedCities = form.watch('assigned_cities') || [];

  // Create flat list of city pairs for combobox
  const allCityPairs = useMemo(() => {
    if (!regions || !regions.length) return [];

    const pairs: Array<{id: string, city: string, state: string, display: string}> = [];

    regions.forEach((region, index) => {
      pairs.push({
        id: `${region.id}-${index}`, // Use region.id + index for uniqueness
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

  // Handle city selection
  const handleCitySelect = (city: string, state: string) => {
    const currentCities = [...selectedCities];
    const existingIndex = currentCities.findIndex(
      c => c.city === city && c.state === state
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      currentCities.splice(existingIndex, 1);
    } else {
      // Add if not selected
      currentCities.push({ city, state });
    }

    form.setValue('assigned_cities', currentCities, { shouldValidate: true, shouldDirty: true });

    // Close the popover after selection
    setOpenCity(false);
  };

  // Remove city
  const removeCity = (index: number) => {
    const currentCities = [...selectedCities];
    currentCities.splice(index, 1);
    form.setValue('assigned_cities', currentCities, { shouldValidate: true, shouldDirty: true });
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
          name="assigned_cities"
          render={({ field }) => (
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
                      onClick={() => field.onChange(selectedCities)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2">
                        {loading && regions.length === 0 ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading cities...</span>
                          </>
                        ) : selectedCities.length > 0 ? (
                          `${selectedCities.length} cit${selectedCities.length > 1 ? 'ies' : 'y'} selected`
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
                            const isSelected = selectedCities.some(
                              (c: { city: string; state: string }) => c.city === pair.city && c.state === pair.state
                            );

                            return (
                              <CommandItem
                                key={pair.id}
                                value={pair.display}
                                onSelect={() => handleCitySelect(pair.city, pair.state)}
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
              {selectedCities.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Selected Cities ({selectedCities.length})
                  </div>
                  <div className="border rounded-md p-3 bg-muted/20 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedCities.map((cityAssignment: { city: string; state: string }, index: number) => (
                        <div
                          key={`${cityAssignment.city}-${cityAssignment.state}-${index}`}
                          className="flex items-center justify-between p-2 rounded-md bg-background hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {cityAssignment.city}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {cityAssignment.state}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              removeCity(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {cityAssignment.city}, {cityAssignment.state}</span>
                          </Button>
                        </div>
                      ))}
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