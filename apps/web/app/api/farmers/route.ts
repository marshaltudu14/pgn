import { NextRequest, NextResponse } from 'next/server';
import {
  listFarmers,
  createFarmer
} from '@/services/farmer.service';
import { withSecurity, addSecurityHeaders, type AuthenticatedRequest } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  FarmerListParamsSchema,
  FarmerFormDataSchema,
  FarmerListResponseSchema,
  FarmerCreatedResponseSchema,
  apiContract,
  type FarmerInsert,
} from '@pgn/shared';


const getFarmersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // RLS policies will automatically filter data based on employee's assigned regions
    // Web admin can still pass explicit region_id for manual filtering
    const result = await listFarmers(params as Record<string, unknown>);

    // Successfully fetched farmers

    const response = NextResponse.json({
      success: true,
      data: result,
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
};

const createFarmerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated body from the middleware
    const farmerData = (request as NextRequest & { validatedBody: unknown }).validatedBody as FarmerInsert;

    // RLS policies will automatically validate region access during insert
    // No manual validation needed
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
};

// Apply validation middleware, then security middleware
export const GET = withSecurity(withApiValidation(getFarmersHandler, {
  query: FarmerListParamsSchema,
  response: FarmerListResponseSchema,
}));

export const POST = withSecurity(withApiValidation(createFarmerHandler, {
  body: FarmerFormDataSchema,
  response: FarmerCreatedResponseSchema,
}));

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