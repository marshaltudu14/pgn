/**
 * Farmer Form Component
 * Handles creation and editing of farmer records
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Loader2,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';
import { Farmer, FarmerFormData, FarmerFormDataSchema } from '@pgn/shared';
import { useFarmerStore } from '@/app/lib/stores/farmerStore';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { RegionSelector } from './RegionSelector';

interface FarmerFormProps {
  farmer?: Farmer | null;
  onSuccess?: (farmer: Farmer) => void;
  onCancel?: () => void;
}

export function FarmerForm({ farmer, onSuccess, onCancel }: FarmerFormProps) {
  const {
    loading,
    error,
    retailers,
    loadingRetailers,
    createFarmer,
    updateFarmer,
    fetchRetailers,
    clearError
  } = useFarmerStore();
  const { regions, isLoading: regionsLoading, fetchRegions, searchRegions } = useRegionsStore();
  const isEditing = !!farmer;

  const [openRetailer, setOpenRetailer] = useState(false);
  const [retailerSearchQuery, setRetailerSearchQuery] = useState('');

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

  // Load regions data
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Load retailers for dropdown with search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (retailerSearchQuery) {
        // Search by query (could be name or phone)
        fetchRetailers({
          search: retailerSearchQuery,
          limit: 10
        });
      } else {
        // Load initial retailers without search
        fetchRetailers({
          limit: 10
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [retailerSearchQuery, fetchRetailers]);

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
  }, [farmer, form]);

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
                          disabled={loading}
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
                          disabled={loading}
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
                    const selectedRetailer = retailers.find(r => r.id === field.value);
                    return (
                      <FormItem>
                        <FormLabel>Retailer</FormLabel>
                        <Popover open={openRetailer} onOpenChange={setOpenRetailer}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-12"
                              type="button"
                              disabled={loading || loadingRetailers}
                              onClick={() => field.onChange(selectedRetailer?.id || 'none')}
                            >
                              {selectedRetailer ? (
                                <div className="text-left">
                                  <div className="font-medium truncate">
                                    {selectedRetailer.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {selectedRetailer.phone && (
                                      <>
                                        {selectedRetailer.phone}
                                        {selectedRetailer.address && ` • ${selectedRetailer.address.slice(0, 30)}${selectedRetailer.address.length > 30 ? '...' : ''}`}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                "Select a retailer (optional)"
                              )}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-screen max-w-md p-0 max-h-[400px]"
                            align="start"
                            side="bottom"
                            sideOffset={4}
                          >
                            <Command>
                              <CommandInput
                                placeholder="Search retailers by name or phone..."
                                value={retailerSearchQuery}
                                onValueChange={setRetailerSearchQuery}
                              />
                              <CommandList>
                                {loadingRetailers && retailers.length === 0 ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span className="text-sm text-muted-foreground">Loading retailers...</span>
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No retailers found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange('none');
                                          setOpenRetailer(false);
                                        }}
                                      >
                                        No retailer assigned
                                      </CommandItem>
                                      {retailers.map((retailer) => (
                                        <CommandItem
                                          key={retailer.id}
                                          value={retailer.id}
                                          onSelect={() => {
                                            field.onChange(retailer.id);
                                            setOpenRetailer(false);
                                          }}
                                          className="p-3"
                                        >
                                          <div className="flex flex-col items-start">
                                            <div className="font-medium truncate w-full">
                                              {retailer.name}
                                            </div>
                                            {retailer.shop_name && (
                                              <div className="text-sm text-muted-foreground truncate w-full">
                                                Shop: {retailer.shop_name}
                                              </div>
                                            )}
                                            <div className="text-sm text-muted-foreground">
                                              {retailer.phone && <span>{retailer.phone}</span>}
                                              {retailer.phone && retailer.address && <span> • </span>}
                                              {retailer.address && (
                                                <span className="truncate">
                                                  {retailer.address}
                                                </span>
                                              )}
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
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
                  value={form.watch('region_id')}
                  onValueChange={(value) => form.setValue('region_id', value, { shouldValidate: true, shouldDirty: true })}
                  regions={transformedRegions}
                  isLoading={regionsLoading}
                  onSearch={searchRegions}
                  disabled={loading}
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
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={loading || loadingRetailers}
              >
                {loading ? (
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