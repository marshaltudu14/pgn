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
  Store,
} from 'lucide-react';
import { Retailer, RetailerFormData, Dealer } from '@pgn/shared';

interface RetailerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailer?: Retailer | null;
  onSuccess?: (retailer: Retailer) => void;
  onCancel?: () => void;
}

export function RetailerForm({ open, onOpenChange, retailer, onSuccess, onCancel }: RetailerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
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
    async function loadDealers() {
      if (open) {
        setLoadingDealers(true);
        try {
          const response = await fetch('/api/dealers?limit=1000');
          const result = await response.json();

          if (result.success) {
            setDealers(result.data.dealers || []);
          }
        } catch (err) {
          console.error('Error loading dealers:', err);
        } finally {
          setLoadingDealers(false);
        }
      }
    }

    loadDealers();
  }, [open]);

  useEffect(() => {
    if (retailer && open) {
      form.reset({
        name: retailer.name,
        phone: retailer.phone || '',
        address: retailer.address || '',
        shop_name: retailer.shop_name || '',
        email: retailer.email || '',
        dealer_id: retailer.dealer_id || '',
      });
    } else if (!retailer && open) {
      form.reset({
        name: '',
        phone: '',
        address: '',
        shop_name: '',
        email: '',
        dealer_id: '',
      });
    }
  }, [retailer, open, form]);

  const onSubmit = async (data: RetailerFormData) => {
    setLoading(true);
    setError(null);

    try {
      const url = isEditing ? `/api/retailers/${retailer.id}` : '/api/retailers';
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
        toast.success(isEditing ? 'Retailer updated successfully!' : 'Retailer created successfully!');
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        throw new Error(result.error || 'Failed to save retailer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save retailer';
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
            <Store className="h-5 w-5" />
            {isEditing ? 'Edit Retailer' : 'Create New Retailer'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the retailer information below.'
              : 'Fill in the details to create a new retailer record.'
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
                        The registered name of the retailer's shop
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Dealer Assignment */}
            <Card>
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
            <Card>
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
      </DialogContent>
    </Dialog>
  );
}