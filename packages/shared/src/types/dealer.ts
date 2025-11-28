// Types for dealer, retailer, and farmer management
import { Database } from './supabase';

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
  dealer_id: string;
}

export interface FarmerFormData {
  name: string;
  phone?: string;
  address?: string;
  farm_name?: string;
  email?: string;
  retailer_id: string;
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