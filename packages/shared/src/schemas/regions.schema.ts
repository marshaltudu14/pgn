import { z } from 'zod';

export interface Region {
  id: string;
  state: string;
  city: string;
  state_slug: string;
  city_slug: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRegionRequest {
  state: string;
  city: string;
}

export interface UpdateRegionRequest {
  city?: string;
}

export interface RegionFilter {
  state?: string;
  city?: string;
  sort_by?: 'state' | 'city';
  sort_order?: 'asc' | 'desc';
}

export interface StateOption {
  state: string;
  state_slug: string;
}


export interface CityOption {
  city: string;
  city_slug: string;
}

// Zod schemas
export const createRegionSchema = z.object({
  state: z.string().min(1, 'State is required').max(100),
  city: z.string().min(1, 'City is required').max(100),
});

export const updateRegionSchema = z.object({
  city: z.string().min(1).max(100).optional(),
}).refine(
  (data) => data.city !== undefined,
  {
    message: "City must be provided",
  }
);

export const regionsQuerySchema = z.object({
  state: z.string().optional(),
  city: z.string().optional(),
  sort_by: z.enum(['state', 'city']).optional().default('city'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const searchRegionsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  sort_by: z.enum(['state', 'city']).optional().default('city'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Response schemas
export const RegionSchema = z.object({
  id: z.string().uuid(),
  state: z.string(),
  city: z.string(),
  state_slug: z.string(),
  city_slug: z.string(),
  created_at: z.string(), // Accept any datetime format from database
  updated_at: z.string(), // Accept any datetime format from database
});

export const RegionResponseSchema = z.object({
  id: z.string().uuid(),
  state: z.string(),
  city: z.string(),
  state_slug: z.string(),
  city_slug: z.string(),
  created_at: z.string(), // Accept any datetime format from database
  updated_at: z.string(), // Accept any datetime format from database
});

export const StateOptionSchema = z.object({
  state: z.string(),
  state_slug: z.string(),
});

export const StatesListResponseSchema = z.object({
  data: z.array(StateOptionSchema),
});


export const RegionDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Route parameter schemas
export const RegionIdParamSchema = z.object({
  id: z.string().uuid('Invalid region ID format'),
});