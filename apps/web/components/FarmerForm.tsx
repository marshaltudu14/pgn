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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Sprout,
} from 'lucide-react';
import { Farmer, FarmerFormData, Retailer } from '@pgn/shared';

interface FarmerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmer?: Farmer | null;
  onSuccess?: (farmer: Farmer) => void;
  onCancel?: () => void;
}

export function FarmerForm({ open, onOpenChange, farmer, onSuccess, onCancel }: FarmerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(false);
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
    async function loadRetailers() {
      if (open) {
        setLoadingRetailers(true);
        try {
          const response = await fetch('/api/retailers?limit=1000');
          const result = await response.json();

          if (result.success) {
            setRetailers(result.data.retailers || []);
          }
        } catch (err) {
          console.error('Error loading retailers:', err);
        } finally {
          setLoadingRetailers(false);
        }
      }
    }

    loadRetailers();
  }, [open]);

  useEffect(() => {
    if (farmer && open) {
      form.reset({
        name: farmer.name,
        phone: farmer.phone || '',
        address: farmer.address || '',
        farm_name: farmer.farm_name || '',
        email: farmer.email || '',
        retailer_id: farmer.retailer_id || '',
      });
    } else if (!farmer && open) {
      form.reset({
        name: '',
        phone: '',
        address: '',
        farm_name: '',
        email: '',
        retailer_id: '',
      });
    }
  }, [farmer, open, form]);

  const onSubmit = async (data: FarmerFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/farmers/${farmer.id}` : '/api/farmers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEditing ? 'Farmer updated successfully!' : 'Farmer created successfully!');
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Failed to save farmer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save farmer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setError(null);
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5" />
            {isEditing ? 'Edit Farmer' : 'Create New Farmer'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the farmer information below.'
              : 'Fill in the details to create a new farmer record.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
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
                        The registered name of the farmer's farm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Retailer Assignment */}
            <Card>
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
            <Card>
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
            <Card>
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
      </DialogContent>
    </Dialog>
  );
}