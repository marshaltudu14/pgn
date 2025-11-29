import { NextRequest, NextResponse } from 'next/server';
import {
  listRetailers,
  createRetailer
} from '@/services/retailer.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  RetailerListParamsSchema,
  RetailerFormDataSchema,
  RetailerListResponseSchema,
  RetailerCreatedResponseSchema,
  type RetailerInsert,
} from '@pgn/shared';
import { apiContract } from '@pgn/shared';

const getRetailersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Use validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery?: Record<string, unknown> }).validatedQuery;

    const result = await listRetailers(params);

    const response = NextResponse.json({
      success: true,
      data: {
        retailers: result.retailers,
        pagination: result.pagination
      },
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
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

export const POST = withSecurity(
  withApiValidation(createRetailerHandler, {
    body: RetailerFormDataSchema,
    response: RetailerCreatedResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);