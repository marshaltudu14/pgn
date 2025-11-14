import { NextRequest, NextResponse } from 'next/server';
import {
  getEmployeeById,
  updateEmployee,
  changeEmploymentStatus
} from '@/services/employee.service';
import { UpdateEmployeeRequest, EmploymentStatus } from '@pgn/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const employee = await getEmployeeById(id);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
      message: 'Employee retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate email format if provided
    if (body.email) {
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

      // Check if email is already taken by another employee
      const { getEmployeeByEmail } = await import('@/services/employee.service');
      const existingEmployee = await getEmployeeByEmail(body.email);
      if (existingEmployee && existingEmployee.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email is already taken by another employee'
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: UpdateEmployeeRequest = {
      first_name: body.first_name?.trim(),
      last_name: body.last_name?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      employment_status: body.employment_status,
      can_login: body.can_login,
      primary_region: body.primary_region?.trim(),
      region_code: body.region_code?.trim(),
      assigned_regions: body.assigned_regions
    };

    // Update employee
    const updatedEmployee = await updateEmployee(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee with this email already exists'
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if this is a status change request
    if (body.employment_status) {
      // Validate employment status
      if (!VALID_EMPLOYMENT_STATUSES.includes(body.employment_status)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Valid employment status is required',
            validStatuses: VALID_EMPLOYMENT_STATUSES
          },
          { status: 400 }
        );
      }

      // Check if employee exists
      const employee = await getEmployeeById(id);
      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee not found'
          },
          { status: 404 }
        );
      }

      const { employment_status, reason, changed_by } = body;

      // Prepare status change data
      const statusChange = {
        employment_status: employment_status as EmploymentStatus,
        reason: reason?.trim() || undefined,
        changed_by: changed_by || 'system'
      };

      // Update employment status
      const updatedEmployee = await changeEmploymentStatus(id, statusChange);

      return NextResponse.json({
        success: true,
        data: updatedEmployee,
        message: 'Employment status updated successfully',
        changeLog: {
          employeeId: id,
          previousStatus: employee.employmentStatus,
          newStatus: employment_status,
          reason: reason || null,
          changed_by: changed_by || 'system',
          updated_at: new Date().toISOString()
        }
      });
    }

    // Handle other partial updates
    const employee = await getEmployeeById(id);
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'Employee not found'
        },
        { status: 404 }
      );
    }

    // Validate email format if provided
    if (body.email) {
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

      // Check if email is already taken by another employee
      const { getEmployeeByEmail } = await import('@/services/employee.service');
      const existingEmployee = await getEmployeeByEmail(body.email);
      if (existingEmployee && existingEmployee.id !== id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email is already taken by another employee'
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: UpdateEmployeeRequest = {
      first_name: body.first_name?.trim(),
      last_name: body.last_name?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      can_login: body.can_login,
      primary_region: body.primary_region?.trim(),
      region_code: body.region_code?.trim(),
      assigned_regions: body.assigned_regions
    };

    // Update employee
    const updatedEmployee = await updateEmployee(id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee with this email already exists'
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}