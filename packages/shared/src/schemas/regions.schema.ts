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
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface RegionsResponse {
  data: Region[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  state: z.string().optional(),
  city: z.string().optional(),
});

export const searchRegionsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// Response schemas
export const RegionSchema = z.object({
  id: z.string().uuid(),
  state: z.string(),
  city: z.string(),
  state_slug: z.string(),
  city_slug: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const RegionsListResponseSchema = z.object({
  data: z.array(RegionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

export const RegionResponseSchema = z.object({
  id: z.string().uuid(),
  state: z.string(),
  city: z.string(),
  state_slug: z.string(),
  city_slug: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const StateOptionSchema = z.object({
  state: z.string(),
  state_slug: z.string(),
});

export const StatesListResponseSchema = z.object({
  data: z.array(StateOptionSchema),
});

export const RegionSearchResponseSchema = z.object({
  data: z.array(RegionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

export const RegionDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Route parameter schemas
export const RegionIdParamSchema = z.object({
  id: z.string().uuid('Invalid region ID format'),
});