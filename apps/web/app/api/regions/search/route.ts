import { NextRequest, NextResponse } from 'next/server';
import { searchRegions } from '@/services/regions.service';
import {
  regionsQuerySchema,
  RegionListResponseSchema,
} from '@pgn/shared';
import { z } from 'zod';
import { withApiValidation } from '@/lib/api-validation';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { apiContract } from '@pgn/shared';

// Type extension for validated request
interface ValidatedNextRequest extends NextRequest {
  validatedQuery?: z.infer<typeof searchWithPaginationSchema>;
}

// Create search schema with required search query
const searchWithPaginationSchema = regionsQuerySchema
  .omit({ search: true })
  .extend({
    q: z.string().min(1, 'Search query is required'),
  });

// GET /api/regions/search - Search regions with pagination
const searchRegionsHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract search parameters from validated query
      const query = (req as ValidatedNextRequest).validatedQuery!;

      const result = await searchRegions(query.q || '', {
        page: query.page,
        limit: query.limit,
        sort_by: query.sort_by,
        sort_order: query.sort_order,
      });

      const response = NextResponse.json(result);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error searching regions:', error);

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: searchWithPaginationSchema,
    response: RegionListResponseSchema,
  }
);

// Add route definition to API contract
apiContract.addRoute({
  path: '/api/regions/search',
  method: 'GET',
  inputSchema: searchWithPaginationSchema,
  outputSchema: RegionListResponseSchema,
  description: 'Search regions by city name with pagination'
});

export const GET = withSecurity(searchRegionsHandler);