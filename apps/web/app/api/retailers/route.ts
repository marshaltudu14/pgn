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
import { getEmployeeRegions, canEmployeeAccessRegion } from '@/services/regions.service';

const getRetailersHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Get validated query parameters from the middleware
    const params = (request as NextRequest & { validatedQuery: unknown }).validatedQuery;

    console.log('📥 Retailers API - Received params:', JSON.stringify(params, null, 2));

    // Check if this is a mobile client (employee) or web admin
    // Mobile app sends 'x-client-info: pgn-mobile-client'
    const isMobileClient = request.headers.get('x-client-info') === 'pgn-mobile-client';
    console.log('🔍 Retailers API - Client type:', isMobileClient ? 'Mobile Employee' : 'Web Admin');
    console.log('🔍 Retailers API - x-client-info header:', request.headers.get('x-client-info'));

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
      console.log('🌐 Web admin client - showing all retailers without region filtering');
      regionFilter = undefined;
    }

    const result = await listRetailers(params as Record<string, unknown>, regionFilter);

    console.log('📤 Retailers API - Total retailers found:', result.retailers.length);
    if (regionFilter && regionFilter.length > 0) {
      console.log('✅ Region filtering applied for', regionFilter.length, 'regions');
    }

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

    // Check if this is a mobile client (employee) or web admin
    // Mobile app sends 'x-client-info: pgn-mobile-client'
    const isMobileClient = request.headers.get('x-client-info') === 'pgn-mobile-client';
    console.log('🔍 Create Retailers API - Client type:', isMobileClient ? 'Mobile Employee' : 'Web Admin');

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
    if (isMobileClient && retailerData.region_id) {
      console.log('🔒 Validating region access for region_id:', retailerData.region_id);
      const hasAccess = await canEmployeeAccessRegion(user.employeeId, retailerData.region_id);

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