import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity, type AuthenticatedRequest } from '@/lib/security-middleware';
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
import { getEmployeeRegions, canEmployeeAccessRegion } from '@/services/regions.service';

const getDealersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // Check if this is a mobile client (employee) or web admin
    const isMobileClient = request.headers.get('x-client-type') === 'mobile';

    const user = (request as AuthenticatedRequest).user;
    let regionFilter: string[] | undefined;

    // Check if region_id is passed in query params (for web admin manual filtering)
    const queryParams = params as Record<string, unknown>;
    const explicitRegionId = queryParams.region_id as string | undefined;

    if (explicitRegionId) {
      regionFilter = [explicitRegionId];
    }
    // Apply automatic region filtering for mobile employees
    else if (isMobileClient && user && user.employeeId) {
      // Get employee's assigned regions
      try {
        regionFilter = await getEmployeeRegions(user.employeeId);

        if (regionFilter.length === 0) {
          // Return empty result for employees with no regions
          const emptyResponse = {
            dealers: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: 20,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          };

          const response = NextResponse.json({
            success: true,
            data: emptyResponse,
            message: 'No dealers found - no regions assigned'
          });
          return addSecurityHeaders(response);
        }
      } catch (error) {
        console.error('Error getting employee regions:', error);
        // If we can't get regions, return empty result
        regionFilter = [];
      }
    } else if (!isMobileClient) {
      regionFilter = undefined;
    }

    const result = await listDealers(params as DealerListParams, regionFilter);

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

    // Check if this is a mobile client (employee) or web admin
    // Mobile app sends 'x-client-info: pgn-mobile-client'
    const isMobileClient = request.headers.get('x-client-info') === 'pgn-mobile-client';

    // Get user from authenticated request (set by security middleware)
    const user = (request as AuthenticatedRequest).user;

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

    // For mobile employees, validate region access if region_id is provided
    if (isMobileClient && dealerData.region_id) {
      const hasAccess = await canEmployeeAccessRegion(user.employeeId, dealerData.region_id);

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
}));

export const POST = withSecurity(withApiValidation(createDealerHandler, {
  body: DealerFormDataSchema,
  response: BaseApiResponseSchema,
}));