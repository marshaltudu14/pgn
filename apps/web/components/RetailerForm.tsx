/**
 * Retailer Form Component
 * Handles creation and editing of retailer records
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
import { Retailer, RetailerFormData, RetailerFormDataSchema } from '@pgn/shared';
import { useRetailerStore } from '@/app/lib/stores/retailerStore';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { RegionSelector } from './RegionSelector';

interface RetailerFormProps {
  retailer?: Retailer | null;
  onSuccess?: (retailer: Retailer) => void;
  onCancel?: () => void;
}

export function RetailerForm({ retailer, onSuccess, onCancel }: RetailerFormProps) {
  const {
    loading,
    error,
    dealers,
    loadingDealers,
    createRetailer,
    updateRetailer,
    fetchDealers,
    clearError
  } = useRetailerStore();
  const { regions, isLoading: regionsLoading, fetchRegions, searchRegions } = useRegionsStore();
  const isEditing = !!retailer;

  const [openDealer, setOpenDealer] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(retailer?.region_id || '');

  const form = useForm<RetailerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      shop_name: '',
      email: '',
      dealer_id: 'none',
      region_id: '',
    },
    mode: 'onBlur',
  });

  // Load regions data
  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // Load dealers for dropdown with search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dealerSearchQuery) {
        // Search by query (could be name or phone)
        fetchDealers({
          search: dealerSearchQuery,
          limit: 10
        });
      } else {
        // Load initial dealers without search
        fetchDealers({
          limit: 10
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [dealerSearchQuery, fetchDealers]);

  useEffect(() => {
    if (retailer) {
      form.reset({
        name: retailer.name,
        phone: retailer.phone || '',
        address: retailer.address || '',
        shop_name: retailer.shop_name || '',
        email: retailer.email || '',
        dealer_id: retailer.dealer_id || 'none',
        region_id: retailer.region_id || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        email: '',
        dealer_id: 'none',
        region_id: '',
      });
    }
  }, [retailer, form]);

  const onSubmit = async (data: RetailerFormData) => {
    clearError();

    // Clean phone number - remove formatting and special characters, keep only digits
    const cleanPhone = data.phone
      ? data.phone.replace(/\D/g, '').slice(-10) // Keep only last 10 digits
      : '';

    // Convert "none" value back to empty string for API compatibility
    const processedData = {
      ...data,
      phone: cleanPhone,
      dealer_id: data.dealer_id === 'none' ? '' : data.dealer_id,
    };

    // Validate with zod
    const validationResult = RetailerFormDataSchema.safeParse(processedData);

    if (!validationResult.success) {
      // Set field-level errors
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof RetailerFormData;
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
      ? await updateRetailer(retailer!.id, processedData)
      : await createRetailer(processedData);

    if (result.success && result.data) {
      toast.success(isEditing ? 'Retailer updated successfully!' : 'Retailer created successfully!');
      onSuccess?.(result.data);
    } else {
      toast.error(result.error || 'Failed to save retailer');
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
                  Primary details about the retailer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retailer Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter retailer name"
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
                  name="shop_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop/Business Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter shop/business name"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        The registered name of the retailer&apos;s shop or business
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Dealer Assignment */}
            <Card className="bg-white dark:bg-black border">
              <CardHeader>
                <CardTitle className="text-lg">Dealer Assignment</CardTitle>
                <CardDescription>
                  Assign the retailer to a dealer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dealer_id"
                  render={({ field }) => {
                    const selectedDealer = dealers.find(d => d.id === field.value);
                    return (
                      <FormItem>
                        <FormLabel>Dealer</FormLabel>
                        <Popover open={openDealer} onOpenChange={setOpenDealer}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between h-12"
                              type="button"
                              disabled={loading || loadingDealers}
                              onClick={() => field.onChange(selectedDealer?.id || 'none')}
                            >
                              {selectedDealer ? (
                                <div className="text-left">
                                  <div className="font-medium truncate">
                                    {selectedDealer.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {selectedDealer.phone && (
                                      <>
                                        {selectedDealer.phone}
                                        {selectedDealer.address && ` • ${selectedDealer.address.slice(0, 30)}${selectedDealer.address.length > 30 ? '...' : ''}`}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                "Select a dealer (optional)"
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
                                placeholder="Search dealers by name or phone..."
                                value={dealerSearchQuery}
                                onValueChange={setDealerSearchQuery}
                              />
                              <CommandList>
                                {loadingDealers && dealers.length === 0 ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    <span className="text-sm text-muted-foreground">Loading dealers...</span>
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>No dealers found.</CommandEmpty>
                                    <CommandGroup>
                                      <CommandItem
                                        value="none"
                                        onSelect={() => {
                                          field.onChange('none');
                                          setOpenDealer(false);
                                        }}
                                      >
                                        No dealer assigned
                                      </CommandItem>
                                      {dealers.map((dealer) => (
                                        <CommandItem
                                          key={dealer.id}
                                          value={dealer.id}
                                          onSelect={() => {
                                            field.onChange(dealer.id);
                                            setOpenDealer(false);
                                          }}
                                          className="p-3"
                                        >
                                          <div className="flex flex-col items-start">
                                            <div className="font-medium truncate w-full">
                                              {dealer.name}
                                            </div>
                                            {dealer.shop_name && (
                                              <div className="text-sm text-muted-foreground truncate w-full">
                                                Shop: {dealer.shop_name}
                                              </div>
                                            )}
                                            <div className="text-sm text-muted-foreground">
                                              {dealer.phone && <span>{dealer.phone}</span>}
                                              {dealer.phone && dealer.address && <span> • </span>}
                                              {dealer.address && (
                                                <span className="truncate">
                                                  {dealer.address}
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
                          The dealer this retailer is associated with (optional)
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
                  How to reach the retailer
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
                        Complete physical address of the retailer
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
                disabled={loading || loadingDealers}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update Retailer' : 'Create Retailer'}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}