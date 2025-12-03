import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/services/regions.service';
import {
  createRegionSchema,
  regionsQuerySchema,
  RegionResponseSchema,
  RegionListResponseSchema,
} from '@pgn/shared';
import { z } from 'zod';
import { withApiValidation } from '@/lib/api-validation';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { apiContract } from '@pgn/shared';

// Type extensions for validated request
interface ValidatedNextRequest extends NextRequest {
  validatedQuery?: z.infer<typeof regionsQuerySchema>;
  validatedBody?: z.infer<typeof createRegionSchema>;
}

// GET /api/regions - Fetch regions with filtering and pagination
const getRegionsHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract pagination and filter params from validated query
      const query = (req as ValidatedNextRequest).validatedQuery!;
      const params = {
        page: query.page,
        limit: query.limit,
        search: query.search,
        state: query.state,
        city: query.city,
        sort_by: query.sort_by,
        sort_order: query.sort_order,
      };

      const result = await getRegions(params);

      const response = NextResponse.json(result);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching regions:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          const response = NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: regionsQuerySchema,
    response: RegionListResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

// POST /api/regions - Create a new region
const createRegionHandler = withApiValidation(
  async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get validated data from middleware
      const validatedData = (req as ValidatedNextRequest).validatedBody!;

      const region = await createRegion(validatedData);

      const response = NextResponse.json(region, { status: 201 });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error creating region:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          const response = NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    body: createRegionSchema,
    response: RegionResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/regions',
  method: 'GET',
  inputSchema: regionsQuerySchema,
  outputSchema: RegionListResponseSchema,
  description: 'Fetch regions with filtering, sorting, and pagination'
});

apiContract.addRoute({
  path: '/api/regions',
  method: 'POST',
  inputSchema: createRegionSchema,
  outputSchema: RegionResponseSchema,
  description: 'Create a new region'
});

export const GET = withSecurity(getRegionsHandler);
export const POST = withSecurity(createRegionHandler);