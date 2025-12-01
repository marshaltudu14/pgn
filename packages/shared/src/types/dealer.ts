// Types for dealer, retailer, and farmer management
import { Database } from './supabase';
import { z } from 'zod';
import { BaseApiResponseSchema, RouteParamsSchema } from '../schemas/base';

// Base types from Supabase
export type Dealer = Database['public']['Tables']['dealers']['Row'];
export type DealerInsert = Database['public']['Tables']['dealers']['Insert'];
export type DealerUpdate = Database['public']['Tables']['dealers']['Update'];

export type Retailer = Database['public']['Tables']['retailers']['Row'];
export type RetailerInsert = Database['public']['Tables']['retailers']['Insert'];
export type RetailerUpdate = Database['public']['Tables']['retailers']['Update'];

export type Farmer = Database['public']['Tables']['farmers']['Row'];
export type FarmerInsert = Database['public']['Tables']['farmers']['Insert'];
export type FarmerUpdate = Database['public']['Tables']['farmers']['Update'];

// Enhanced types with relationships
export interface DealerWithRetailers extends Dealer {
  retailers?: RetailerWithFarmers[];
  retailers_count?: number;
}

export interface RetailerWithFarmers extends Retailer {
  dealer?: Dealer;
  farmers?: Farmer[];
  farmers_count?: number;
}

export interface FarmerWithRetailer extends Farmer {
  retailer?: Retailer;
  retailer_dealer?: Dealer;
}

// Form types
export interface DealerFormData {
  name: string;
  phone?: string;
  address?: string;
  shop_name?: string;
  email?: string;
}

export interface RetailerFormData {
  name: string;
  phone?: string;
  address?: string;
  shop_name?: string;
  email?: string;
  dealer_id?: string;
}

export interface FarmerFormData {
  name: string;
  phone?: string;
  address?: string;
  farm_name?: string;
  email?: string;
  retailer_id?: string;
}

// API Response types
export interface DealerListResponse {
  dealers: DealerWithRetailers[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface RetailerListResponse {
  retailers: RetailerWithFarmers[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface FarmerListResponse {
  farmers: FarmerWithRetailer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// List parameters type
export interface DealerListParams {
  page?: number;
  limit?: number;
  search?: string;
  shop_name?: string;
  email?: string;
  phone?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface RetailerListParams {
  page?: number;
  limit?: number;
  search?: string;
  shop_name?: string;
  email?: string;
  phone?: string;
  dealer_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FarmerListParams {
  page?: number;
  limit?: number;
  search?: string;
  farm_name?: string;
  email?: string;
  phone?: string;
  retailer_id?: string;
  dealer_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Filter and search types
export interface DealerFilters {
  search?: string;
  shop_name?: string;
  email?: string;
  phone?: string;
}

export interface RetailerFilters {
  search?: string;
  shop_name?: string;
  email?: string;
  phone?: string;
  dealer_id?: string;
}

export interface FarmerFilters {
  search?: string;
  farm_name?: string;
  email?: string;
  phone?: string;
  retailer_id?: string;
  dealer_id?: string;
}

// Zod schemas for API validation
export const DealerFormDataSchema = z.object({
  name: z.string().min(1, 'Dealer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  shop_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
});

export const RetailerFormDataSchema = z.object({
  name: z.string().min(1, 'Retailer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  shop_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  dealer_id: z.string().min(1, 'Dealer ID is required'),
});

export const FarmerFormDataSchema = z.object({
  name: z.string().min(1, 'Farmer name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  farm_name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  retailer_id: z.string().min(1, 'Retailer ID is required'),
});

export const DealerListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  shop_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const RetailerListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  shop_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  dealer_id: z.string().optional(),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const FarmerListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  farm_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  retailer_id: z.string().optional(),
  dealer_id: z.string().optional(),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});


export const DealerListResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    dealers: z.array(z.any()), // Will be typed as DealerWithRetailers[] at runtime
    pagination: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalItems: z.number(),
      itemsPerPage: z.number(),
    }),
  }),
});

export const RetailerListResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    retailers: z.array(z.any()), // Will be typed as RetailerWithFarmers[] at runtime
    pagination: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalItems: z.number(),
      itemsPerPage: z.number(),
    }),
  }),
});

export const FarmerListResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    farmers: z.array(z.any()), // Will be typed as FarmerWithRetailer[] at runtime
    pagination: z.object({
      currentPage: z.number(),
      totalPages: z.number(),
      totalItems: z.number(),
      itemsPerPage: z.number(),
    }),
  }),
});

// Individual retailer response schemas
export const RetailerResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as RetailerWithFarmers at runtime
});

export const RetailerCreatedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as RetailerWithFarmers at runtime
});

export const RetailerUpdatedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as RetailerWithFarmers at runtime
});

export const RetailerDeletedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.literal(null),
});

// Individual farmer response schemas
export const FarmerResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as FarmerWithRetailer at runtime
});

export const FarmerCreatedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as FarmerWithRetailer at runtime
});

export const FarmerUpdatedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.any(), // Will be typed as FarmerWithRetailer at runtime
});

export const FarmerDeletedResponseSchema = BaseApiResponseSchema.extend({
  success: z.literal(true),
  data: z.literal(null),
});

// Re-export RouteParamsSchema for convenience
export { RouteParamsSchema };