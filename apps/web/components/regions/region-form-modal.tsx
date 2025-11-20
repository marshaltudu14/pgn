'use client';

import { useState, useEffect, useRef } from 'react';
import { CreateRegionRequest, UpdateRegionRequest, StateOption } from '@pgn/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useRegionsStore } from '@/app/lib/stores/regionsStore';
import { Loader2 } from 'lucide-react';

interface RegionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRegionRequest | UpdateRegionRequest) => void;
  isSubmitting: boolean;
  states: StateOption[];
  initialData?: CreateRegionRequest;
  title: string;
}

export function RegionFormModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  states,
  initialData,
  title,
}: RegionFormModalProps) {
  const { districts, cities } = useRegionsStore();
  const [formData, setFormData] = useState<CreateRegionRequest>({
    state: '',
    district: '',
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Use refs to track previous values and prevent infinite loops
  const prevOpenRef = useRef(open);
  const prevInitialDataRef = useRef(initialData);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    // Only fetch data if there are actual changes
    if (open !== prevOpenRef.current || JSON.stringify(initialData) !== JSON.stringify(prevInitialDataRef.current)) {
      if (open) {
        const newFormData = initialData ? { ...initialData } : { state: '', district: '', city: '' };

        // Use setTimeout to defer state updates and avoid cascading renders
        setTimeout(() => {
          setFormData(newFormData);
          setErrors({});
        }, 0);

        // Load districts and cities for initial data using direct store access
        const store = useRegionsStore.getState();
        if (newFormData.state) {
          store.fetchDistricts(newFormData.state);
        }
        if (newFormData.state && newFormData.district) {
          store.fetchCities(newFormData.state, newFormData.district);
        }
      }

      prevOpenRef.current = open;
      prevInitialDataRef.current = initialData ? { ...initialData } : undefined;
    }
  }, [open, initialData]); // Only depend on actual values

  // Handle state change
  const handleStateChange = (state: string) => {
    setFormData({ ...formData, state, district: '', city: '' });
    if (state) {
      const store = useRegionsStore.getState();
      store.fetchDistricts(state);
    }
    setErrors({});
  };

  // Handle district change
  const handleDistrictChange = (district: string) => {
    setFormData({ ...formData, district, city: '' });
    if (district && formData.state) {
      const store = useRegionsStore.getState();
      store.fetchCities(formData.state, district);
    }
    setErrors({});
  };

  // Handle city change
  const handleCityChange = (city: string) => {
    setFormData({ ...formData, city });
    setErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!formData.city.trim()) {
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

    onSubmit(formData);
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
              : 'Enter the state, district, and city information to add a new region.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select
              value={formData.state}
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
            <Label htmlFor="district">District *</Label>
            {formData.state ? (
              <div className="space-y-2">
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  placeholder="Enter district name"
                  disabled={isSubmitting}
                  className={errors.district ? 'border-destructive' : ''}
                />
                {districts.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Existing districts in {formData.state}: {districts.map(d => d.district).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <Input
                placeholder="Select a state first"
                disabled
                className={errors.district ? 'border-destructive' : ''}
              />
            )}
            {errors.district && (
              <p className="text-sm text-destructive">{errors.district}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            {formData.district && formData.state ? (
              <div className="space-y-2">
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder="Enter city name"
                  disabled={isSubmitting}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {cities.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Existing cities in {formData.district}: {cities.map(c => c.city).join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <Input
                placeholder="Enter district first"
                disabled
                className={errors.city ? 'border-destructive' : ''}
              />
            )}
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