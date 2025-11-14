/**
 * Employee Service
 * Handles CRUD operations for employees with Supabase integration
 */

import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  ChangeEmploymentStatusRequest,
  RegionalAssignmentRequest,
  EmployeeListParams,
  EmployeeListResponse
} from '@pgn/shared';
import { createClient } from '../utils/supabase/server';

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
  try {
    const supabase = await createClient();

    // Generate human readable user ID
    const humanReadableUserId = await generateHumanReadableUserId();

    // Prepare employee data for database
    const employeeData = {
      human_readable_user_id: humanReadableUserId,
      first_name: createData.first_name,
      last_name: createData.last_name,
      email: createData.email,
      phone: createData.phone,
      employment_status: createData.employment_status || 'ACTIVE',
      can_login: createData.can_login ?? true,
      primary_region: createData.primary_region,
      region_code: createData.region_code,
      assigned_regions: createData.assigned_regions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return {
      id: data.id,
      humanReadableUserId: data.human_readable_user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employmentStatus: data.employment_status,
      canLogin: data.can_login,
      employmentStatusChangedAt: data.employment_status_changed_at,
      employmentStatusChangedBy: data.employment_status_changed_by,
      faceEmbedding: data.face_embedding,
      referencePhotoUrl: data.reference_photo_url,
      referencePhotoData: data.reference_photo_data,
      assignedRegions: data.assigned_regions,
      primaryRegion: data.primary_region,
      regionCode: data.region_code,
      failedLoginAttempts: data.failed_login_attempts,
      accountLockedUntil: data.account_locked_until,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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

    return {
      id: data.id,
      humanReadableUserId: data.human_readable_user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employmentStatus: data.employment_status,
      canLogin: data.can_login,
      employmentStatusChangedAt: data.employment_status_changed_at,
      employmentStatusChangedBy: data.employment_status_changed_by,
      faceEmbedding: data.face_embedding,
      referencePhotoUrl: data.reference_photo_url,
      referencePhotoData: data.reference_photo_data,
      assignedRegions: data.assigned_regions,
      primaryRegion: data.primary_region,
      regionCode: data.region_code,
      failedLoginAttempts: data.failed_login_attempts,
      accountLockedUntil: data.account_locked_until,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getEmployeeById:', error);
    throw error;
  }
}

/**
 * Get employee by human readable ID
 */
export async function getEmployeeByHumanReadableId(humanReadableId: string): Promise<Employee | null> {
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

    return {
      id: data.id,
      humanReadableUserId: data.human_readable_user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employmentStatus: data.employment_status,
      canLogin: data.can_login,
      employmentStatusChangedAt: data.employment_status_changed_at,
      employmentStatusChangedBy: data.employment_status_changed_by,
      faceEmbedding: data.face_embedding,
      referencePhotoUrl: data.reference_photo_url,
      referencePhotoData: data.reference_photo_data,
      assignedRegions: data.assigned_regions,
      primaryRegion: data.primary_region,
      regionCode: data.region_code,
      failedLoginAttempts: data.failed_login_attempts,
      accountLockedUntil: data.account_locked_until,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getEmployeeByHumanReadableId:', error);
    throw error;
  }
}

/**
 * Get employee by email
 */
export async function getEmployeeByEmail(email: string): Promise<Employee | null> {
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

    return {
      id: data.id,
      humanReadableUserId: data.human_readable_user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employmentStatus: data.employment_status,
      canLogin: data.can_login,
      employmentStatusChangedAt: data.employment_status_changed_at,
      employmentStatusChangedBy: data.employment_status_changed_by,
      faceEmbedding: data.face_embedding,
      referencePhotoUrl: data.reference_photo_url,
      referencePhotoData: data.reference_photo_data,
      assignedRegions: data.assigned_regions,
      primaryRegion: data.primary_region,
      regionCode: data.region_code,
      failedLoginAttempts: data.failed_login_attempts,
      accountLockedUntil: data.account_locked_until,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in getEmployeeByEmail:', error);
    throw error;
  }
}

/**
 * List employees with filtering and pagination
 */
export async function listEmployees(params: EmployeeListParams): Promise<EmployeeListResponse> {
  try {
    const supabase = await createClient();

    const {
      page = 1,
      limit = 50,
      search,
      employment_status,
      primary_region,
      assigned_regions,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = params;

    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,human_readable_user_id.ilike.%${search}%`
      );
    }

    // Apply employment status filter
    if (employment_status && employment_status.length > 0) {
      query = query.in('employment_status', employment_status);
    }

    // Apply primary region filter
    if (primary_region) {
      query = query.eq('primary_region', primary_region);
    }

    // Apply assigned regions filter
    if (assigned_regions && assigned_regions.length > 0) {
      query = query.contains('assigned_regions', assigned_regions);
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

    const employees = (data || []).map(employee => ({
      id: employee.id,
      humanReadableUserId: employee.human_readable_user_id,
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      employmentStatus: employee.employment_status,
      canLogin: employee.can_login,
      employmentStatusChangedAt: employee.employment_status_changed_at,
      employmentStatusChangedBy: employee.employment_status_changed_by,
      faceEmbedding: employee.face_embedding,
      referencePhotoUrl: employee.reference_photo_url,
      referencePhotoData: employee.reference_photo_data,
      assignedRegions: employee.assigned_regions,
      primaryRegion: employee.primary_region,
      regionCode: employee.region_code,
      failedLoginAttempts: employee.failed_login_attempts,
      accountLockedUntil: employee.account_locked_until,
      deviceInfo: employee.device_info,
      createdAt: employee.created_at,
      updatedAt: employee.updated_at
    }));

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      employees,
      total,
      page,
      limit,
      hasMore
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

    // Prepare update data for database
    const employeeData: Record<string, string | boolean | string[]> = {
      updated_at: new Date().toISOString()
    };

    if (updateData.first_name !== undefined) employeeData.first_name = updateData.first_name;
    if (updateData.last_name !== undefined) employeeData.last_name = updateData.last_name;
    if (updateData.email !== undefined) employeeData.email = updateData.email;
    if (updateData.phone !== undefined) employeeData.phone = updateData.phone;
    if (updateData.employment_status !== undefined) employeeData.employment_status = updateData.employment_status;
    if (updateData.can_login !== undefined) employeeData.can_login = updateData.can_login;
    if (updateData.primary_region !== undefined) employeeData.primary_region = updateData.primary_region;
    if (updateData.region_code !== undefined) employeeData.region_code = updateData.region_code;
    if (updateData.assigned_regions !== undefined) employeeData.assigned_regions = updateData.assigned_regions;

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

    return {
      id: data.id,
      humanReadableUserId: data.human_readable_user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      employmentStatus: data.employment_status,
      canLogin: data.can_login,
      employmentStatusChangedAt: data.employment_status_changed_at,
      employmentStatusChangedBy: data.employment_status_changed_by,
      faceEmbedding: data.face_embedding,
      referencePhotoUrl: data.reference_photo_url,
      referencePhotoData: data.reference_photo_data,
      assignedRegions: data.assigned_regions,
      primaryRegion: data.primary_region,
      regionCode: data.region_code,
      failedLoginAttempts: data.failed_login_attempts,
      accountLockedUntil: data.account_locked_until,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
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
      can_login: statusChange.employment_status === 'ACTIVE' ||
                 statusChange.employment_status === 'ON_LEAVE'
    };

    const employee = await updateEmployee(id, updateData);

    // Log the status change
    console.log(
      `Employee ${id} status changed to ${statusChange.employment_status} by ${statusChange.changed_by}. Reason: ${statusChange.reason || 'Not specified'}`
    );

    return employee;
  } catch (error) {
    console.error('Error in changeEmploymentStatus:', error);
    throw error;
  }
}

/**
 * Update regional assignments
 */
export async function updateRegionalAssignments(
  id: string,
  regionalAssignment: RegionalAssignmentRequest
): Promise<Employee> {
  try {
    const updateData: UpdateEmployeeRequest = {
      primary_region: regionalAssignment.primary_region,
      region_code: regionalAssignment.region_code,
      assigned_regions: regionalAssignment.assigned_regions
    };

    return await updateEmployee(id, updateData);
  } catch (error) {
    console.error('Error in updateRegionalAssignments:', error);
    throw error;
  }
}

/**
 * Check if email is already taken by another employee
 */
export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  try {
    const supabase = await createClient();

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
 * Check if human readable user ID is already taken
 */
export async function isHumanReadableIdTaken(humanReadableId: string, excludeId?: string): Promise<boolean> {
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

