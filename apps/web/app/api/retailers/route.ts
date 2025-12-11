import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity, type AuthenticatedRequest } from '@/lib/security-middleware';
import {
    createRetailer,
    listRetailers
} from '@/services/retailer.service';
import {
    apiContract,
    RetailerCreatedResponseSchema,
    RetailerFormDataSchema,
    RetailerListParamsSchema,
    RetailerListResponseSchema,
    type RetailerInsert,
} from '@pgn/shared';
import { NextRequest, NextResponse } from 'next/server';

const getRetailersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // RLS policies will automatically filter data based on employee's assigned regions
    // Web admin can still pass explicit region_id for manual filtering
    const result = await listRetailers(params as Record<string, unknown>);

    // Successfully fetched retailers

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Retailers retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching retailers:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch retailers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createRetailerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated body from the middleware
    const retailerData = (request as NextRequest & { validatedBody: unknown }).validatedBody as RetailerInsert;

    // RLS policies will automatically validate region access during insert
    // No manual validation needed
    const result = await createRetailer(retailerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Retailer created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating retailer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to create retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Add routes to API contract
apiContract.addRoute({
  path: '/api/retailers',
  method: 'GET',
  inputSchema: RetailerListParamsSchema,
  outputSchema: RetailerListResponseSchema,
  description: 'List retailers with pagination and filtering'
});

apiContract.addRoute({
  path: '/api/retailers',
  method: 'POST',
  inputSchema: RetailerFormDataSchema,
  outputSchema: RetailerCreatedResponseSchema,
  description: 'Create a new retailer'
});

// Apply validation middleware before security middleware
export const GET = withSecurity(
  withApiValidation(getRetailersHandler, {
    query: RetailerListParamsSchema,
    response: RetailerListResponseSchema,
  })
);

export const POST = withSecurity(
  withApiValidation(createRetailerHandler, {
    body: RetailerFormDataSchema,
    response: RetailerCreatedResponseSchema,
  })
);