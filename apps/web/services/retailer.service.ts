/**
 * Retailer Service
 * Handles CRUD operations for retailers with Supabase integration
 */

import {
    Retailer,
    RetailerInsert,
    RetailerListParams,
    RetailerListResponse,
    RetailerUpdate,
} from '@pgn/shared';
import { createClient } from '../utils/supabase/server';

/**
 * List retailers with pagination and filtering
 */
export async function listRetailers(
  params: RetailerListParams = {},
  regionFilter?: string[] // Array of region IDs the employee has access to
): Promise<RetailerListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 20,
    search,
    shop_name,
    email,
    phone,
    dealer_id,
    region_id,
    sort_by = 'updated_at',
    sort_order = 'desc'
  } = params;

  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('retailers')
    .select(`
      *,
      dealer:dealers(id, name, shop_name),
      region:regions(*)
    `, { count: 'exact' });

  // Apply search and filters
  // Note: search and phone are mutually exclusive
  // If phone is provided, use phone search only
  // If search is provided (and no phone), use general search
  if (phone) {
    query = query.ilike('phone', `%${phone}%`);
  } else if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,shop_name.ilike.%${search}%`);
  }

  if (shop_name) {
    query = query.ilike('shop_name', `%${shop_name}%`);
  }

  if (email) {
    query = query.ilike('email', `%${email}%`);
  }

  if (dealer_id) {
    query = query.eq('dealer_id', dealer_id);
  }

  // Apply region filter
  if (region_id) {
    query = query.eq('region_id', region_id);
  } else if (regionFilter && regionFilter.length > 0) {
    query = query.in('region_id', regionFilter);
  }

  // Apply sorting
  query = query.order(sort_by as never, { ascending: sort_order === 'asc' });

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;
  
  // Query executed successfully

  if (error) {
    console.error('Error fetching retailers:', error);
    throw new Error(`Failed to fetch retailers: ${error.message}`);
  }

  const retailers = data || [];
  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Extract created_by and updated_by IDs from retailers table
  const employeeIds = new Set<string>();
  const dealerIds = new Set<string>();
  retailers.forEach(retailer => {
    if (retailer.created_by) employeeIds.add(retailer.created_by);
    if (retailer.updated_by) employeeIds.add(retailer.updated_by);
    if (retailer.dealer_id) dealerIds.add(retailer.dealer_id);
  });

  // Fetch employee details using these array of IDs
  const employeesMap = new Map<string, { id: string; human_readable_user_id: string; first_name: string; last_name: string }>();
  if (employeeIds.size > 0) {
    const { data: employees } = await supabase
      .from('employees')
      .select('id, human_readable_user_id, first_name, last_name')
      .in('id', Array.from(employeeIds));

    employees?.forEach(employee => {
      employeesMap.set(employee.id, employee);
    });
  }

  // Fetch dealer details using these array of IDs
  const dealersMap = new Map<string, { id: string; name: string; shop_name?: string | null }>();
  if (dealerIds.size > 0) {
    const { data: dealers } = await supabase
      .from('dealers')
      .select('id, name, shop_name')
      .in('id', Array.from(dealerIds));

    dealers?.forEach(dealer => {
      dealersMap.set(dealer.id, dealer);
    });
  }

  // Attach employee and dealer details to retailers
  const retailersWithDetails = retailers.map(retailer => ({
    ...retailer,
    created_by_employee: retailer.created_by ? employeesMap.get(retailer.created_by) || null : null,
    updated_by_employee: retailer.updated_by ? employeesMap.get(retailer.updated_by) || null : null,
    dealer: retailer.dealer_id ? dealersMap.get(retailer.dealer_id) || null : null,
  }));

  return {
    retailers: retailersWithDetails,
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
    .select('*')
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
      dealer_id: retailerData.dealer_id || null, // Convert empty string to null
      created_by: (await supabase.auth.getUser()).data.user?.id,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select('*')
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
      dealer_id: retailerData.dealer_id || null, // Convert empty string to null
      updated_by: (await supabase.auth.getUser()).data.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
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
    .select('*')
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
export async function getRetailersWithCounts(): Promise<Retailer[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('retailers')
    .select('*');

  if (error) {
    console.error('Error fetching retailers with counts:', error);
    throw new Error(`Failed to fetch retailers with counts: ${error.message}`);
  }

  return data || [];
}