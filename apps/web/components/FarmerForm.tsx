/**
 * Farmer Form Component
 * Handles creation and editing of farmer records
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
import { Farmer, FarmerFormData } from '@pgn/shared';
import { useFarmerStore } from '@/app/lib/stores/farmerStore';

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
  const isEditing = !!farmer;

  const form = useForm<FarmerFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      farm_name: '',
      email: '',
      retailer_id: '',
    },
    mode: 'onBlur',
  });

  // Load retailers for dropdown
  useEffect(() => {
    fetchRetailers();
  }, [fetchRetailers]); // Load once on mount

  useEffect(() => {
    if (farmer) {
      form.reset({
        name: farmer.name,
        phone: farmer.phone || '',
        address: farmer.address || '',
        farm_name: farmer.farm_name || '',
        email: farmer.email || '',
        retailer_id: farmer.retailer_id || '',
      });
    } else {
      form.reset({
        name: '',
        phone: '',
        address: '',
        farm_name: '',
        email: '',
        retailer_id: '',
      });
    }
  }, [farmer, form]);

  const onSubmit = async (data: FarmerFormData) => {
    clearError();

    const result = isEditing
      ? await updateFarmer(farmer!.id, data)
      : await createFarmer(data);

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">

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
                  Assign the farmer to a retailer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="retailer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retailer *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={loading || loadingRetailers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a retailer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {retailers.map((retailer) => (
                            <SelectItem key={retailer.id} value={retailer.id}>
                              {retailer.name} {retailer.shop_name && `(${retailer.shop_name})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The retailer this farmer is associated with
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
                  How to reach the farmer
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
                        Complete physical address of the farmer
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