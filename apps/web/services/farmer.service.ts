/**
 * Farmer Service
 * Handles CRUD operations for farmers with Supabase integration
 */

import {
  Farmer,
  FarmerInsert,
  FarmerUpdate,
  FarmerListParams,
  FarmerListResponse,
} from '@pgn/shared';
import { createClient } from '../utils/supabase/server';

/**
 * List farmers with pagination and filtering
 */
export async function listFarmers(params: FarmerListParams = {}): Promise<FarmerListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 20,
    search,
    farm_name,
    email,
    phone,
    retailer_id,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = params;

  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('farmers')
    .select('*', { count: 'exact' });

  // Apply search and filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,farm_name.ilike.%${search}%`);
  }

  if (farm_name) {
    query = query.ilike('farm_name', `%${farm_name}%`);
  }

  if (email) {
    query = query.ilike('email', `%${email}%`);
  }

  if (phone) {
    query = query.ilike('phone', `%${phone}%`);
  }

  if (retailer_id) {
    query = query.eq('retailer_id', retailer_id);
  }

  // Apply sorting
  query = query.order(sort_by as never, { ascending: sort_order === 'asc' });

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching farmers:', error);
    throw new Error(`Failed to fetch farmers: ${error.message}`);
  }

  const farmers = data || [];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    farmers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

/**
 * Get a single farmer by ID
 */
export async function getFarmerById(id: string): Promise<Farmer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching farmer:', error);
    throw new Error(`Failed to fetch farmer: ${error.message}`);
  }

  return data;
}

/**
 * Create a new farmer
 */
export async function createFarmer(farmerData: FarmerInsert): Promise<Farmer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('farmers')
    .insert({
      ...farmerData,
      retailer_id: farmerData.retailer_id || null, // Convert empty string to null
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating farmer:', error);
    throw new Error(`Failed to create farmer: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing farmer
 */
export async function updateFarmer(id: string, farmerData: FarmerUpdate): Promise<Farmer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('farmers')
    .update({
      ...farmerData,
      retailer_id: farmerData.retailer_id || null, // Convert empty string to null
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating farmer:', error);
    throw new Error(`Failed to update farmer: ${error.message}`);
  }

  return data;
}

/**
 * Delete a farmer
 */
export async function deleteFarmer(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('farmers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting farmer:', error);
    throw new Error(`Failed to delete farmer: ${error.message}`);
  }
}

/**
 * Search farmers by name, farm name, email, or phone
 */
export async function searchFarmers(query: string, limit: number = 10): Promise<Farmer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .or(`name.ilike.%${query}%,farm_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching farmers:', error);
    throw new Error(`Failed to search farmers: ${error.message}`);
  }

  return data || [];
}