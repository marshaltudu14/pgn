import { NextRequest, NextResponse } from 'next/server';
import {
  getDealerById,
  updateDealer,
  deleteDealer
} from '@/services/dealer.service';
import {
  DealerUpdate,
  DealerFormDataSchema,
  BaseApiResponseSchema
} from '@pgn/shared';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import { apiContract } from '@pgn/shared/src/validation/build-time-checker';

// Route parameters schema for dealer ID
const DealerRouteParamsSchema = z.object({
  id: z.string().min(1, 'Dealer ID is required'),
});

const getDealerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Get validated parameters from middleware
    const { id } = (request as NextRequest & { validatedParams?: Record<string, string> }).validatedParams || (context.params as Record<string, string>) || {};
    const dealer = await getDealerById(id);

    const response = NextResponse.json({
      success: true,
      data: dealer,
      message: 'Dealer retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateDealerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Get validated parameters and body from middleware
    const { id } = (request as NextRequest & { validatedParams?: Record<string, string> }).validatedParams || (context.params as Record<string, string>) || {};
    const dealerData = (request as NextRequest & { validatedBody: unknown }).validatedBody as DealerUpdate;

    const result = await updateDealer(id, dealerData);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Dealer updated successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to update dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const deleteDealerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Get validated parameters from middleware
    const { id } = (request as NextRequest & { validatedParams?: Record<string, string> }).validatedParams || (context.params as Record<string, string>) || {};
    await deleteDealer(id);

    const response = NextResponse.json({
      success: true,
      data: null,
      message: 'Dealer deleted successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error deleting dealer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to delete dealer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/dealers/[id]',
  method: 'GET',
  inputSchema: DealerRouteParamsSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Get a single dealer by ID'
});

apiContract.addRoute({
  path: '/api/dealers/[id]',
  method: 'PUT',
  inputSchema: DealerFormDataSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Update a dealer by ID'
});

apiContract.addRoute({
  path: '/api/dealers/[id]',
  method: 'DELETE',
  inputSchema: DealerRouteParamsSchema,
  outputSchema: BaseApiResponseSchema,
  description: 'Delete a dealer by ID'
});

// Apply validation middleware, then security middleware
export const GET = withSecurity(withApiValidation(getDealerHandler, {
  params: DealerRouteParamsSchema,
  response: BaseApiResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const PUT = withSecurity(withApiValidation(updateDealerHandler, {
  params: DealerRouteParamsSchema,
  body: DealerFormDataSchema,
  response: BaseApiResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));

export const DELETE = withSecurity(withApiValidation(deleteDealerHandler, {
  params: DealerRouteParamsSchema,
  response: BaseApiResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development'
}));