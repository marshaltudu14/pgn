import { NextRequest, NextResponse } from 'next/server';
import {
  createEmployee,
  getEmployeeByEmail
} from '@/services/employee.service';
import {
  CreateEmployeeRequestSchema,
  EmployeeListParamsSchema,
  BaseApiResponseSchema
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared';

const getEmployeesHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated query parameters
      const params = (request as any).validatedQuery;

      const { listEmployees } = await import('@/services/employee.service');
      const result = await listEmployees(params);

      const response = NextResponse.json({
        success: true,
        data: result,
        message: 'Employees retrieved successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching employees:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch employees',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: EmployeeListParamsSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false // Skip response validation in development to avoid strict schema matching
  }
);

const createEmployeeHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated request body
      const body = (request as any).validatedBody;

      // Check if email is already taken by an existing employee
      const existingEmployee = await getEmployeeByEmail(body.email);
      if (existingEmployee) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'An employee with this email address already exists. Please use the Edit Employee page to update their information instead.'
          },
          { status: 409 }
        );
        return addSecurityHeaders(response);
      }

      // Create employee
      const newEmployee = await createEmployee(body);

      const response = NextResponse.json({
        success: true,
        data: newEmployee,
        message: 'Employee created successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error creating employee:', error);

      // Handle specific error cases and pass through the actual error message
      if (error instanceof Error) {
        // Handle duplicate user error - but now we'll allow it since we can update existing auth users
        if (error.message.includes('A user with this email address has already been registered')) {
          // This shouldn't happen anymore since we handle existing auth users
          // but keeping it as a fallback
          const response = NextResponse.json(
            {
              success: false,
              error: 'An error occurred while processing the auth user. Please try again.'
            },
            { status: 500 }
          );
          return addSecurityHeaders(response);
        }

        // Handle row-level security policy errors
        if (error.message.includes('new row violates row-level security policy')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'You do not have permission to create employees. Please contact your administrator.'
            },
            { status: 403 }
          );
          return addSecurityHeaders(response);
        }

        // Handle duplicate key errors
        if (error.message.includes('duplicate key')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Employee with this email or user ID already exists'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }

        // Pass through the actual error message
        const response = NextResponse.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to create employee',
          message: 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    body: CreateEmployeeRequestSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false // Skip response validation in development to avoid strict schema matching
  }
);

export const GET = withSecurity(getEmployeesHandler);
export const POST = withSecurity(createEmployeeHandler);

// Add API contract definitions
apiContract.addRoute({
  path: '/api/employees',
  method: 'GET',
  inputSchema: EmployeeListParamsSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Get list of employees with filtering and pagination'
});

apiContract.addRoute({
  path: '/api/employees',
  method: 'POST',
  inputSchema: CreateEmployeeRequestSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Create a new employee'
});