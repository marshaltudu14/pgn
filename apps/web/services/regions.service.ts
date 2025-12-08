import { createClient } from '@/utils/supabase/server';
import {
  type Region,
  type RegionSchema,
  type CreateRegionRequest,
  type UpdateRegionRequest,
  type RegionListParams,
  type RegionListResponse,
  type StateOption,
} from '@pgn/shared';


/**
 * Create a new region
 */
export async function createRegion(data: CreateRegionRequest): Promise<RegionSchema> {
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

  // Transform the data to include employee_count as a flat property (0 for new regions)
  return {
    ...region,
    employee_count: 0
  };
}

/**
 * Get regions with filtering and pagination
 */
export async function getRegions(
  params: RegionListParams = {}
): Promise<RegionListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 10,
    search,
    state,
    city,
    sort_by = 'city',
    sort_order = 'asc'
  } = params;

  // Calculate pagination
  const offset = (page - 1) * limit;

  let query = supabase
    .from('regions')
    .select('*', { count: 'exact' });

  // Apply search filter (searches both state and city)
  if (search) {
    query = query.or(`state.ilike.%${search}%,city.ilike.%${search}%`);
  }

  // Apply specific filters
  if (state) {
    query = query.eq('state', state);
  }
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  // Apply sorting (employee_count sorting not supported at database level)
  if (sort_by !== 'employee_count') {
    query = query.order(sort_by, { ascending: sort_order === 'asc' });
  } else {
    // Default to city sorting if employee_count is requested
    query = query.order('city', { ascending: sort_order === 'asc' });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching regions:', error);
    throw new Error('Failed to fetch regions');
  }

  // Get employee counts for all regions
  const regionIds = (data || []).map(region => region.id);
  let employeeCounts: Record<string, number> = {};

  if (regionIds.length > 0) {
    const { data: counts } = await supabase
      .from('employee_regions')
      .select('region_id')
      .in('region_id', regionIds);

    // Count employees per region
    employeeCounts = (counts || []).reduce((acc, { region_id }) => {
      acc[region_id] = (acc[region_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Transform the data to include employee_count as a flat property
  const regions: RegionSchema[] = (data || []).map(region => ({
    ...region,
    employee_count: employeeCounts[region.id] || 0
  }));

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    regions,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}


/**
 * Get region by ID
 */
export async function getRegionById(id: string): Promise<RegionSchema | null> {
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

  if (!data) {
    return null;
  }

  // Get employee count for this region
  let employeeCount = 0;
  if (data) {
    const { data: counts } = await supabase
      .from('employee_regions')
      .select('region_id')
      .eq('region_id', id);

    employeeCount = (counts || []).length;
  }

  // Transform the data to include employee_count as a flat property
  return {
    ...data,
    employee_count: employeeCount
  };
}

/**
 * Update region
 */
export async function updateRegion(
  id: string,
  data: UpdateRegionRequest
): Promise<RegionSchema> {
  const supabase = await createClient();

  // Get existing region first
  const existingRegion = await getRegionById(id);
  if (!existingRegion) {
    throw new Error('Region not found');
  }

  // Prepare update data - Supabase trigger will update slugs automatically
  const updateData: Partial<Region> = {
    state: data.state,
    city: data.city,
  };

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

  // Get employee count for the updated region
  let employeeCount = 0;
  const { data: counts } = await supabase
    .from('employee_regions')
    .select('region_id')
    .eq('region_id', id);

  employeeCount = (counts || []).length;

  // Transform the data to include employee_count as a flat property
  return {
    ...updatedRegion,
    employee_count: employeeCount
  };
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

    // Sort states alphabetically A-Z
    const sortedStates = statesData.sort((a: string, b: string) => a.localeCompare(b));

    return sortedStates.map((state: string) => ({
      state: state,
      state_slug: state.toLowerCase().replace(/\s+/g, '-')
    }));
  } catch (error) {
    console.error('Error fetching states:', error);
    throw new Error('Failed to fetch states');
  }
}


/**
 * Search regions by city only with database-level sorting and pagination
 */
export async function searchRegions(
  searchTerm: string,
  params: Omit<RegionListParams, 'search'> = {}
): Promise<RegionListResponse> {
  const supabase = await createClient();

  const {
    page = 1,
    limit = 10,
    sort_by = 'city',
    sort_order = 'asc'
  } = params;

  // Calculate pagination
  const offset = (page - 1) * limit;

  const query = supabase
    .from('regions')
    .select(`
      *,
      employee_count:employee_regions(count)
    `, { count: 'exact' })
    .ilike('city', `%${searchTerm}%`)
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching regions:', error);
    throw new Error('Failed to search regions');
  }

  // Get employee counts for all regions
  const regionIds = (data || []).map(region => region.id);
  let employeeCounts: Record<string, number> = {};

  if (regionIds.length > 0) {
    const { data: counts } = await supabase
      .from('employee_regions')
      .select('region_id')
      .in('region_id', regionIds);

    // Count employees per region
    employeeCounts = (counts || []).reduce((acc, { region_id }) => {
      acc[region_id] = (acc[region_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  // Transform the data to include employee_count as a flat property
  const regions: RegionSchema[] = (data || []).map(region => ({
    ...region,
    employee_count: employeeCounts[region.id] || 0
  }));

  const totalItems = count || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    regions,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
  };
}

// Get regions that an employee has access to based on assigned_cities
export async function getEmployeeRegions(employeeId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from('employees')
    .select('assigned_cities')
    .eq('id', employeeId)
    .single();

  if (error || !employee) {
    throw new Error('Employee not found');
  }

  const assignedCities = employee.assigned_cities as { city: string; state: string }[] || [];

  // Get region IDs for assigned cities
  const cityNames = assignedCities.map(ac => ac.city);

  if (cityNames.length === 0) {
    return [];
  }

  const { data: regions, error: regionError } = await supabase
    .from('regions')
    .select('id')
    .in('city', cityNames);

  if (regionError) {
    console.error('Error fetching employee regions:', regionError);
    throw new Error('Failed to fetch employee regions');
  }

  return regions?.map(r => r.id) || [];
}

// Check if an employee has access to a specific region
export async function canEmployeeAccessRegion(employeeId: string, regionId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: employee, error } = await supabase
    .from('employees')
    .select('assigned_cities')
    .eq('id', employeeId)
    .single();

  if (error || !employee) {
    return false;
  }

  const assignedCities = employee.assigned_cities as { city: string; state: string }[] || [];

  if (assignedCities.length === 0) {
    return false;
  }

  // Get the city for the region
  const { data: region, error: regionError } = await supabase
    .from('regions')
    .select('city')
    .eq('id', regionId)
    .single();

  if (regionError || !region) {
    return false;
  }

  // Check if the region's city is in the employee's assigned cities
  return assignedCities.some(ac => ac.city === region.city);
}