/**
 * Retailer Form Component
 * Handles creation and editing of retailer records
 */

'use client';

import { useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Retailer, RetailerFormData } from '@pgn/shared';
import { useRetailerStore } from '@/app/lib/stores/retailerStore';

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
  const isEditing = !!retailer;

  const form = useForm<RetailerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      shop_name: '',
      email: '',
      dealer_id: '',
    },
    mode: 'onBlur',
  });

  // Load dealers for dropdown
  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]); // Load once on mount

  useEffect(() => {
    if (retailer) {
      form.reset({
        name: retailer.name,
        phone: retailer.phone || '',
        address: retailer.address || '',
        shop_name: retailer.shop_name || '',
        email: retailer.email || '',
        dealer_id: retailer.dealer_id || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        email: '',
        dealer_id: '',
      });
    }
  }, [retailer, form]);

  const onSubmit = async (data: RetailerFormData) => {
    clearError();

    const result = isEditing
      ? await updateRetailer(retailer!.id, data)
      : await createRetailer(data);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">

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
                      <FormLabel>Shop Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter shop name"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormDescription>
                        The registered name of the retailer&apos;s shop
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loading || loadingDealers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a dealer (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No dealer assigned</SelectItem>
                          {dealers.map((dealer) => (
                            <SelectItem key={dealer.id} value={dealer.id}>
                              {dealer.name} {dealer.shop_name && `(${dealer.shop_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <FormLabel>Phone Number</FormLabel>
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
                      <FormLabel>Address</FormLabel>
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
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
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