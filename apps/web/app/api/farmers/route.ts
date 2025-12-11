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

    console.log('📥 Farmers API - Received params:', JSON.stringify(params, null, 2));

    // Check if this is a mobile client (employee) or web admin
    // Mobile app sends 'x-client-info: pgn-mobile-client'
    const isMobileClient = request.headers.get('x-client-info') === 'pgn-mobile-client';
    console.log('🔍 Farmers API - Client type:', isMobileClient ? 'Mobile Employee' : 'Web Admin');
    console.log('🔍 Farmers API - x-client-info header:', request.headers.get('x-client-info'));

    const user = (request as AuthenticatedRequest).user;
    let regionFilter: string[] | undefined;

    // Check if region_id is passed in query params (for web admin manual filtering)
    const queryParams = params as Record<string, unknown>;
    const explicitRegionId = queryParams.region_id as string | undefined;

    if (explicitRegionId) {
      console.log('🔍 Explicit region filter in query params:', explicitRegionId);
      regionFilter = [explicitRegionId];
    }
    // Apply automatic region filtering for mobile employees
    else if (isMobileClient && user && user.employeeId) {
      console.log('👤 Employee ID:', user.employeeId);

      // Get employee's assigned regions
      try {
        regionFilter = await getEmployeeRegions(user.employeeId);
        console.log('📍 Assigned region IDs:', regionFilter);

        if (regionFilter.length === 0) {
          console.log('⚠️ Employee has no regions assigned, returning empty result');
        }
      } catch (error) {
        console.error('Error getting employee regions:', error);
        // If we can't get regions, return empty result
        regionFilter = [];
      }
    } else if (!isMobileClient) {
      console.log('🌐 Web admin client - showing all farmers without region filtering');
      regionFilter = undefined;
    }

    const result = await listFarmers(params as Record<string, unknown>, regionFilter);

    console.log('📤 Farmers API - Total farmers found:', result.farmers.length);
    if (regionFilter && regionFilter.length > 0) {
      console.log('✅ Region filtering applied for', regionFilter.length, 'regions');
    }

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
    console.log('🔍 Create Farmers API - Client type:', isMobileClient ? 'Mobile Employee' : 'Web Admin');

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
      console.log('🔒 Validating region access for region_id:', farmerData.region_id);
      const hasAccess = await canEmployeeAccessRegion(user.employeeId, farmerData.region_id);

      if (!hasAccess) {
        console.log('❌ Region access denied for employee:', user.employeeId);
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
      console.log('✅ Region access granted');
    } else if (!isMobileClient) {
      console.log('🌐 Web admin - skipping region access validation');
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