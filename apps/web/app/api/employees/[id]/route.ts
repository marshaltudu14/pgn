import { NextRequest, NextResponse } from 'next/server';
import { Employee } from '@pgn/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Implement actual service layer call
    // const employee = await EmployeeService.getEmployeeById(id);

    // Mock data for now
    const mockEmployee: Employee = {
      id,
      humanReadableUserId: 'PGN-2024-0001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      phone: '9876543210',
      employmentStatus: 'ACTIVE',
      canLogin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({ employee: mockEmployee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
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

    // TODO: Implement actual service layer call
    // const updatedEmployee = await EmployeeService.updateEmployee(id, body);

    // Mock update for now
    const updatedEmployee: Employee = {
      id,
      humanReadableUserId: 'PGN-2024-0001',
      firstName: body.firstName || 'Updated',
      lastName: body.lastName || 'Name',
      email: body.email || 'updated@company.com',
      phone: body.phone,
      employmentStatus: body.employmentStatus || 'ACTIVE',
      canLogin: body.canLogin ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}