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
} from '@pgn/shared';

const getFarmerHandler = withApiValidation(
  async (request: NextRequest, context: { params?: any }): Promise<NextResponse> => {
    try {
      // Get the route params from context or await params promise
      const routeParams = context.params;
      const { id } = (request as any).validatedParams || (typeof routeParams?.then === 'function' ? await routeParams : routeParams);

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
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

const updateFarmerHandler = withApiValidation(
  async (request: NextRequest, context: { params?: any }): Promise<NextResponse> => {
    try {
      // Get the route params from context or await params promise
      const routeParams = context.params;
      const { id } = (request as any).validatedParams || (typeof routeParams?.then === 'function' ? await routeParams : routeParams);

      // Use validated body from middleware
      const farmerData = (request as any).validatedBody;

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
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

const deleteFarmerHandler = withApiValidation(
  async (request: NextRequest, context: { params?: any }): Promise<NextResponse> => {
    try {
      // Get the route params from context or await params promise
      const routeParams = context.params;
      const { id } = (request as any).validatedParams || (typeof routeParams?.then === 'function' ? await routeParams : routeParams);

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
    validateResponse: process.env.NODE_ENV === 'development',
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