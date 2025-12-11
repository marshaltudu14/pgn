/**
 * Retailer Form Component
 * Handles creation and editing of retailer records
 */

'use client';

import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { useRetailerStore } from '@/app/lib/stores/retailerStore';
import { useDealerStore } from '@/app/lib/stores/dealerStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
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
import { Retailer, RetailerFormData, RetailerFormDataSchema, Dealer } from '@pgn/shared';
import {
  Building, Check, ChevronDown, Loader2,
  Save, User, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { RegionSelector } from './RegionSelector';

interface RetailerFormProps {
  retailer?: Retailer | null;
  onSuccess?: (retailer: Retailer) => void;
  onCancel?: () => void;
}

export function RetailerForm({ retailer, onSuccess, onCancel }: RetailerFormProps) {
  const {
    formLoading,
    error,
    dealers,
    loadingDealers,
    createRetailer,
    updateRetailer,
    fetchDealers,
    clearError,
    resetFormLoading
  } = useRetailerStore();
  const { getDealerById } = useDealerStore();
  const { regions, isLoading: regionsLoading, fetchRegions } = useRegionsStore();
  const isEditing = !!retailer;

  const [selectedRegion, setSelectedRegion] = useState(retailer?.region_id || '');
  const [openDealer, setOpenDealer] = useState(false);
  const [dealerSearchQuery, setDealerSearchQuery] = useState('');
  const [dealerSearchType, setDealerSearchType] = useState<'name' | 'phone'>('name');
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

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

  // Load all regions data at once
  useEffect(() => {
    fetchRegions({ limit: 1000 });
  }, [fetchRegions]);

  // Fetch dealers only when search query is provided
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dealerSearchQuery && dealerSearchQuery.trim()) {
        fetchDealers({ search: dealerSearchQuery, searchType: dealerSearchType, limit: 20 });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dealerSearchQuery, dealerSearchType, fetchDealers]);

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

      // If editing and has a dealer_id, fetch that specific dealer to show it
      if (retailer.dealer_id) {
        getDealerById(retailer.dealer_id).then(dealer => {
          if (dealer) {
            setSelectedDealer(dealer);
          }
        }).catch(console.error);
      }
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
  }, [retailer, form, fetchDealers, getDealerById]);

  // Reset formLoading and clear errors when component mounts
  useEffect(() => {
    resetFormLoading();
    clearError();
  }, [resetFormLoading, clearError]);

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
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dealer</FormLabel>
                        <FormControl>
                          <Popover open={openDealer} onOpenChange={setOpenDealer}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-12"
                                type="button"
                              >
                                <div className="flex items-center">
                                  {selectedDealer ? (
                                    <div className="text-left flex-1">
                                      <div className="font-medium truncate">{selectedDealer.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {selectedDealer.phone && `• ${selectedDealer.phone}`}
                                        {selectedDealer.address && ` • ${selectedDealer.address.slice(0, 30)}${selectedDealer.address.length > 30 ? '...' : ''}`}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Search dealers by name or phone...
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
                                      onClick={() => setDealerSearchType('name')}
                                      className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors cursor-pointer",
                                        dealerSearchType === 'name'
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted hover:bg-muted/80"
                                      )}
                                    >
                                      Name
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDealerSearchType('phone')}
                                      className={cn(
                                        "px-3 py-1 text-xs rounded-md transition-colors cursor-pointer",
                                        dealerSearchType === 'phone'
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted hover:bg-muted/80"
                                      )}
                                    >
                                      Phone
                                    </button>
                                  </div>
                                </div>
                                <CommandInput
                                  placeholder={`Search dealers by ${dealerSearchType}...`}
                                  value={dealerSearchQuery}
                                  onValueChange={setDealerSearchQuery}
                                />
                                <CommandList>
                                  {loadingDealers ? (
                                    <div className="flex items-center justify-center py-6">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm text-muted-foreground">Searching...</span>
                                    </div>
                                  ) : dealers.length === 0 && !selectedDealer ? (
                                    <div className="flex items-center justify-center py-6">
                                      <span className="text-sm text-muted-foreground">
                                        {dealerSearchQuery
                                          ? 'No dealers found matching your search.'
                                          : 'Type to search dealers...'}
                                      </span>
                                    </div>
                                  ) : (
                                    <CommandGroup>
                                      {/* Show selected dealer if editing and no search results */}
                                      {selectedDealer && !dealerSearchQuery && (
                                        <CommandItem
                                          key={selectedDealer.id}
                                          value={`${selectedDealer.name} (${selectedDealer.id})`}
                                          onSelect={() => {
                                            field.onChange(selectedDealer.id);
                                            setOpenDealer(false);
                                          }}
                                        >
                                          <div className={cn(
                                            "mr-2 h-4 w-4 rounded-sm border border-primary",
                                            field.value === selectedDealer.id
                                              ? "bg-primary text-primary-foreground"
                                              : "opacity-50 [&_svg]:invisible"
                                          )}>
                                            {field.value === selectedDealer.id && <Check className="h-3 w-3" />}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                              <div className="font-medium">{selectedDealer.name}</div>
                                              <div className="text-sm text-muted-foreground">
                                                {selectedDealer.phone && (
                                                  <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {selectedDealer.phone}
                                                  </span>
                                                )}
                                                {selectedDealer.address && (
                                                  <span className="flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    <span className="truncate">
                                                      {selectedDealer.address.length > 40
                                                        ? `${selectedDealer.address.slice(0, 40)}...`
                                                        : selectedDealer.address}
                                                    </span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      )}
                                      {dealers.map((dealer) => (
                                        <CommandItem
                                          key={dealer.id}
                                          value={`${dealer.name} (${dealer.id})`}
                                          onSelect={() => {
                                            field.onChange(dealer.id);
                                            setSelectedDealer(dealer);
                                            setOpenDealer(false);
                                            setDealerSearchQuery('');
                                          }}
                                        >
                                          <div className={cn(
                                            "mr-2 h-4 w-4 rounded-sm border border-primary",
                                            field.value === dealer.id
                                              ? "bg-primary text-primary-foreground"
                                              : "opacity-50 [&_svg]:invisible"
                                          )}>
                                            {field.value === dealer.id && <Check className="h-3 w-3" />}
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                              <div className="font-medium">{dealer.name}</div>
                                              <div className="text-sm text-muted-foreground">
                                                {dealer.phone && (
                                                  <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {dealer.phone}
                                                  </span>
                                                )}
                                                {dealer.address && (
                                                  <span className="flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    <span className="truncate">
                                                      {dealer.address.length > 40
                                                        ? `${dealer.address.slice(0, 40)}...`
                                                        : dealer.address}
                                                    </span>
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormDescription>
                          The dealer this retailer is associated with (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                  )}
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
                {isEditing ? 'Update Retailer' : 'Create Retailer'}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}