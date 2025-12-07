import { NextRequest, NextResponse } from 'next/server';
import {
  listDealers,
  createDealer
} from '@/services/dealer.service';
import {
  getEmployeeRegions,
  canEmployeeAccessRegion
} from '@/services/regions.service';
import {
  DealerInsert,
  DealerListParamsSchema,
  DealerFormDataSchema,
  DealerListResponseSchema,
  BaseApiResponseSchema,
  type DealerListParams,
} from '@pgn/shared';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { buildTimeApiContract } from '@pgn/shared';
import { createClient } from '@/utils/supabase/server';

const getDealersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // Get employee ID from JWT token
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let regionFilter: string[] | undefined;

    if (user) {
      // Get employee's assigned regions
      try {
        regionFilter = await getEmployeeRegions(user.id);
      } catch (error) {
        console.error('Error getting employee regions:', error);
        // If we can't get regions, return empty result
        regionFilter = [];
      }
    }

    const result = await listDealers(params as DealerListParams, regionFilter);

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

    // Get employee ID from JWT token
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'No valid user token found'
        },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Validate region access if region_id is provided
    if (dealerData.region_id) {
      const hasAccess = await canEmployeeAccessRegion(user.id, dealerData.region_id);

      if (!hasAccess) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'You do not have access to this region'
          },
          { status: 403 }
        );
        return addSecurityHeaders(response);
      }
    }

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
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const POST = withSecurity(withApiValidation(createDealerHandler, {
  body: DealerFormDataSchema,
  response: BaseApiResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));