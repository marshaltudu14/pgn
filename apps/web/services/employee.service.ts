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
  CityAssignment,
} from '@pgn/shared';
import {
  Database,
  TablesInsert,
  TablesUpdate,
  Json,
} from '@pgn/shared';
type Employee = Database['public']['Tables']['employees']['Row'];
type EmployeeInsert = TablesInsert<'employees'>;
type EmployeeUpdate = TablesUpdate<'employees'>;
import { createClient } from '../utils/supabase/server';
import {
  createAuthUser,
  resetUserPassword,
  getUserByEmail,
  updateUserPasswordByEmail,
} from '../utils/supabase/admin';

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
      assigned_cities: (createData.assigned_cities as unknown as Json) || [],
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
    if (createData.assigned_cities && createData.assigned_cities.length > 0) {
      // Use the updateRegionalAssignments function to handle junction table
      try {
        await updateRegionalAssignments(authUserId!, {
          assigned_cities: createData.assigned_cities as CityAssignment[]
        });
      } catch (regionError) {
        // Log error but don't fail the entire operation
        console.error(`Failed to create region assignments for employee ${authUserId}:`, regionError);
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
      sort_by = 'created_at',
      sort_order = 'desc',
    } = params;

    // If no regions are selected, return empty list as per requirement
    if (!assigned_regions || assigned_regions.length === 0) {
      return {
        employees: [],
        total: 0,
        page: 1,
        limit,
        hasMore: false,
      };
    }

    // Build query with INNER JOIN to employee_regions
    // This ensures we only return employees who are assigned to the selected regions
    let query = supabase
      .from('employees')
      .select(`
        *,
        employee_regions!inner (
          region_id
        )
      `, { count: 'exact' });

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

    // Apply assigned regions filter using junction table
    if (assigned_regions && assigned_regions.length > 0) {
      query = query.in('employee_regions.region_id', assigned_regions);
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

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      employees,
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
    if (updateData.assigned_cities !== undefined)
      employeeData.assigned_cities =
        updateData.assigned_cities as unknown as Json;

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
 */
export async function updateRegionalAssignments(
  id: string,
  regionalAssignment: { assigned_cities?: CityAssignment[] }
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
    if (regionalAssignment.assigned_cities && regionalAssignment.assigned_cities.length > 0) {
      const newAssignments = regionalAssignment.assigned_cities.map(city => ({
        employee_id: id,
        region_id: city.id,
        assigned_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('employee_regions')
        .insert(newAssignments);

      if (insertError) {
        throw new Error(`Failed to insert new region assignments: ${insertError.message}`);
      }
    }

    // Also update the assigned_cities JSONB for backward compatibility
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        assigned_cities: regionalAssignment.assigned_cities as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update employee assigned_cities: ${updateError.message}`);
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
        region_id,
        regions (
          id,
          city,
          state
        )
      `)
      .eq('employee_id', employeeId);

    if (error) {
      throw new Error(`Failed to fetch employee regions: ${error.message}`);
    }

    return data?.map(item => {
      const region = item.regions as { id: string; city: string; state: string };
      return {
        id: region.id,
        city: region.city,
        state: region.state
      };
    }) || [];
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
