/**
 * Employee Service
 * Handles CRUD operations for employees with Supabase integration
 */

import {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ChangeEmploymentStatusRequest,
  EmployeeListParams,
  EmployeeListResponse,
} from '@pgn/shared';
import {
  Database,
  TablesInsert,
  TablesUpdate,
} from '@pgn/shared';
type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = TablesInsert<'employees'>;
type EmployeeUpdate = TablesUpdate<'employees'>;


import { createClient } from '../utils/supabase/server';
import { createAuthUser, resetUserPassword, getUserByEmail, updateUserPasswordByEmail } from '../utils/supabase/admin';

/**
 * Get the next user ID sequence for the current year
 */
async function getNextUserIdSequence(): Promise<number> {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PGN-${currentYear}-`;

  const { data, error } = await supabase
    .from('employees')
    .select('human_readable_user_id')
    .like('human_readable_user_id', `${yearPrefix}%`)
    .order('human_readable_user_id', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error getting next user ID sequence:', error);
    return 1;
  }

  if (!data || data.length === 0) {
    return 1;
  }

  const lastUserId = data[0].human_readable_user_id;
  const match = lastUserId.match(/^PGN-\d{4}-(\d{4})$/);

  if (!match) {
    return 1;
  }

  return parseInt(match[1], 10) + 1;
}

/**
 * Generate a new human-readable user ID
 */
export async function generateHumanReadableUserId(): Promise<string> {
  const sequence = await getNextUserIdSequence();
  const currentYear = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `PGN-${currentYear}-${paddedSequence}`;
}

/**
 * Create a new employee
 */
export async function createEmployee(
  createData: CreateEmployeeRequest
): Promise<Employee> {
  // Password is required for both creating new auth users and updating existing ones
  if (!createData.password) {
    throw new Error('Password is required for creating new employee');
  }

  // Clean phone number before processing
  const cleanPhone = createData.phone
    ? createData.phone.replace(/\D/g, '').slice(-10)
    : '';

  let authUserId: string | null = null;
  let isNewAuthUser = false;

  try {
    // Step 1: Comprehensive validation - check both employee table and auth users
    const [existingEmployee, existingAuthUser] = await Promise.all([
      getEmployeeByEmail(createData.email),
      getUserByEmail(createData.email)
    ]);

    if (existingEmployee && existingAuthUser.success && existingAuthUser.data) {
      throw new Error('An employee with this email address already exists in the system. Please use the edit functionality to update their information.');
    }

    if (existingAuthUser.success && existingAuthUser.data && !existingEmployee) {
      throw new Error('A user with this email address exists in the authentication system but not in the employee database. This requires manual administrator intervention to resolve the data inconsistency.');
    }

    // Step 2: Check phone number uniqueness (if provided)
    if (cleanPhone) {
      const phoneTaken = await isPhoneTaken(cleanPhone);
      if (phoneTaken) {
        throw new Error('An employee with this phone number already exists in the system.');
      }
    }

    // Step 3: Create or update auth user
    if (existingAuthUser.success && existingAuthUser.data) {
      // Auth user exists, update their password and use their ID
      authUserId = existingAuthUser.data.id;

      const updateResult = await updateUserPasswordByEmail(
        createData.email,
        createData.password
      );

      if (!updateResult.success) {
        throw new Error(
          `Failed to update existing auth user password: ${updateResult.error || 'Unknown error'}`
        );
      }
    } else {
      // Create new auth user
      isNewAuthUser = true;
      const authResult = await createAuthUser(
        createData.email,
        createData.password
      );

      if (!authResult.success) {
        const errorMessage = authResult.error as string;
        if (errorMessage && errorMessage.includes('user_already_exists')) {
          throw new Error('A user with this email address already exists in the authentication system. Please check if there is a data inconsistency.');
        }
        throw new Error(
          `Failed to create auth user: ${errorMessage || 'Unknown error'}`
        );
      }

      authUserId = authResult.data?.user?.id || null;

      if (!authUserId) {
        throw new Error('Failed to get auth user ID after creation');
      }
    }
  } catch (error) {
    console.error('Error creating/updating auth user:', error);
    throw error; // Re-throw to let caller handle
  }

  try {
    const supabase = await createClient();

    // Generate human readable user ID
    const humanReadableUserId = await generateHumanReadableUserId();

    // Step 4: Create employee record with auth user ID as the primary key
    const employeeData: EmployeeInsert = {
      id: authUserId, // Use auth user ID directly as employee ID
      human_readable_user_id: humanReadableUserId,
      first_name: createData.first_name,
      last_name: createData.last_name,
      email: createData.email,
      phone: cleanPhone, // Use cleaned phone number
      employment_status: createData.employment_status || 'ACTIVE',
      can_login: createData.can_login ?? true,
      };

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) {
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to create employee';

      if (error.message.includes('duplicate key')) {
        if (error.message.includes('email')) {
          errorMessage = 'An employee with this email address already exists in the system.';
        } else if (error.message.includes('phone')) {
          errorMessage = 'An employee with this phone number already exists in the system.';
        } else {
          errorMessage = 'A record with these details already exists in the system.';
        }
      } else if (error.message.includes('new row violates row-level security policy')) {
        errorMessage = 'You do not have permission to create employees. Please contact your administrator.';
      } else {
        errorMessage = `Failed to create employee: ${error.message}`;
      }

      // CRITICAL: Log the state for potential cleanup
      if (authUserId) {
        console.error(
          `Employee creation failed for auth user ID ${authUserId}. Manual cleanup may be required. Error: ${error.message}`
        );

        if (isNewAuthUser) {
          console.warn(
            `Newly created auth user ${authUserId} may need manual cleanup as employee creation failed.`
          );
        }
      }

      throw new Error(errorMessage);
    }

    // Step 5: Create region assignments if provided
    if (createData.assigned_regions && createData.assigned_regions.length > 0) {
      // Create region assignments in the junction table
      const supabase = await createClient();

      for (const regionId of createData.assigned_regions) {
        const { error } = await supabase
          .from('employee_regions')
          .insert({
            employee_id: authUserId!,
            region_id: regionId,
          });

        if (error) {
          console.error(`Failed to assign region ${regionId} to employee ${authUserId}:`, error);
        }
      }
    }

    return data; // Return the database row directly
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid employee ID');
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error getting employee:', error);
      throw new Error(`Failed to get employee: ${error.message}`);
    }

    return data; // Return the database row directly
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    throw error;
  }
}

/**
 * Get employee by human readable ID
 */
export async function getEmployeeByHumanReadableId(
  humanReadableId: string
): Promise<Employee | null> {
  if (!humanReadableId || typeof humanReadableId !== 'string' || humanReadableId.trim() === '') {
    throw new Error('Invalid human readable ID');
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('human_readable_user_id', humanReadableId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error getting employee by human readable ID:', error);
      throw new Error(`Failed to get employee: ${error.message}`);
    }

    return data; // Return the database row directly
  } catch (error) {
    console.error('Error in getEmployeeByHumanReadableId:', error);
    throw error;
  }
}

/**
 * Get employee by email
 */
export async function getEmployeeByEmail(
  email: string
): Promise<Employee | null> {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    throw new Error('Invalid email');
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error getting employee by email:', error);
      throw new Error(`Failed to get employee: ${error.message}`);
    }

    return data; // Return the database row directly
  } catch (error) {
    console.error('Error in getEmployeeByEmail:', error);
    throw error;
  }
}

/**
 * List employees with filtering and pagination
 */
export async function listEmployees(
  params: EmployeeListParams
): Promise<EmployeeListResponse> {
  try {
    const supabase = await createClient();

    const {
      page = 1,
      limit = 50,
      search,
      search_field = 'human_readable_user_id',
      employment_status,
      assigned_regions,
      sort_by = 'updated_at',
      sort_order = 'desc',
    } = params;

    // Build base query - select all employees
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    // If regions are specified, filter by those regions
    if (assigned_regions && assigned_regions.length > 0) {
      // This inner join ensures we only return employees assigned to the selected regions
      query = supabase
        .from('employees')
        .select(`
          *,
          employee_regions!inner (
            region_id
          )
        `, { count: 'exact' })
        .in('employee_regions.region_id', assigned_regions);
    }

    // Apply search filter based on specific field using case-insensitive search
    if (search) {
      switch (search_field) {
        case 'first_name':
          query = query.ilike('first_name', `%${search}%`);
          break;
        case 'last_name':
          query = query.ilike('last_name', `%${search}%`);
          break;
        case 'email':
          query = query.ilike('email', `%${search}%`);
          break;
        case 'phone':
          query = query.ilike('phone', `%${search}%`);
          break;
        case 'human_readable_user_id':
        default:
          query = query.ilike('human_readable_user_id', `%${search}%`);
          break;
      }
    }

    // Apply employment status filter
    if (employment_status && employment_status.length > 0) {
      query = query.in('employment_status', employment_status);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing employees:', error);
      throw new Error(`Failed to list employees: ${error.message}`);
    }

    const employees = data || []; // Return database rows directly

    // Fetch all assigned regions for each employee
    const employeesWithRegions = await Promise.all(
      employees.map(async (employee) => {
        // Get all regions with region details using proper join syntax
        const { data: regionData, error: regionError } = await supabase
          .from('employee_regions')
          .select(`
            regions (
              id,
              city,
              state
            )
          `)
          .eq('employee_id', employee.id)
          .order('created_at', { ascending: false });

        if (regionError) {
          console.error(`Error fetching regions for employee ${employee.id}:`, regionError);
        }

        const mappedRegions = (regionData || []).map((item: { regions: { id: string; city: string; state: string } | { id: string; city: string; state: string }[] }) => {
          const regions = item.regions;
          if (!regions) return [];

          // Handle both single region object and array of regions
          const regionsArray = Array.isArray(regions) ? regions : [regions];

          return regionsArray
            .map((region) => ({
              id: region?.id || '',
              city: region?.city || '',
              state: region?.state || ''
            }));
        }).flat().filter((r) => !!r.id && !!r.city && !!r.state);

      const result = {
          ...employee,
          assigned_regions: {
            regions: mappedRegions,
            total_count: mappedRegions.length
          }
        };

        return result;
      })
    );

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      employees: employeesWithRegions,
      total,
      page,
      limit,
      hasMore,
    };
  } catch (error) {
    console.error('Error in listEmployees:', error);
    throw error;
  }
}

/**
 * Update employee information
 */
export async function updateEmployee(
  id: string,
  updateData: UpdateEmployeeRequest
): Promise<Employee> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid employee ID');
  }

  try {
    const supabase = await createClient();

    // Prepare update data for database using proper types
    const employeeData: EmployeeUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.first_name !== undefined)
      employeeData.first_name = updateData.first_name;
    if (updateData.last_name !== undefined)
      employeeData.last_name = updateData.last_name;
    if (updateData.email !== undefined) employeeData.email = updateData.email;
    if (updateData.phone !== undefined) employeeData.phone = updateData.phone;
    if (updateData.employment_status !== undefined)
      employeeData.employment_status = updateData.employment_status;
    if (updateData.can_login !== undefined)
      employeeData.can_login = updateData.can_login;
  
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      throw new Error(`Failed to update employee: ${error.message}`);
    }

    // Note: Region assignments are handled separately via updateRegionalAssignments function
    // This allows for more flexible updates without affecting junction table unnecessarily

    return data; // Return the database row directly
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    throw error;
  }
}

/**
 * Change employment status
 */
export async function changeEmploymentStatus(
  id: string,
  statusChange: ChangeEmploymentStatusRequest
): Promise<Employee> {
  try {
    const updateData: UpdateEmployeeRequest = {
      employment_status: statusChange.employment_status,
      // Automatically set can_login based on status
      can_login:
        statusChange.employment_status === 'ACTIVE' ||
        statusChange.employment_status === 'ON_LEAVE',
    };

    const employee = await updateEmployee(id, updateData);

    // Log the status change

    return employee;
  } catch (error) {
    console.error('Error in changeEmploymentStatus:', error);
    throw error;
  }
}

/**
 * Update regional assignments using junction table
 * @deprecated - Region assignments are now handled differently
 */
export async function updateRegionalAssignments(
  id: string,
  regionalAssignment: { assigned_regions?: string[] }
): Promise<Employee> {
  const supabase = await createClient();

  try {
    // Start a transaction
    const { error: deleteError } = await supabase
      .from('employee_regions')
      .delete()
      .eq('employee_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete existing region assignments: ${deleteError.message}`);
    }

    // Insert new assignments if provided
    if (regionalAssignment.assigned_regions && regionalAssignment.assigned_regions.length > 0) {
      const newAssignments = regionalAssignment.assigned_regions.map(regionId => ({
        employee_id: id,
        region_id: regionId,
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('employee_regions')
        .insert(newAssignments);

      if (insertError) {
        throw new Error(`Failed to insert new region assignments: ${insertError.message}`);
      }
    }

    // Return the updated employee
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch updated employee: ${fetchError.message}`);
    }

    return employee;
  } catch (error) {
    console.error('Error in updateRegionalAssignments:', error);
    throw error;
  }
}

/**
 * Get employee's assigned regions
 */
export async function getEmployeeRegions(
  employeeId: string
): Promise<{ id: string; city: string; state: string }[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('employee_regions')
      .select(`
        regions!inner (
          id,
          city,
          state
        )
      `)
      .eq('employee_id', employeeId);

    if (error) {
      throw new Error(`Failed to fetch employee regions: ${error.message}`);
    }

    // The data comes back as an array of objects with regions property
    return data?.map(item => {
      const region = item.regions;
      if (!region || !Array.isArray(region) || region.length === 0) {
        return null;
      }
      const regionData = region[0];
      if (!regionData || typeof regionData.id !== 'string' || typeof regionData.city !== 'string' || typeof regionData.state !== 'string') {
        return null;
      }
      return { id: regionData.id, city: regionData.city, state: regionData.state };
    }).filter(region => region !== null) || [];
  } catch (error) {
    console.error('Error in getEmployeeRegions:', error);
    throw error;
  }
}

/**
 * Check if email is already taken by another employee
 */
export async function isEmailTaken(
  email: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    if (!email || typeof email !== 'string') {
      return false;
    }

    let query = supabase
      .from('employees')
      .select('id')
      .eq('email', email.toLowerCase().trim());

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('Error checking email availability:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Error in isEmailTaken:', error);
    return false;
  }
}

/**
 * Check if phone number is already taken by another employee
 */
export async function isPhoneTaken(
  phone: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Clean phone number - remove formatting, keep digits only
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return false; // Invalid phone number format
    }

    let query = supabase
      .from('employees')
      .select('id')
      .eq('phone', cleanPhone);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('Error checking phone availability:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Error in isPhoneTaken:', error);
    return false;
  }
}

/**
 * Check if human readable user ID is already taken
 */
export async function isHumanReadableIdTaken(
  humanReadableId: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('employees')
      .select('id')
      .eq('human_readable_user_id', humanReadableId);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error('Error checking human readable ID availability:', error);
      return false;
    }

    return !!(data && data.length > 0);
  } catch (error) {
    console.error('Error in isHumanReadableIdTaken:', error);
    return false;
  }
}

/**
 * Reset employee password
 */
export async function resetEmployeePassword(
  employeeId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate employee ID first
    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      return { success: false, error: 'Employee not found' };
    }

    // Step 1: Get employee by ID to get their email
    const employee = await getEmployeeById(employeeId);

    if (!employee) {
      return { success: false, error: 'Employee not found' };
    }

    // Step 2: Reset auth user password using email
    const authResult = await resetUserPassword(employee.email, newPassword);

    if (!authResult.success) {
      return {
        success: false,
        error: (authResult.error as string) || 'Failed to reset password',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in resetEmployeePassword:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch employee regions
 * Returns all regions assigned to an employee
 */
export async function fetchEmployeeRegions(
  employeeId: string
): Promise<Database['public']['Tables']['regions']['Row'][]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('employee_regions')
      .select(`
        regions (
          id,
          city,
          state,
          state_slug,
          city_slug,
          created_at,
          updated_at
        )
      `)
      .eq('employee_id', employeeId);

    if (error) {
      console.error('Error fetching employee regions:', error);
      throw new Error(`Failed to fetch employee regions: ${error.message}`);
    }

    // Extract the regions from the join result
    // The query might return either a single region object or an array
    const regions: Database['public']['Tables']['regions']['Row'][] = [];

    data.forEach(item => {
      const region = item.regions;
      if (region) {
        // Check if it's an array (from aggregate) or a single object
        if (Array.isArray(region)) {
          regions.push(...region);
        } else {
          regions.push(region);
        }
      }
    });

    return regions;
  } catch (error) {
    console.error('Error in fetchEmployeeRegions:', error);
    throw error;
  }
}

/**
 * Update employee regions
 * Replaces all existing region assignments with the provided ones
 */
export async function updateEmployeeRegions(
  employeeId: string,
  regionIds: string[]
): Promise<{ success: boolean; data?: null }> {
  try {
    const supabase = await createClient();

    // First, delete all existing region assignments for this employee
    const { error: deleteError } = await supabase
      .from('employee_regions')
      .delete()
      .eq('employee_id', employeeId);

    if (deleteError) {
      console.error('Error deleting existing region assignments:', deleteError);
      throw new Error(`Failed to delete existing region assignments: ${deleteError.message}`);
    }

    // Then, insert the new region assignments
    if (regionIds.length > 0) {
      const assignments = regionIds.map(regionId => ({
        employee_id: employeeId,
        region_id: regionId,
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('employee_regions')
        .insert(assignments);

      if (insertError) {
        console.error('Error inserting new region assignments:', insertError);
        throw new Error(`Failed to insert new region assignments: ${insertError.message}`);
      }
    }

    return { success: true, data: null };
  } catch (error) {
    console.error('Error in updateEmployeeRegions:', error);
    throw new Error(`Failed to update employee regions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
