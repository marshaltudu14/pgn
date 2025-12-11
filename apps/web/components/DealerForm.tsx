/**
 * Dealer Form Component
 * Handles creation and editing of dealer records
 */

'use client';

import { useEffect, useState } from 'react';
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
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Dealer, DealerFormData, DealerFormDataSchema } from '@pgn/shared';
import { useDealerStore } from '@/app/lib/stores/dealerStore';
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { RegionSelector } from './RegionSelector';

interface DealerFormProps {
  dealer?: Dealer | null;
  onSuccess?: (dealer: Dealer) => void;
  onCancel?: () => void;
}

export function DealerForm({ dealer, onSuccess, onCancel }: DealerFormProps) {
  const { formLoading, error, createDealer, updateDealer, clearError } = useDealerStore();
  const { regions, isLoading: regionsLoading, fetchRegions } = useRegionsStore();
  const isEditing = !!dealer;
  const [selectedRegion, setSelectedRegion] = useState(dealer?.region_id || '');

  const form = useForm<DealerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      shop_name: '',
      email: '',
      region_id: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    // Load all regions data at once
    fetchRegions({ limit: 1000 });

    if (dealer) {
      form.reset({
        name: dealer.name,
        phone: dealer.phone || '',
        address: dealer.address || '',
        shop_name: dealer.shop_name || '',
        email: dealer.email || '',
        region_id: dealer.region_id || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        email: '',
        region_id: '',
      });
    }
  }, [dealer, form, fetchRegions]);

  const onSubmit = async (data: DealerFormData) => {
    clearError();

    // Clean phone number - remove formatting and special characters, keep only digits
    const cleanPhone = data.phone
      ? data.phone.replace(/\D/g, '').slice(-10) // Keep only last 10 digits
      : '';

    // Prepare data for validation
    const dataForValidation = {
      ...data,
      phone: cleanPhone,
    };

    // Validate with zod
    const validationResult = DealerFormDataSchema.safeParse(dataForValidation);

    if (!validationResult.success) {
      // Set field-level errors
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof DealerFormData;
        if (fieldName) {
          form.setError(fieldName, {
            type: 'validation',
            message: issue.message,
          });
        }
      });
      return;
    }

    const finalData = {
      ...data,
      phone: cleanPhone,
    };

    const result = isEditing
      ? await updateDealer(dealer!.id, finalData)
      : await createDealer(finalData);

    if (result.success && result.data) {
      toast.success(isEditing ? 'Dealer updated successfully!' : 'Dealer created successfully!');
      onSuccess?.(result.data);
    } else {
      toast.error(result.error || 'Failed to save dealer');
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
                Primary details about the dealer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dealer Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter dealer name"
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
                      The registered name of the dealer&apos;s shop or business
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
                How to reach the dealer
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
                      Complete physical address of the dealer
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
              {isEditing ? 'Update Dealer' : 'Create Dealer'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}