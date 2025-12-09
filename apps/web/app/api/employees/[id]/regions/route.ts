import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  UpdateEmployeeRegionsSchema,
  EmployeeIdParamSchema,
  BaseApiResponseSchema
} from '@pgn/shared';

const putEmployeeRegionsHandler = withApiValidation(
  async (
    request: NextRequest,
    _context: { params?: unknown }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;
      const { region_ids } = (request as NextRequest & { validatedBody: unknown }).validatedBody as { region_ids: string[] };

      // Import service functions dynamically
      const { updateEmployeeRegions } = await import('@/services/employee.service');

      const result = await updateEmployeeRegions(id, region_ids);

      if (!result) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'Failed to update employee regions'
          },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json({
        success: true,
        data: result,
        message: 'Employee regions updated successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error updating employee regions:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to update employee regions',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamSchema,
    body: UpdateEmployeeRegionsSchema,
    response: BaseApiResponseSchema,
    validateResponse: false
  }
);

const getEmployeeRegionsHandler = withApiValidation(
  async (
    request: NextRequest,
    _context: { params?: unknown }
  ): Promise<NextResponse> => {
    try {
      const { id } = (request as NextRequest & { validatedParams: Record<string, string> }).validatedParams;

      // Import service functions dynamically
      const { fetchEmployeeRegions } = await import('@/services/employee.service');

      const regions = await fetchEmployeeRegions(id);

      const response = NextResponse.json({
        success: true,
        data: regions,
        message: 'Employee regions fetched successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching employee regions:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch employee regions',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: EmployeeIdParamSchema,
    response: BaseApiResponseSchema,
    validateResponse: false
  }
);

export const GET = withSecurity(getEmployeeRegionsHandler);
export const PUT = withSecurity(putEmployeeRegionsHandler);