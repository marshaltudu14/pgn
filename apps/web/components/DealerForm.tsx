/**
 * Dealer Form Component
 * Handles creation and editing of dealer records
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
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { Dealer, DealerFormData } from '@pgn/shared';
import { useDealerStore } from '@/app/lib/stores/dealerStore';

interface DealerFormProps {
  dealer?: Dealer | null;
  onSuccess?: (dealer: Dealer) => void;
  onCancel?: () => void;
}

export function DealerForm({ dealer, onSuccess, onCancel }: DealerFormProps) {
  const { loading, error, createDealer, updateDealer, clearError } = useDealerStore();
  const isEditing = !!dealer;

  const form = useForm<DealerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      shop_name: '',
      email: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (dealer) {
      form.reset({
        name: dealer.name,
        phone: dealer.phone || '',
        address: dealer.address || '',
        shop_name: dealer.shop_name || '',
        email: dealer.email || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        email: '',
      });
    }
  }, [dealer, form]);

  const onSubmit = async (data: DealerFormData) => {
    clearError();

    const result = isEditing
      ? await updateDealer(dealer!.id, data)
      : await createDealer(data);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">

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
                      The registered name of the dealer&apos;s shop
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
                      Complete physical address of the dealer
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
              disabled={loading}
            >
              {loading ? (
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