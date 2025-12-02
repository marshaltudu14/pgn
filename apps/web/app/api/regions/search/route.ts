import { NextRequest, NextResponse } from 'next/server';
import { searchRegions } from '@/services/regions.service';
import {
  searchRegionsSchema,
  RegionSearchResponseSchema,
} from '@pgn/shared';
import { z } from 'zod';
import { withApiValidation } from '@/lib/api-validation';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { apiContract } from '@pgn/shared';

// Type extension for validated request
interface ValidatedNextRequest extends NextRequest {
  validatedQuery?: z.infer<typeof searchRegionsSchema>;
}

// GET /api/regions/search - Search regions
const searchRegionsHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract search parameters from validated query
      const query = (req as ValidatedNextRequest).validatedQuery!;

      const result = await searchRegions(query.q, {
        page: query.page,
        limit: query.limit,
      }, {
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
    query: searchRegionsSchema,
    response: RegionSearchResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

// Add route definition to API contract
apiContract.addRoute({
  path: '/api/regions/search',
  method: 'GET',
  inputSchema: searchRegionsSchema,
  outputSchema: RegionSearchResponseSchema,
  description: 'Search regions by text across state and city fields'
});

export const GET = withSecurity(searchRegionsHandler);