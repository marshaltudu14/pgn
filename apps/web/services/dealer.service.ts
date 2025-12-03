/**
 * Dealer Service
 * Handles CRUD operations for dealers with Supabase integration
 */

import {
  Dealer,
  DealerInsert,
  DealerUpdate,
  DealerListParams,
  DealerListResponse,
} from '@pgn/shared';
import { createClient } from '../utils/supabase/server';

/**
 * List dealers with pagination and filtering
 */
export async function listDealers(params: DealerListParams = {}): Promise<DealerListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 20,
    search,
    shop_name,
    email,
    phone,
    sort_by = 'created_at',
    sort_order = 'desc'
  } = params;

  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('dealers')
    .select(`
      *,
      created_by_employee:created_by (
        id,
        human_readable_user_id,
        first_name,
        last_name
      ),
      updated_by_employee:updated_by (
        id,
        human_readable_user_id,
        first_name,
        last_name
      )
    `, { count: 'exact' });

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

  // Apply sorting
  query = query.order(sort_by as never, { ascending: sort_order === 'asc' });

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching dealers:', error);
    throw new Error(`Failed to fetch dealers: ${error.message}`);
  }

  const dealers = data || [];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    dealers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

/**
 * Get a single dealer by ID
 */
export async function getDealerById(id: string): Promise<Dealer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching dealer:', error);
    throw new Error(`Failed to fetch dealer: ${error.message}`);
  }

  return data;
}

/**
 * Create a new dealer
 */
export async function createDealer(dealerData: DealerInsert): Promise<Dealer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dealers')
    .insert({
      ...dealerData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dealer:', error);
    throw new Error(`Failed to create dealer: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing dealer
 */
export async function updateDealer(id: string, dealerData: DealerUpdate): Promise<Dealer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dealers')
    .update({
      ...dealerData,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating dealer:', error);
    throw new Error(`Failed to update dealer: ${error.message}`);
  }

  return data;
}

/**
 * Delete a dealer
 */
export async function deleteDealer(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('dealers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting dealer:', error);
    throw new Error(`Failed to delete dealer: ${error.message}`);
  }
}

/**
 * Search dealers by name, shop name, email, or phone
 */
export async function searchDealers(query: string, limit: number = 10): Promise<Dealer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .or(`name.ilike.%${query}%,shop_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching dealers:', error);
    throw new Error(`Failed to search dealers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get dealers with their retailers count
 */
export async function getDealersWithRetailerCount(): Promise<(Dealer & { retailers_count: number })[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('dealers')
    .select(`
      *,
      retailers(count)
    `);

  if (error) {
    console.error('Error fetching dealers with retailer count:', error);
    throw new Error(`Failed to fetch dealers with retailer count: ${error.message}`);
  }

  return data?.map(dealer => ({
    ...dealer,
    retailers_count: dealer.retailers?.length || 0,
  })) || [];
}