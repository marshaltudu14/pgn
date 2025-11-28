/**
 * Retailer Service
 * Handles CRUD operations for retailers with Supabase integration
 */

import {
  Retailer,
  RetailerInsert,
  RetailerUpdate,
  RetailerListParams,
  RetailerListResponse,
} from '@pgn/shared';
import { createClient } from '../utils/supabase/server';

/**
 * List retailers with pagination and filtering
 */
export async function listRetailers(params: RetailerListParams = {}): Promise<RetailerListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 20,
    search,
    shop_name,
    email,
    phone,
    dealer_id,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = params;

  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('retailers')
    .select('*', { count: 'exact' });

  // Apply search and filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,shop_name.ilike.%${search}%`);
  }

  if (shop_name) {
    query = query.ilike('shop_name', `%${shop_name}%`);
  }

  if (email) {
    query = query.ilike('email', `%${email}%`);
  }

  if (phone) {
    query = query.ilike('phone', `%${phone}%`);
  }

  if (dealer_id) {
    query = query.eq('dealer_id', dealer_id);
  }

  // Apply sorting
  query = query.order(sort_by as never, { ascending: sort_order === 'asc' });

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching retailers:', error);
    throw new Error(`Failed to fetch retailers: ${error.message}`);
  }

  const retailers = data || [];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    retailers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

/**
 * Get a single retailer by ID
 */
export async function getRetailerById(id: string): Promise<Retailer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .select(`
      *,
      dealer:dealers(name, shop_name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching retailer:', error);
    throw new Error(`Failed to fetch retailer: ${error.message}`);
  }

  return data;
}

/**
 * Create a new retailer
 */
export async function createRetailer(retailerData: RetailerInsert): Promise<Retailer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .insert({
      ...retailerData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select(`
      *,
      dealer:dealers(name, shop_name)
    `)
    .single();

  if (error) {
    console.error('Error creating retailer:', error);
    throw new Error(`Failed to create retailer: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing retailer
 */
export async function updateRetailer(id: string, retailerData: RetailerUpdate): Promise<Retailer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .update({
      ...retailerData,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      dealer:dealers(name, shop_name)
    `)
    .single();

  if (error) {
    console.error('Error updating retailer:', error);
    throw new Error(`Failed to update retailer: ${error.message}`);
  }

  return data;
}

/**
 * Delete a retailer
 */
export async function deleteRetailer(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('retailers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting retailer:', error);
    throw new Error(`Failed to delete retailer: ${error.message}`);
  }
}

/**
 * Search retailers by name, shop name, email, or phone
 */
export async function searchRetailers(query: string, limit: number = 10): Promise<Retailer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .select(`
      *,
      dealer:dealers(name, shop_name)
    `)
    .or(`name.ilike.%${query}%,shop_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching retailers:', error);
    throw new Error(`Failed to search retailers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get retailers with their dealer and farmer counts
 */
export async function getRetailersWithCounts(): Promise<(Retailer & {
  dealer?: {
    name: string;
    shop_name: string | null;
  } | null;
  farmers_count: number;
})[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .select(`
      *,
      dealer:dealers(name, shop_name),
      farmers(count)
    `);

  if (error) {
    console.error('Error fetching retailers with counts:', error);
    throw new Error(`Failed to fetch retailers with counts: ${error.message}`);
  }

  return data?.map((retailer: Retailer & { farmers?: unknown[] }) => ({
    ...retailer,
    farmers_count: retailer.farmers?.length || 0,
  })) || [];
}