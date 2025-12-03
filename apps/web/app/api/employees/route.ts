import { NextRequest, NextResponse } from 'next/server';
import {
  createEmployee
} from '@/services/employee.service';
import {
  CreateEmployeeRequestSchema,
  EmployeeListParamsSchema,
  BaseApiResponseSchema,
  type CreateEmployeeRequest,
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared';

// Interface for validated query parameters
interface ValidatedQueryRequest extends NextRequest {
  validatedQuery: Record<string, string | string[]>;
}

// Interface for validated body
interface ValidatedBodyRequest extends NextRequest {
  validatedBody: unknown;
}

const getEmployeesHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated query parameters
      const params = (request as ValidatedQueryRequest).validatedQuery;

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
    query: EmployeeListParamsSchema,
    response: BaseApiResponseSchema,
    validateResponse: false // Skip response validation in development to avoid strict schema matching
  }
);

const createEmployeeHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated request body
      const body = (request as ValidatedBodyRequest).validatedBody;

      // Create employee - the service now handles all validation including email and phone uniqueness
      const newEmployee = await createEmployee(body as CreateEmployeeRequest);

      const response = NextResponse.json({
        success: true,
        data: newEmployee,
        message: 'Employee created successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error creating employee:', error);

      // Handle specific error cases with improved messages
      if (error instanceof Error) {
        // Handle validation errors from the service layer
        if (error.message.includes('already exists in the system')) {
          const response = NextResponse.json(
            {
              success: false,
              error: error.message
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }

        // Handle authentication system inconsistency
        if (error.message.includes('exists in the authentication system but not in the employee database')) {
          const response = NextResponse.json(
            {
              success: false,
              error: error.message,
              requiresManualIntervention: true
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }

        // Handle row-level security policy errors
        if (error.message.includes('permission to create employees')) {
          const response = NextResponse.json(
            {
              success: false,
              error: error.message
            },
            { status: 403 }
          );
          return addSecurityHeaders(response);
        }

        // Handle duplicate key errors (fallback)
        if (error.message.includes('duplicate key')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'An employee with this email or phone number already exists in the system.'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }

        // Handle auth user creation failures
        if (error.message.includes('Failed to create auth user')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Failed to create user authentication. Please check the email address and try again.'
            },
            { status: 500 }
          );
          return addSecurityHeaders(response);
        }

        // Handle password-related errors
        if (error.message.includes('Failed to update existing auth user password')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Failed to set password for existing user. Please contact technical support.'
            },
            { status: 500 }
          );
          return addSecurityHeaders(response);
        }

        // Pass through the actual error message for other cases
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
          message: 'An unexpected error occurred while creating the employee'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    body: CreateEmployeeRequestSchema,
    response: BaseApiResponseSchema,
    validateResponse: false // Skip response validation in development to avoid strict schema matching
  }
);

export const GET = withSecurity(getEmployeesHandler);
export const POST = withSecurity(createEmployeeHandler);

// Add API contract definitions
apiContract.addRoute({
  path: '/api/employees',
  method: 'GET',
  inputSchema: EmployeeListParamsSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Get list of employees with filtering and pagination'
});

apiContract.addRoute({
  path: '/api/employees',
  method: 'POST',
  inputSchema: CreateEmployeeRequestSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Create a new employee'
});