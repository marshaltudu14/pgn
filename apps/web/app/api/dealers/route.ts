import { NextRequest, NextResponse } from 'next/server';
import {
  listDealers,
  createDealer
} from '@/services/dealer.service';
import {
  DealerInsert,
  DealerListParamsSchema,
  DealerFormDataSchema,
  DealerListResponseSchema,
  BaseApiResponseSchema
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared/src/validation/build-time-checker';

const getDealersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as any).validatedQuery;

    const result = await listDealers(params);

    const response = NextResponse.json({
      success: true,
      data: {
        dealers: result.dealers,
        pagination: result.pagination
      },
      message: 'Dealers retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dealers',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const createDealerHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated body from the middleware
    const dealerData = (request as any).validatedBody as DealerInsert;

    const result = await createDealer(dealerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Dealer created successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to create dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/dealers',
  method: 'GET',
  inputSchema: DealerListParamsSchema,
  outputSchema: DealerListResponseSchema,
  description: 'List dealers with pagination and filtering'
});

apiContract.addRoute({
  path: '/api/dealers',
  method: 'POST',
  inputSchema: DealerFormDataSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Create a new dealer'
});

// Apply validation middleware, then security middleware
export const GET = withSecurity(withApiValidation(getDealersHandler, {
  query: DealerListParamsSchema,
  response: DealerListResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const POST = withSecurity(withApiValidation(createDealerHandler, {
  body: DealerFormDataSchema,
  response: BaseApiResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));