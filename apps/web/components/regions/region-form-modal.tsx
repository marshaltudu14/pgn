'use client';

import { useState, useCallback, useMemo } from 'react';
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
  // For create mode, start with empty form. For edit mode, use controlled state.
  const [formData, setFormData] = useState<CreateRegionRequest>({ state: '', city: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use memo to determine current form values
  const currentFormValues = useMemo(() => {
    if (initialData) {
      // Edit mode: use form data (controlled by user changes)
      return formData;
    } else {
      // Create mode: use form data
      return formData;
    }
  }, [formData, initialData]);

  // Sync form when initialData changes (edit mode)
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  if (prevInitialData !== initialData) {
    setPrevInitialData(initialData);
    if (initialData) {
      setFormData({ state: initialData.state, city: initialData.city });
    } else {
      setFormData({ state: '', city: '' });
    }
    setErrors({});
  }

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

    if (!currentFormValues.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!currentFormValues.city.trim()) {
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

    onSubmit(currentFormValues);
  };

  // Check if error is a duplicate key error for user-friendly message
  const getDuplicateErrorMessage = (error: string | null): string | null => {
    if (!error) return null;

    if (error.includes('state and city combination already exists')) {
      return 'This region already exists. Please choose a different state and city combination.';
    }

    return error;
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
            <AlertDescription>{getDuplicateErrorMessage(submitError) || submitError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select
              value={currentFormValues.state}
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
              value={currentFormValues.city}
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
              className="cursor-pointer hover:bg-accent transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer hover:bg-primary/90 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                initialData ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}