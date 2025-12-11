import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity } from '@/lib/security-middleware';
import {
    createDealer,
    listDealers
} from '@/services/dealer.service';
import {
    BaseApiResponseSchema,
    buildTimeApiContract,
    DealerFormDataSchema,
    DealerInsert,
    DealerListParamsSchema,
    DealerListResponseSchema,
    type DealerListParams,
} from '@pgn/shared';
import { NextRequest, NextResponse } from 'next/server';

const getDealersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // RLS policies will automatically filter data based on employee's assigned regions
    // No manual filtering needed
    const result = await listDealers(params as DealerListParams);

    // Successfully fetched dealers

    const response = NextResponse.json({
      success: true,
      data: result,
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
    const dealerData = (request as NextRequest & { validatedBody: unknown }).validatedBody as DealerInsert;

    // RLS policies will automatically validate region access during insert
    // No manual validation needed
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
buildTimeApiContract.addRoute({
  path: '/api/dealers',
  method: 'GET',
  inputSchema: DealerListParamsSchema,
  outputSchema: DealerListResponseSchema,
  description: 'List dealers with pagination and filtering'
});

buildTimeApiContract.addRoute({
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
}));

export const POST = withSecurity(withApiValidation(createDealerHandler, {
  body: DealerFormDataSchema,
  response: BaseApiResponseSchema,
}));