import { z } from 'zod';

/**
 * Base API response schema for consistent API responses
 */
export const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  data: z.any().optional(),
});

export type BaseApiResponse = z.infer<typeof BaseApiResponseSchema>;

/**
 * Base API error response schema
 */
export const BaseApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
});

export type BaseApiErrorResponse = z.infer<typeof BaseApiErrorResponseSchema>;

/**
 * Pagination parameters schema
 */
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Sort parameters schema
 */
export const SortParamsSchema = z.object({
  sort_by: z.string().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type SortParams = z.infer<typeof SortParamsSchema>;

/**
 * Search parameters schema
 */
export const SearchParamsSchema = z.object({
  search: z.string().optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

/**
 * Combined list parameters schema
 */
export const ListParamsSchema = PaginationParamsSchema.merge(SortParamsSchema).merge(SearchParamsSchema);

export type ListParams = z.infer<typeof ListParamsSchema>;

/**
 * Route parameter schema for dynamic routes
 */
export const RouteParamsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/**
 * Route parameter schema for UUID routes
 */
export const UuidRouteParamsSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

export type RouteParams = z.infer<typeof RouteParamsSchema>;

/**
 * File upload schema
 */
export const FileUploadSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().min(0),
  data: z.string().optional(), // Base64 encoded data
  url: z.string().optional(),
});

export type FileUpload = z.infer<typeof FileUploadSchema>;


/**
 * Location data schema
 */
export const LocationDataSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  timestamp: z.union([z.date(), z.string().datetime(), z.number()]),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  address: z.string().optional(),
});

export type LocationData = z.infer<typeof LocationDataSchema>;