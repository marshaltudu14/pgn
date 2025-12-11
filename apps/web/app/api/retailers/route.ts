import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity } from '@/lib/security-middleware';
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
    // Use validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery?: Record<string, unknown> }).validatedQuery;
    
    console.log('📥 Retailers API - Received params:', JSON.stringify(params, null, 2));

    const result = await listRetailers(params);
    
    console.log('📤 Retailers API - Returning retailers count:', result.retailers.length);

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
    // Use validated body from the middleware
    const retailerData = (request as NextRequest & { validatedBody?: Record<string, unknown> }).validatedBody || {};

    const result = await createRetailer(retailerData as RetailerInsert);

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