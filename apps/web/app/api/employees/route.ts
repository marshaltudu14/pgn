import { NextRequest, NextResponse } from 'next/server';
import {
  createEmployee,
  getEmployeeByEmail
} from '@/services/employee.service';
import { CreateEmployeeRequest, EmployeeListParams, EmploymentStatus } from '@pgn/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: EmployeeListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      search: searchParams.get('search') || undefined,
      employment_status: searchParams.get('employment_status')?.split(',') as EmploymentStatus[] || undefined,
      primary_region: searchParams.get('primary_region') || undefined,
      assigned_regions: searchParams.get('assigned_regions')?.split(',') || undefined,
      sort_by: searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc'
    };

    const { listEmployees } = await import('@/services/employee.service');
    const result = await listEmployees(params);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Employees retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employees',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: 'First name, last name, and email are required'
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Check if email is already taken by an existing employee
    const existingEmployee = await getEmployeeByEmail(body.email);
    if (existingEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: 'An employee with this email address already exists. Please use the Edit Employee page to update their information instead.'
        },
        { status: 409 }
      );
    }

    // Prepare employee data
    const createData: CreateEmployeeRequest = {
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim(),
      employment_status: body.employment_status || 'ACTIVE',
      can_login: body.can_login ?? true,
      assigned_cities: body.assigned_cities || [],
      password: body.password // Will be handled by auth system
    };

    // Create employee
    const newEmployee = await createEmployee(createData);

    return NextResponse.json({
      success: true,
      data: newEmployee,
      message: 'Employee created successfully'
    });
  } catch (error) {
    console.error('Error creating employee:', error);

    // Handle specific error cases and pass through the actual error message
    if (error instanceof Error) {
      // Handle duplicate user error - but now we'll allow it since we can update existing auth users
      if (error.message.includes('A user with this email address has already been registered')) {
        // This shouldn't happen anymore since we handle existing auth users
        // but keeping it as a fallback
        return NextResponse.json(
          {
            success: false,
            error: 'An error occurred while processing the auth user. Please try again.'
          },
          { status: 500 }
        );
      }

      // Handle row-level security policy errors
      if (error.message.includes('new row violates row-level security policy')) {
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to create employees. Please contact your administrator.'
          },
          { status: 403 }
        );
      }

      // Handle duplicate key errors
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee with this email or user ID already exists'
          },
          { status: 409 }
        );
      }

      // Pass through the actual error message
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create employee',
        message: 'Unknown error'
      },
      { status: 500 }
    );
  }
}