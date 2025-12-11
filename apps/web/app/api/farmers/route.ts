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
import { getEmployeeRegions, canEmployeeAccessRegion } from '@/services/regions.service';


const getFarmersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    // Check if this is a mobile client (employee) or web admin
    // Mobile app sends 'x-client-info: pgn-mobile-client'
    const isMobileClient = request.headers.get('x-client-info') === 'pgn-mobile-client';

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
      } catch (error) {
        console.error('Error getting employee regions:', error);
        // If we can't get regions, return empty result
        regionFilter = [];
      }
    } else if (!isMobileClient) {
      regionFilter = undefined;
    }

    const result = await listFarmers(params as Record<string, unknown>, regionFilter);

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
    if (isMobileClient && farmerData.region_id) {
      const hasAccess = await canEmployeeAccessRegion(user.employeeId, farmerData.region_id);

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