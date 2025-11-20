'use client';

import { useState, useCallback } from 'react';
import { CreateRegionRequest, UpdateRegionRequest, StateOption } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface RegionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRegionRequest | UpdateRegionRequest) => void;
  isSubmitting: boolean;
  states: StateOption[];
  initialData?: CreateRegionRequest;
  title: string;
  submitError?: string | null;
}

export function RegionFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  states,
  initialData,
  title,
  submitError,
}: RegionFormModalProps) {
  // Derive form data directly from props to avoid setState in effects
  const [formData, setFormData] = useState<CreateRegionRequest>({ state: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use derived state instead of setState in effects
  const derivedFormData = open && initialData ? initialData : (open ? { state: '', city: '' } : formData);

  // Handle state change
  const handleStateChange = useCallback((state: string) => {
    setFormData(prev => ({ ...prev, state, city: '' }));
    setErrors({});
  }, []);

  // Handle city change
  const handleCityChange = useCallback((city: string) => {
    setFormData(prev => ({ ...prev, city }));
    setErrors({});
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!derivedFormData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!derivedFormData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(derivedFormData);
  };

  // Handle dialog close
  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Update the region information below.'
              : 'Enter the state and city information to add a new region.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Display submit error if any */}
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select
              value={derivedFormData.state}
              onValueChange={handleStateChange}
              disabled={isSubmitting}
            >
              <SelectTrigger className={`w-full ${errors.state ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.state} value={state.state}>
                    {state.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={derivedFormData.city}
              onChange={(e) => handleCityChange(e.target.value)}
              placeholder="Enter city name"
              disabled={isSubmitting}
              className={errors.city ? 'border-destructive' : ''}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}