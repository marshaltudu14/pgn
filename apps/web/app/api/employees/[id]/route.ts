import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEmployeeById,
  updateEmployee,
  changeEmploymentStatus,
  resetEmployeePassword
} from '@/services/employee.service';
import {
  UpdateEmployeeRequestSchema,
  ChangeEmploymentStatusRequestSchema,
  BaseApiResponseSchema
} from '@pgn/shared';

type EmploymentStatus = 'ACTIVE' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared';

// Schema for route parameters
const EmployeeIdParamsSchema = z.object({
  id: z.string().min(1, 'Employee ID is required')
});

// Schema for password reset request
const PasswordResetRequestSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long')
});

const getEmployeeByIdHandler = withApiValidation(
  async (
    request: NextRequest,
    context: { params?: any }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as any).validatedParams;

      const employee = await getEmployeeById(id);

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
        message: 'Employee retrieved successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching employee:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch employee',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamsSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

const updateEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    context: { params?: any }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as any).validatedParams;
      const body = (request as any).validatedBody;

      // Check if email is already taken by another employee
      if (body.email) {
        const { getEmployeeByEmail } = await import('@/services/employee.service');
        const existingEmployee = await getEmployeeByEmail(body.email);
        if (existingEmployee && existingEmployee.id !== id) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Email is already taken by another employee'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      // Update employee
      const updatedEmployee = await updateEmployee(id, body);

      const response = NextResponse.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error updating employee:', error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Employee with this email already exists'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to update employee',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamsSchema as any,
    body: UpdateEmployeeRequestSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

// Schema for employment status change
const EmploymentStatusChangeSchema = z.object({
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  reason: z.string().optional(),
  changed_by: z.string().default('system')
});

const patchEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    context: { params?: any }
  ) => {
    try {
      const { id } = (request as any).validatedParams;
      const body = (request as any).validatedBody;

      // Check if this is a status change request
      if (body.employment_status) {
        // Check if employee exists
        const employee = await getEmployeeById(id);
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

        const { employment_status, reason, changed_by } = body;

        // Prepare status change data
        const statusChange = {
          employment_status: employment_status as EmploymentStatus,
          reason: reason?.trim() || undefined,
          changed_by: changed_by || 'system'
        };

        // Update employment status
        const updatedEmployee = await changeEmploymentStatus(id, statusChange);

        const response = NextResponse.json({
          success: true,
          data: updatedEmployee,
          message: 'Employment status updated successfully',
          changeLog: {
            employeeId: id,
            previousStatus: employee.employment_status,
            newStatus: employment_status,
            reason: reason || null,
            changed_by: changed_by || 'system',
            updated_at: new Date().toISOString()
          }
        });
        return addSecurityHeaders(response);
      }

      // Handle other partial updates
      const employee = await getEmployeeById(id);
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

      // Check if email is already taken by another employee
      if (body.email) {
        const { getEmployeeByEmail } = await import('@/services/employee.service');
        const existingEmployee = await getEmployeeByEmail(body.email);
        if (existingEmployee && existingEmployee.id !== id) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Email is already taken by another employee'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      // Update employee
      const updatedEmployee = await updateEmployee(id, body);

      const response = NextResponse.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error updating employee:', error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          const response = NextResponse.json(
            {
              success: false,
              error: 'Employee with this email already exists'
            },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to update employee',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamsSchema as any,
    body: z.union([EmploymentStatusChangeSchema, UpdateEmployeeRequestSchema]) as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

const postEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    context: { params?: any }
  ) => {
    try {
      const { id } = (request as any).validatedParams;
      const { newPassword } = (request as any).validatedBody;

      // Check if employee exists
      const employee = await getEmployeeById(id);
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

      // Reset password
      const resetResult = await resetEmployeePassword(id, newPassword);

      if (!resetResult.success) {
        const response = NextResponse.json(
          {
            success: false,
            error: resetResult.error || 'Failed to reset password'
          },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json({
        success: true,
        message: 'Password reset successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error resetting password:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to reset password',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamsSchema as any,
    body: PasswordResetRequestSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

// Export with security middleware
export const GET = withSecurity(getEmployeeByIdHandler);
export const PUT = withSecurity(updateEmployeeHandler);
export const PATCH = withSecurity(patchEmployeeHandler);
export const POST = withSecurity(postEmployeeHandler);

// Add API contract definitions
apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'GET',
  inputSchema: EmployeeIdParamsSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Get employee by ID'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'PUT',
  inputSchema: UpdateEmployeeRequestSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Update employee by ID'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'PATCH',
  inputSchema: z.union([EmploymentStatusChangeSchema, UpdateEmployeeRequestSchema]) as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Partially update employee (status change or other fields)'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'POST',
  inputSchema: PasswordResetRequestSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Reset employee password'
});