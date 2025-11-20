import { createClient } from '@/utils/supabase/server';
import {
  type Region,
  type CreateRegionRequest,
  type UpdateRegionRequest,
  type RegionFilter,
  type PaginationParams,
  type RegionsResponse,
  type StateOption,
  type DistrictOption,
  type CityOption,
} from '@pgn/shared';


/**
 * Create a new region
 */
export async function createRegion(data: CreateRegionRequest): Promise<Region> {
  const supabase = await createClient();

  // Check for exact duplicates (same state, district, and city)
  const { data: existingRegion } = await supabase
    .from('regions')
    .select('id')
    .eq('state', data.state)
    .eq('district', data.district)
    .eq('city', data.city)
    .single();

  if (existingRegion) {
    throw new Error('Region with this state, district, and city already exists');
  }

  // Create region - Supabase trigger will generate slugs automatically
  const { data: region, error } = await supabase
    .from('regions')
    .insert({
      state: data.state,
      district: data.district,
      city: data.city,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating region:', error);
    throw new Error('Failed to create region');
  }

  return region;
}

/**
 * Get all regions with pagination and filtering
 */
export async function getRegions(
  filters: RegionFilter = {},
  pagination: PaginationParams = {}
): Promise<RegionsResponse> {
  const supabase = await createClient();
  const page = pagination.page || 1;
  const limit = Math.min(pagination.limit || 20, 100); // Max 100 per request, default 20
  const offset = pagination.offset || ((page - 1) * limit);

  let query = supabase
    .from('regions')
    .select('*', { count: 'exact' })
    .order('state', { ascending: true })
    .order('district', { ascending: true })
    .order('city', { ascending: true });

  // Apply filters
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.district) {
    query = query.eq('district', filters.district);
  }
  if (filters.city) {
    query = query.ilike('city', `%${filters.city}%`);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching regions:', error);
    throw new Error('Failed to fetch regions');
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (offset + data.length) < (count || 0),
  };
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
  const updateData: Partial<UpdateRegionRequest> = {};

  if (data.district) {
    updateData.district = data.district;
  }

  if (data.city) {
    updateData.city = data.city;
  }

  // Check for duplicates (excluding current record)
  const { data: duplicateCheck } = await supabase
    .from('regions')
    .select('id')
    .eq('state', existingRegion.state)
    .eq('district', data.district || existingRegion.district)
    .eq('city', data.city || existingRegion.city)
    .neq('id', id)
    .single();

  if (duplicateCheck) {
    throw new Error('Region with this combination already exists');
  }

  // Update region
  const { data: updatedRegion, error } = await supabase
    .from('regions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating region:', error);
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
 * Get districts by state
 */
export async function getDistrictsByState(
  state: string
): Promise<DistrictOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regions')
    .select('district, district_slug')
    .eq('state', state)
    .not('district', 'is', null);

  if (error) {
    console.error('Error fetching districts:', error);
    throw new Error('Failed to fetch districts');
  }

  // Remove duplicates
  const uniqueDistricts = Array.from(
    new Map((data || []).map(item => [item.district, item])).values()
  );

  return uniqueDistricts;
}

/**
 * Get cities by district and state
 */
export async function getCitiesByDistrict(
  state: string,
  district: string
): Promise<CityOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('regions')
    .select('city, city_slug')
    .eq('state', state)
    .eq('district', district)
    .not('city', 'is', null);

  if (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }

  return data || [];
}

/**
 * Search regions by text (searches across all fields)
 */
export async function searchRegions(
  searchTerm: string,
  pagination: PaginationParams = {}
): Promise<RegionsResponse> {
  const supabase = await createClient();
  const page = pagination.page || 1;
  const limit = Math.min(pagination.limit || 20, 100);
  const offset = pagination.offset || ((page - 1) * limit);

  const { data, error, count } = await supabase
    .from('regions')
    .select('*', { count: 'exact' })
    .or(`state.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
    .order('state', { ascending: true })
    .order('district', { ascending: true })
    .order('city', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error searching regions:', error);
    throw new Error('Failed to search regions');
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (offset + data.length) < (count || 0),
  };
}