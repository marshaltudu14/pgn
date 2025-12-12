/**
 * Region Selector Component
 * Single region selection combobox for forms
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
import { MapPin, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Region {
  id: string;
  city: string;
  state: string;
}

interface RegionSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  regions: Region[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RegionSelector({
  value,
  onValueChange,
  regions,
  isLoading = false,
  onSearch,
  placeholder = "Select region...",
  disabled = false
}: RegionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch && searchQuery) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearch]);

  // Find selected region
  const selectedRegion = useMemo(() => {
    if (!value || !regions) return null;
    return regions.find(r => r.id === value);
  }, [value, regions]);

  // Filter regions based on search
  const filteredRegions = useMemo(() => {
    if (!regions) return [];

    if (!searchQuery) return regions;

    const query = searchQuery.toLowerCase();
    return regions.filter(region =>
      region.city.toLowerCase().includes(query) ||
      region.state.toLowerCase().includes(query) ||
      `${region.city}, ${region.state}`.toLowerCase().includes(query)
    );
  }, [regions, searchQuery]);

  const handleSelect = (regionId: string) => {
    onValueChange(regionId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <FormField
      name="region_id"
      render={(_field) => (
        <FormItem>
          <FormControl>
            <Popover
              open={open}
              onOpenChange={setOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between h-12"
                  type="button"
                  disabled={disabled || isLoading}
                >
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading regions...</span>
                      </>
                    ) : selectedRegion ? (
                      `${selectedRegion.city}, ${selectedRegion.state}`
                    ) : (
                      placeholder
                    )}
                  </div>
                  {!isLoading && <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0 max-h-[400px]"
                align="start"
                style={{ width: 'var(--radix-popover-trigger-width)' }}
              >
                <Command>
                  <CommandInput
                    placeholder="Search regions..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    {isLoading && !regions.length ? (
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
                          {filteredRegions.map((region) => (
                            <CommandItem
                              key={region.id}
                              value={`${region.city}, ${region.state}`}
                              onSelect={() => handleSelect(region.id)}
                            >
                              <div className={cn(
                                "mr-2 h-4 w-4 rounded-sm border border-primary",
                                value === region.id
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}>
                                {value === region.id && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{region.city}</span>
                                <span className="text-muted-foreground">{region.state}</span>
                              </div>
                            </CommandItem>
                          ))}
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
      )}
    />
  );
}