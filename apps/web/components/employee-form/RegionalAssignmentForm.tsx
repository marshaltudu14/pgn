/**
 * Regional Assignment Form Component
 * Handles regional assignments for employees with state, district, and city selection
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { MapPin, X, ChevronDown, Check } from 'lucide-react';
import { EmployeeFormData } from './types';
import { RegionsData } from '@pgn/shared';
import { cn } from '@/lib/utils';

interface RegionalAssignmentFormProps {
  form: ReturnType<typeof useForm<EmployeeFormData>>;
}

export function RegionalAssignmentForm({ form }: RegionalAssignmentFormProps) {
  const [regionsData, setRegionsData] = useState<RegionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openCity, setOpenCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(100);

  // Load regions data
  useEffect(() => {
    const loadRegionsData = async () => {
      try {
        const response = await fetch('/regions_data.json');
        const data = await response.json();
        setRegionsData(data);
      } catch (error) {
        console.error('Failed to load regions data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRegionsData();
  }, []);

  // Get form values
  const selectedCities = form.watch('assigned_cities') || [];

  // Create flat list of all city-district pairs for combobox
  const allCityDistrictPairs = useMemo(() => {
    if (!regionsData) return [];

    const pairs: Array<{id: string, city: string, district: string, state: string, display: string}> = [];

    let idCounter = 0;
    regionsData.regions.forEach(state => {
      state.districts.forEach(district => {
        district.cities.forEach(cityObj => {
          pairs.push({
            id: `city-${++idCounter}`,
            city: cityObj.name,
            district: district.name,
            state: state.name,
            display: `${cityObj.name}, ${district.name}, ${state.name}`
          });
        });
      });
    });

    return pairs.sort((a, b) => a.display.localeCompare(b.display));
  }, [regionsData]);

  // Filter cities based on search query and display limit
  const filteredCities = useMemo(() => {
    if (!regionsData) return [];

    let filtered = allCityDistrictPairs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const searchTerms = query.split(/\s+/).filter(term => term.length > 0);

      filtered = allCityDistrictPairs.filter(pair => {
        const fullText = `${pair.city} ${pair.district} ${pair.state}`.toLowerCase();

        // Check if all search terms appear in the full text (city, district, state)
        return searchTerms.every(term => fullText.includes(term));
      });
    }

    return filtered.slice(0, displayLimit);
  }, [regionsData, allCityDistrictPairs, searchQuery, displayLimit]);

  // Handle city selection
  const handleCitySelect = (city: string, district: string, state: string) => {
    const currentCities = [...selectedCities];
    const existingIndex = currentCities.findIndex(
      c => c.city === city && c.district === district
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      currentCities.splice(existingIndex, 1);
    } else {
      // Add if not selected
      currentCities.push({ city, district, state });
    }

    form.setValue('assigned_cities', currentCities);
  };

  // Handle scroll to load more cities
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    // When user reaches bottom, load more cities
    if (scrollPosition >= scrollHeight - 100 && filteredCities.length >= displayLimit) {
      setDisplayLimit(prev => Math.min(prev + 100, allCityDistrictPairs.length));
    }
  };

  // Remove city
  const removeCity = (index: number) => {
    const currentCities = [...selectedCities];
    currentCities.splice(index, 1);
    form.setValue('assigned_cities', currentCities);
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
          render={({ field: _field }) => (
            <FormItem>
              <FormLabel>Assigned Cities</FormLabel>
              <FormControl>
                <Popover open={openCity} onOpenChange={setOpenCity}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between h-12"
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
                        placeholder="Search cities, districts, or states..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList onScroll={handleScroll}>
                        <CommandEmpty>
                          {searchQuery ? 'No cities found matching your search.' : 'No cities available.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCities.map((pair) => {
                            const isSelected = selectedCities.some(
                              c => c.city === pair.city && c.district === pair.district
                            );

                            return (
                              <CommandItem
                                key={pair.id}
                                value={pair.display}
                                onSelect={() => handleCitySelect(pair.city, pair.district, pair.state)}
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
                          {filteredCities.length < allCityDistrictPairs.length && (
                            <CommandItem disabled>
                              <div className="text-center text-muted-foreground text-sm py-2">
                                Loading more cities... ({filteredCities.length} of {allCityDistrictPairs.length})
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                  {selectedCities.map((cityAssignment, index) => (
                    <Badge
                      key={`${cityAssignment.city}-${cityAssignment.district}-${cityAssignment.state}-${index}`}
                      variant="secondary"
                      className="text-xs justify-between items-center gap-1 px-2 py-1"
                    >
                      <span className="truncate flex-1">{cityAssignment.city}, {cityAssignment.district}, {cityAssignment.state}</span>
                      <button
                        type="button"
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-secondary-80"
                        onClick={(e) => {
                          e.preventDefault();
                          removeCity(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
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