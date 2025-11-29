import { NextRequest, NextResponse } from 'next/server';
import {
  listFarmers,
  createFarmer
} from '@/services/farmer.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  FarmerListParamsSchema,
  FarmerFormDataSchema,
  FarmerListResponseSchema,
  FarmerCreatedResponseSchema,
  apiContract,
  type FarmerInsert,
} from '@pgn/shared';

// Interface for validated query parameters
interface ValidatedQueryRequest extends NextRequest {
  validatedQuery: Record<string, string | string[]>;
}

// Interface for validated body
interface ValidatedBodyRequest extends NextRequest {
  validatedBody: unknown;
}

const getFarmersHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated query parameters from middleware
      const params = (request as ValidatedQueryRequest).validatedQuery;

      const result = await listFarmers(params);

      const response = NextResponse.json({
        success: true,
        data: {
          farmers: result.farmers,
          pagination: result.pagination
        },
        message: 'Farmers retrieved successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch farmers',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    query: FarmerListParamsSchema,
    response: FarmerListResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

const createFarmerHandler = withApiValidation(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Use validated body from middleware
      const farmerData = (request as ValidatedBodyRequest).validatedBody as FarmerInsert;

      const result = await createFarmer(farmerData);

      const response = NextResponse.json({
        success: true,
        data: result,
        message: 'Farmer created successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error creating farmer:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to create farmer',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    body: FarmerFormDataSchema,
    response: FarmerCreatedResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

export const GET = withSecurity(getFarmersHandler);
export const POST = withSecurity(createFarmerHandler);

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/farmers',
  method: 'GET',
  inputSchema: FarmerListParamsSchema,
  outputSchema: FarmerListResponseSchema,
  description: 'Get a paginated list of farmers with optional filtering and sorting'
});

apiContract.addRoute({
  path: '/api/farmers',
  method: 'POST',
  inputSchema: FarmerFormDataSchema,
  outputSchema: FarmerCreatedResponseSchema,
  description: 'Create a new farmer'
});