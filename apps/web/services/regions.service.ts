import { createClient } from '@/utils/supabase/server';
import {
  type Region,
  type CreateRegionRequest,
  type UpdateRegionRequest,
  type RegionFilter,
  type StateOption,
} from '@pgn/shared';


/**
 * Create a new region
 */
export async function createRegion(data: CreateRegionRequest): Promise<Region> {
  const supabase = await createClient();

  // Create region - Supabase trigger will generate slugs automatically
  // Database unique constraint on (state, city) will handle duplicates
  const { data: region, error } = await supabase
    .from('regions')
    .insert({
      state: data.state,
      city: data.city,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating region:', error);

    // Handle specific duplicate key error
    if (error.code === '23505' && error.message.includes('unique_state_city')) {
      throw new Error('A region with this state and city combination already exists');
    }

    throw new Error('Failed to create region');
  }

  return region;
}

/**
 * Get all regions with filtering (limited to 10 results)
 */
export async function getRegions(
  filters: RegionFilter = {}
): Promise<Region[]> {
  const supabase = await createClient();

  let query = supabase
    .from('regions')
    .select('*')
    .limit(10); // Always limit to 10 results

  // Apply sorting
  const sortBy = filters.sort_by || 'city';
  const sortOrder = filters.sort_order || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply filters
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching regions:', error);
    throw new Error('Failed to fetch regions');
  }

  return data || [];
}

/**
 * Get region by ID
 */
export async function getRegionById(id: string): Promise<Region | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    console.error('Error fetching region:', error);
    throw new Error('Failed to fetch region');
  }

  return data;
}

/**
 * Update region
 */
export async function updateRegion(
  id: string,
  data: UpdateRegionRequest
): Promise<Region> {
  const supabase = await createClient();

  // Get existing region first
  const existingRegion = await getRegionById(id);
  if (!existingRegion) {
    throw new Error('Region not found');
  }

  // Prepare update data - Supabase trigger will update slugs automatically
  const updateData: Partial<Region> = {};

  if (data.city) {
    updateData.city = data.city;
  }

  // Update region - Database unique constraint will handle duplicates
  const { data: updatedRegion, error } = await supabase
    .from('regions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating region:', error);

    // Handle specific duplicate key error
    if (error.code === '23505' && error.message.includes('unique_state_city')) {
      throw new Error('A region with this state and city combination already exists');
    }

    throw new Error('Failed to update region');
  }

  return updatedRegion;
}

/**
 * Delete region
 */
export async function deleteRegion(id: string): Promise<void> {
  const supabase = await createClient();

  // Check if region exists
  const existingRegion = await getRegionById(id);
  if (!existingRegion) {
    throw new Error('Region not found');
  }

  const { error } = await supabase
    .from('regions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting region:', error);
    throw new Error('Failed to delete region');
  }
}

/**
 * Get all states (distinct)
 */
export async function getStates(): Promise<StateOption[]> {
  try {
    // Read states from local JSON file
    const statesPath = process.cwd() + '/public/states.json';
    const fs = await import('fs');
    const statesData = JSON.parse(fs.readFileSync(statesPath, 'utf8'));

    return statesData.map((state: string) => ({
      state: state,
      state_slug: state.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error fetching states:', error);
    throw new Error('Failed to fetch states');
  }
}


/**
 * Search regions by city only with database-level sorting (limited to 10 results)
 */
export async function searchRegions(
  searchTerm: string,
  filters: RegionFilter = {}
): Promise<Region[]> {
  const supabase = await createClient();

  let query = supabase
    .from('regions')
    .select('*')
    .ilike('city', `%${searchTerm}%`)
    .limit(10); // Always limit to 10 results

  // Apply sorting
  const sortBy = filters.sort_by || 'city';
  const sortOrder = filters.sort_order || 'asc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error searching regions:', error);
    throw new Error('Failed to search regions');
  }

  return data || [];
}