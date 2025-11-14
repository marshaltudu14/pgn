import { NextRequest, NextResponse } from 'next/server';
import { Employee } from '@pgn/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // TODO: Implement actual service layer call
    // const employees = await EmployeeService.getAllEmployees({
    //   page,
    //   limit,
    //   filters: { search, status }
    // });

    // Mock data for now
    const mockEmployees: Employee[] = [
      {
        id: '1',
        humanReadableUserId: 'PGN-2024-0001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '9876543210',
        employmentStatus: 'ACTIVE',
        canLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        humanReadableUserId: 'PGN-2024-0002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '9876543211',
        employmentStatus: 'ACTIVE',
        canLogin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const filteredEmployees = mockEmployees.filter(emp => {
      const matchesSearch = !search ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        emp.humanReadableUserId.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = !status || emp.employmentStatus === status;

      return matchesSearch && matchesStatus;
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

    const response = {
      employees: paginatedEmployees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredEmployees.length / limit),
        totalCount: filteredEmployees.length,
        hasNextPage: endIndex < filteredEmployees.length,
        hasPreviousPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.firstName || !body.lastName || !body.email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual service layer call
    // const newEmployee = await EmployeeService.createEmployee(body);

    // Mock creation for now
    const newEmployee: Employee = {
      id: Date.now().toString(),
      humanReadableUserId: 'PGN-2024-0003', // This would be generated
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      employmentStatus: body.employmentStatus || 'ACTIVE',
      canLogin: body.canLogin ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}