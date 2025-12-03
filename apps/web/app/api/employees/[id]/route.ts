import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getEmployeeById,
  updateEmployee,
  changeEmploymentStatus,
  resetEmployeePassword,
  isPhoneTaken,
  isEmailTaken
} from '@/services/employee.service';
import {
  UpdateEmployeeRequestSchema,
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
    _context: { params?: unknown }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;

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
    params: EmployeeIdParamsSchema,
    response: BaseApiResponseSchema,
    validateResponse: false
  }
);

const updateEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    _context: { params?: unknown }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;
      const body = (request as NextRequest & { validatedBody: unknown }).validatedBody;
      const typedBody = body as { email?: string; phone?: string; [key: string]: unknown };

      // Check if employee exists first
      const existingEmployee = await getEmployeeById(id);
      if (!existingEmployee) {
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
      if (typedBody.email && typedBody.email !== existingEmployee.email) {
        const emailTaken = await isEmailTaken(typedBody.email, id);
        if (emailTaken) {
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

      // Check if phone number is already taken by another employee
      if (typedBody.phone && typedBody.phone !== existingEmployee.phone) {
        // Clean phone number before checking
        const cleanPhone = typedBody.phone.toString().replace(/\D/g, '').slice(-10);
        if (cleanPhone && cleanPhone.length === 10) {
          const phoneTaken = await isPhoneTaken(cleanPhone, id);
          if (phoneTaken) {
            const response = NextResponse.json(
              {
                success: false,
                error: 'Phone number is already taken by another employee'
              },
              { status: 409 }
            );
            return addSecurityHeaders(response);
          }
        }
      }

      // Update employee
      const updatedEmployee = await updateEmployee(id, body as Record<string, unknown>);

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
          let errorMessage = 'Employee with this information already exists';
          if (error.message.includes('email')) {
            errorMessage = 'Email is already taken by another employee';
          } else if (error.message.includes('phone')) {
            errorMessage = 'Phone number is already taken by another employee';
          }

          const response = NextResponse.json(
            {
              success: false,
              error: errorMessage
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
    params: EmployeeIdParamsSchema,
    body: UpdateEmployeeRequestSchema,
    response: BaseApiResponseSchema,
    validateResponse: false
  }
);

// const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE'];

// Schema for employment status change
const EmploymentStatusChangeSchema = z.object({
  employment_status: z.enum(['ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED', 'ON_LEAVE']),
  reason: z.string().optional(),
  changed_by: z.string().default('system')
});

const patchEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    _context: { params?: unknown }
  ) => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;
      const body = (request as NextRequest & { validatedBody: unknown }).validatedBody;

      // Check if this is a status change request
      const typedBody = body as { employment_status?: string; reason?: string; changed_by?: string; email?: string; [key: string]: unknown };
      if (typedBody.employment_status) {
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

        const { employment_status, reason, changed_by } = typedBody;

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
      if (typedBody.email && typedBody.email !== employee.email) {
        const emailTaken = await isEmailTaken(typedBody.email, id);
        if (emailTaken) {
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

      // Check if phone number is already taken by another employee
      if (typedBody.phone && typedBody.phone !== employee.phone) {
        // Clean phone number before checking
        const cleanPhone = typedBody.phone.toString().replace(/\D/g, '').slice(-10);
        if (cleanPhone && cleanPhone.length === 10) {
          const phoneTaken = await isPhoneTaken(cleanPhone, id);
          if (phoneTaken) {
            const response = NextResponse.json(
              {
                success: false,
                error: 'Phone number is already taken by another employee'
              },
              { status: 409 }
            );
            return addSecurityHeaders(response);
          }
        }
      }

      // Update employee
      const updatedEmployee = await updateEmployee(id, body as Record<string, unknown>);

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
    params: EmployeeIdParamsSchema,
    body: z.union([EmploymentStatusChangeSchema, UpdateEmployeeRequestSchema]),
    response: BaseApiResponseSchema,
    validateResponse: false
  }
);

const postEmployeeHandler = withApiValidation(
  async (
    request: NextRequest,
    _context: { params?: unknown }
  ) => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;
      const { newPassword } = (request as NextRequest & { validatedBody: { newPassword: string } }).validatedBody;

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
    params: EmployeeIdParamsSchema,
    body: PasswordResetRequestSchema,
    response: BaseApiResponseSchema,
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
  inputSchema: EmployeeIdParamsSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Get employee by ID'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'PUT',
  inputSchema: UpdateEmployeeRequestSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Update employee by ID'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'PATCH',
  inputSchema: z.union([EmploymentStatusChangeSchema, UpdateEmployeeRequestSchema]),
  outputSchema: BaseApiResponseSchema,
  description: 'Partially update employee (status change or other fields)'
});

apiContract.addRoute({
  path: '/api/employees/[id]',
  method: 'POST',
  inputSchema: PasswordResetRequestSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Reset employee password'
});