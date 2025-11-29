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
import { MapPin, X, ChevronDown, Check } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const pageSize = 50; // Load 50 cities per page

  // Load regions data using the store with pagination
  useEffect(() => {
    const store = useRegionsStore.getState();
    store.fetchStates();

    // Initial load of regions with pagination
    loadRegions(1, '');
  }, []);

  // Load regions with pagination and search
  const loadRegions = async (page: number, query: string) => {
    setIsSearching(true);
    try {
      const store = useRegionsStore.getState();
      const filters = query ? { city: query } : {};
      await store.fetchRegions(filters, { page, limit: pageSize });
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadRegions(1, searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Get form values and memoize to prevent dependency changes
  const selectedCities = useMemo(() => form.watch('assigned_cities') || [], [form]);

  // Create flat list of city pairs for combobox
  const allCityPairs = useMemo(() => {
    if (!regions.data || !regions.data.length) return [];

    const pairs: Array<{id: string, city: string, state: string, display: string}> = [];

    regions.data.forEach((region, index) => {
      pairs.push({
        id: `city-${index}`,
        city: region.city,
        state: region.state,
        display: `${region.city}, ${region.state}`
      });
    });

    return pairs;
  }, [regions.data]);

  // Filter out already selected cities from the dropdown
  const availableCities = useMemo(() => {
    return allCityPairs.filter((pair: { city: string; state: string }) => {
      return !selectedCities.some((selected: { city: string; state: string }) =>
        selected.city === pair.city && selected.state === pair.state
      );
    });
  }, [allCityPairs, selectedCities]);

  // Load more cities for pagination
  const loadMoreCities = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadRegions(nextPage, searchQuery);
  };

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
  };

  // Handle scroll to load more cities
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    // When user reaches bottom and has more data, load more cities
    if (scrollPosition >= scrollHeight - 100 && regions.hasMore && !isSearching) {
      loadMoreCities();
    }
  };

  // Remove city
  const removeCity = (index: number) => {
    const currentCities = [...selectedCities];
    currentCities.splice(index, 1);
    form.setValue('assigned_cities', currentCities, { shouldValidate: true, shouldDirty: true });
  };

  
  if (loading) {
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
                <Popover open={openCity} onOpenChange={setOpenCity}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-12"
                      type="button"
                      onClick={() => field.onChange(selectedCities)}
                    >
                      {selectedCities.length > 0
                        ? `${selectedCities.length} cit${selectedCities.length > 1 ? 'ies' : 'y'} selected`
                        : "Select cities..."}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 max-h-[400px]" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                    <Command>
                      <CommandInput
                        placeholder="Search cities or states..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList onScroll={handleScroll}>
                        <CommandEmpty>
                          {searchQuery ? 'No cities found matching your search.' : 'No cities available.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {availableCities.map((pair) => {
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
                          {(regions.hasMore || isSearching) && (
                            <CommandItem disabled>
                              <div className="text-center text-muted-foreground text-sm py-2">
                                {isSearching ? 'Searching...' : 'Loading more cities...'}
                              </div>
                            </CommandItem>
                          )}
                        </CommandGroup>
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