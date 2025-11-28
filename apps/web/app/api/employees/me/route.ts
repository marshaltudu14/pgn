import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeById } from '@/services/employee.service';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { BaseApiResponseSchema } from '@pgn/shared';
import { apiContract } from '@pgn/shared';

const getCurrentEmployeeHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get authenticated user from request (security middleware attaches user)
      const user = (request as AuthenticatedRequest).user;

      if (!user || !user.employeeId) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'User not authenticated'
          },
          { status: 401 }
        );
        return addSecurityHeaders(response);
      }

      // Get employee data using the employeeId from the authenticated user
      const employee = await getEmployeeById(user.employeeId);

      if (!employee) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'Employee not found'
          },
          { status: 404 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json({
        success: true,
        data: employee,
        message: 'Current employee retrieved successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching current employee:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch current employee',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

export const GET = withSecurity(getCurrentEmployeeHandler);

// Add API contract definition
apiContract.addRoute({
  path: '/api/employees/me',
  method: 'GET',
  outputSchema: BaseApiResponseSchema as any,
  description: 'Get current authenticated employee profile'
});