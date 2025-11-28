import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { BaseApiResponseSchema } from '@pgn/shared';
import { apiContract } from '@pgn/shared';

// Schema for employee search parameters
const EmployeeSearchParamsSchema = z.object({
  search: z.string().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

interface EmployeeSearchResult {
  id: string;
  human_readable_user_id: string;
  first_name: string;
  display_name: string; // human_readable_user_id + first_name
}

const searchEmployeesHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated query parameters
      const { search, page, limit } = (request as any).validatedQuery;

      // Only search ACTIVE employees who can login
      const { listEmployees } = await import('@/services/employee.service');
      const result = await listEmployees({
        search,
        page,
        limit,
        employment_status: ['ACTIVE'],
        sort_by: 'human_readable_user_id',
        sort_order: 'asc'
      });

      // Transform employees for combobox display
      const employees: EmployeeSearchResult[] = result.employees.map(emp => ({
        id: emp.id,
        human_readable_user_id: emp.human_readable_user_id,
        first_name: emp.first_name,
        display_name: `${emp.human_readable_user_id} (${emp.first_name})`
      }));

      const response = NextResponse.json({
        success: true,
        data: {
          employees,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            hasMore: result.hasMore
          }
        },
        message: 'Employees searched successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error searching employees:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to search employees',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: EmployeeSearchParamsSchema as any,
    response: BaseApiResponseSchema as any,
    validateResponse: false
  }
);

export const GET = withSecurity(searchEmployeesHandler);

// Add API contract definition
apiContract.addRoute({
  path: '/api/employees/search',
  method: 'GET',
  inputSchema: EmployeeSearchParamsSchema as any,
  outputSchema: BaseApiResponseSchema as any,
  description: 'Search for active employees who can login'
});