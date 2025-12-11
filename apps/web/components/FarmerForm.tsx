/**
 * Farmer Form Component
 * Handles creation and editing of farmer records
 */

'use client';

import { useFarmerStore } from '@/app/lib/stores/farmerStore';
import { useRetailerStore } from '@/app/lib/stores/retailerStore';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Farmer, FarmerFormData, FarmerFormDataSchema, Retailer } from '@pgn/shared';
import { Building, Check, ChevronDown, Loader2, Save, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RegionSelector } from './RegionSelector';

interface FarmerFormProps {
  farmer?: Farmer | null;
  onSuccess?: (farmer: Farmer) => void;
  onCancel?: () => void;
}

export function FarmerForm({ farmer, onSuccess, onCancel }: FarmerFormProps) {
  const {
    formLoading,
    error,
    retailers,
    loadingRetailers,
    createFarmer,
    updateFarmer,
    fetchRetailers,
    clearError
  } = useFarmerStore();
  const { getRetailerById } = useRetailerStore();
  const { regions, isLoading: regionsLoading, fetchRegions } = useRegionsStore();
  const isEditing = !!farmer;

  const [selectedRegion, setSelectedRegion] = useState(farmer?.region_id || '');
  const [openRetailer, setOpenRetailer] = useState(false);
  const [retailerSearchQuery, setRetailerSearchQuery] = useState('');
  const [retailerSearchType, setRetailerSearchType] = useState<'name' | 'phone'>('name');
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);

  const form = useForm<FarmerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      farm_name: '',
      email: '',
      retailer_id: '',
      region_id: '',
    },
    mode: 'onBlur',
  });

  // Load all regions data at once
  useEffect(() => {
    fetchRegions({ limit: 1000 });
  }, [fetchRegions]);

  // Fetch retailers only when search query is provided
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (retailerSearchQuery && retailerSearchQuery.trim()) {
        fetchRetailers({ search: retailerSearchQuery, searchType: retailerSearchType, limit: 20 });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [retailerSearchQuery, retailerSearchType, fetchRetailers]);

  useEffect(() => {
    if (farmer) {
      form.reset({
        name: farmer.name,
        phone: farmer.phone || '',
        address: farmer.address || '',
        farm_name: farmer.farm_name || '',
        email: farmer.email || '',
        retailer_id: farmer.retailer_id || '',
        region_id: farmer.region_id || '',
      });

      // If editing and has a retailer_id, fetch that specific retailer to show it
      if (farmer.retailer_id) {
        getRetailerById(farmer.retailer_id).then(retailer => {
          if (retailer) {
            setSelectedRetailer(retailer);
          }
        }).catch(console.error);
      }
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        farm_name: '',
        email: '',
        retailer_id: '',
        region_id: '',
      });
    }
  }, [farmer, form, getRetailerById]);

  const onSubmit = async (data: FarmerFormData) => {
    clearError();

    // Clean phone number - remove formatting and special characters, keep only digits
    const cleanPhone = data.phone
      ? data.phone.replace(/\D/g, '').slice(-10) // Keep only last 10 digits
      : '';

    // Convert "none" value back to empty string for API compatibility
    const processedData = {
      ...data,
      phone: cleanPhone,
      retailer_id: data.retailer_id === 'none' ? '' : data.retailer_id,
    };

    // Validate with zod
    const validationResult = FarmerFormDataSchema.safeParse(processedData);

    if (!validationResult.success) {
      // Set field-level errors
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof FarmerFormData;
        if (fieldName) {
          form.setError(fieldName, {
            type: 'validation',
            message: issue.message,
          });
        }
      });
      return;
    }

    const result = isEditing
      ? await updateFarmer(farmer!.id, processedData)
      : await createFarmer(processedData);

    if (result.success && result.data) {
      toast.success(isEditing ? 'Farmer updated successfully!' : 'Farmer created successfully!');
      onSuccess?.(result.data);
    } else {
      toast.error(result.error || 'Failed to save farmer');
    }
  };

  const handleCancel = () => {
    form.reset();
    clearError();
    onCancel?.();
  };

  // Transform regions data for RegionSelector
  const transformedRegions = regions.map(region => ({
    id: region.id,
    city: region.city,
    state: region.state
  }));

  return (
    <div className="w-full space-y-6">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-white dark:bg-black border">
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Primary details about the farmer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farmer Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter farmer name"
                          {...field}
                                                  />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="farm_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farm Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter farm name"
                          {...field}
                                                  />
                      </FormControl>
                      <FormDescription>
                        The registered name of the farmer&apos;s farm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Retailer Assignment */}
            <Card className="bg-white dark:bg-black border">
              <CardHeader>
                <CardTitle className="text-lg">Retailer Assignment</CardTitle>
                <CardDescription>
                  Assign the farmer to a retailer (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="retailer_id"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Retailer</FormLabel>
                        <FormControl>
                          <Popover open={openRetailer} onOpenChange={setOpenRetailer}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-12"
                                type="button"
                                disabled={formLoading}
                              >
                                <div className="flex items-center">
                                  {selectedRetailer ? (
                                    <div className="text-left flex-1">
                                      <div className="font-medium truncate">{selectedRetailer.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {selectedRetailer.phone && `• ${selectedRetailer.phone}`}
                                        {selectedRetailer.address && ` • ${selectedRetailer.address.slice(0, 30)}${selectedRetailer.address.length > 30 ? '...' : ''}`}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Search retailers by name or phone...
                                    </span>
                                  )}
                                </div>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-full p-0 max-h-[400px]"
                              align="start"
                              style={{ width: 'var(--radix-popover-trigger-width)' }}
                            >
                              <Command shouldFilter={false}>
                                {/* Search Type Toggle */}
                                <div className="flex items-center gap-2 px-3 py-2 border-b">
                                  <span className="text-sm text-muted-foreground">Search by:</span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setRetailerSearchType('name')}
                                      className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors cursor-pointer",
                                        retailerSearchType === 'name'
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted hover:bg-muted/80"
                                      )}
                                    >
                                      Name
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRetailerSearchType('phone')}
                                      className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors cursor-pointer",
                                        retailerSearchType === 'phone'
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted hover:bg-muted/80"
                                      )}
                                    >
                                      Phone
                                    </button>
                                  </div>
                                </div>
                                <CommandInput
                                  placeholder={`Search retailers by ${retailerSearchType}...`}
                                  value={retailerSearchQuery}
                                  onValueChange={setRetailerSearchQuery}
                                />
                                <CommandList>
                                  {loadingRetailers ? (
                                    <div className="flex items-center justify-center py-6">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm text-muted-foreground">Searching...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <CommandEmpty>
                                        {retailerSearchQuery
                                          ? 'No retailers found matching your search.'
                                          : selectedRetailer
                                          ? null
                                          : 'Type to search retailers...'}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {/* Show selected retailer if editing and no search results */}
                                        {selectedRetailer && !retailerSearchQuery && (
                                          <CommandItem
                                            key={selectedRetailer.id}
                                            value={`${selectedRetailer.name} (${selectedRetailer.id})`}
                                            onSelect={() => {
                                              field.onChange(selectedRetailer.id);
                                              setOpenRetailer(false);
                                            }}
                                          >
                                            <div className={cn(
                                              "mr-2 h-4 w-4 rounded-sm border border-primary",
                                              field.value === selectedRetailer.id
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                            )}>
                                              {field.value === selectedRetailer.id && <Check className="h-3 w-3" />}
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <div className="flex-1">
                                                <div className="font-medium">{selectedRetailer.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {selectedRetailer.phone && (
                                                    <span className="flex items-center gap-1">
                                                      <User className="h-3 w-3" />
                                                      {selectedRetailer.phone}
                                                    </span>
                                                  )}
                                                  {selectedRetailer.address && (
                                                    <span className="flex items-center gap-1">
                                                      <Building className="h-3 w-3" />
                                                      <span className="truncate">
                                                        {selectedRetailer.address.length > 40
                                                          ? `${selectedRetailer.address.slice(0, 40)}...`
                                                          : selectedRetailer.address}
                                                      </span>
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        )}
                                        {retailers.map((retailer) => (
                                          <CommandItem
                                            key={retailer.id}
                                            value={`${retailer.name} (${retailer.id})`}
                                            onSelect={() => {
                                              field.onChange(retailer.id);
                                              setSelectedRetailer(retailer);
                                              setOpenRetailer(false);
                                              setRetailerSearchQuery('');
                                            }}
                                          >
                                            <div className={cn(
                                              "mr-2 h-4 w-4 rounded-sm border border-primary",
                                              field.value === retailer.id
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                            )}>
                                              {field.value === retailer.id && <Check className="h-3 w-3" />}
                                            </div>
                                            <div className="flex items-center gap-3">
                                              <div className="flex-1">
                                                <div className="font-medium">{retailer.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                  {retailer.phone && (
                                                    <span className="flex items-center gap-1">
                                                      <User className="h-3 w-3" />
                                                      {retailer.phone}
                                                    </span>
                                                  )}
                                                  {retailer.address && (
                                                    <span className="flex items-center gap-1">
                                                      <Building className="h-3 w-3" />
                                                      <span className="truncate">
                                                        {retailer.address.length > 40
                                                          ? `${retailer.address.slice(0, 40)}...`
                                                          : retailer.address}
                                                      </span>
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
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
                        <FormDescription>
                          The retailer this farmer is associated with (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-white dark:bg-black border">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
                <CardDescription>
                  How to reach the farmer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter phone number"
                          {...field}
                                                    type="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter email address"
                          {...field}
                                                    type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="bg-white dark:bg-black border">
              <CardHeader>
                <CardTitle className="text-lg">Address Information</CardTitle>
                <CardDescription>
                  Physical location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter complete address"
                          {...field}
                                                    rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Complete physical address of the farmer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <RegionSelector
                  value={selectedRegion}
                  onValueChange={(value) => {
                    setSelectedRegion(value);
                    form.setValue('region_id', value, { shouldValidate: true, shouldDirty: true });
                  }}
                  regions={transformedRegions}
                  isLoading={regionsLoading}
                />
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/15 border border-destructive/50 text-destructive p-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={handleCancel}
                              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                  >
                {formLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update Farmer' : 'Create Farmer'}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}