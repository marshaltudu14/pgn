import { NextRequest, NextResponse } from 'next/server';
import {
  getFarmerById,
  updateFarmer,
  deleteFarmer
} from '@/services/farmer.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  FarmerFormDataSchema,
  FarmerResponseSchema,
  FarmerUpdatedResponseSchema,
  FarmerDeletedResponseSchema,
  apiContract,
  RouteParamsSchema,
  type FarmerUpdate,
} from '@pgn/shared';

// Interface for route context with params
interface RouteContext {
  params?: unknown;
}

// Interface for validated parameters request
interface ValidatedParamsRequest extends NextRequest {
  validatedParams: Record<string, string>;
}

// Interface for validated body request
interface ValidatedBodyRequest extends NextRequest {
  validatedBody: unknown;
}

const getFarmerHandler = withApiValidation(
  async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      // Get the route params from context
      const routeParams = context.params as Record<string, string>;
      const { id } = (request as ValidatedParamsRequest).validatedParams || routeParams || {};

      const farmer = await getFarmerById(id);

      const response = NextResponse.json({
        success: true,
        data: farmer,
        message: 'Farmer retrieved successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching farmer:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch farmer',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 404 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RouteParamsSchema,
    response: FarmerResponseSchema,
  }
);

const updateFarmerHandler = withApiValidation(
  async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      // Get the route params from context
      const routeParams = context.params as Record<string, string>;
      const { id } = (request as ValidatedParamsRequest).validatedParams || routeParams || {};

      // Use validated body from middleware
      const farmerData = (request as ValidatedBodyRequest).validatedBody as FarmerUpdate;

      const result = await updateFarmer(id, farmerData);

      const response = NextResponse.json({
        success: true,
        data: result,
        message: 'Farmer updated successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error updating farmer:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to update farmer',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RouteParamsSchema,
    body: FarmerFormDataSchema,
    response: FarmerUpdatedResponseSchema,
  }
);

const deleteFarmerHandler = withApiValidation(
  async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      // Get the route params from context
      const routeParams = context.params as Record<string, string>;
      const { id } = (request as ValidatedParamsRequest).validatedParams || routeParams || {};

      await deleteFarmer(id);

      const response = NextResponse.json({
        success: true,
        data: null,
        message: 'Farmer deleted successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error deleting farmer:', error);
      const response = NextResponse.json(
        {
          success: false,
          error: 'Failed to delete farmer',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RouteParamsSchema,
    response: FarmerDeletedResponseSchema,
  }
);

export const GET = withSecurity(getFarmerHandler);
export const PUT = withSecurity(updateFarmerHandler);
export const DELETE = withSecurity(deleteFarmerHandler);

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/farmers/[id]',
  method: 'GET',
  inputSchema: RouteParamsSchema,
  outputSchema: FarmerResponseSchema,
  description: 'Get a specific farmer by ID'
});

apiContract.addRoute({
  path: '/api/farmers/[id]',
  method: 'PUT',
  inputSchema: FarmerFormDataSchema,
  outputSchema: FarmerUpdatedResponseSchema,
  description: 'Update a specific farmer by ID'
});

apiContract.addRoute({
  path: '/api/farmers/[id]',
  method: 'DELETE',
  inputSchema: RouteParamsSchema,
  outputSchema: FarmerDeletedResponseSchema,
  description: 'Delete a specific farmer by ID'
});