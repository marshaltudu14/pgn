import { NextRequest, NextResponse } from 'next/server';
import {
  getRetailerById,
  updateRetailer,
  deleteRetailer
} from '@/services/retailer.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  RetailerFormDataSchema,
  RetailerResponseSchema,
  RetailerUpdatedResponseSchema,
  RetailerDeletedResponseSchema
} from '@pgn/shared';
import { RouteParamsSchema } from '@pgn/shared';
import { buildTimeApiContract } from '@pgn/shared';

const getRetailerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Use validated parameters from the middleware, or fall back to context params
    const validatedParams = (request as NextRequest & { validatedParams?: { id: string } }).validatedParams;
    const { id } = validatedParams || (context.params ? await (context.params as Promise<{ id: string }>) : { id: '' });
    const retailer = await getRetailerById(id);

    const response = NextResponse.json({
      success: true,
      data: retailer,
      message: 'Retailer retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching retailer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
    return addSecurityHeaders(response);
  }
};

const updateRetailerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Use validated parameters and body from the middleware
    const validatedParams = (request as NextRequest & { validatedParams?: { id: string } }).validatedParams;
    const { id } = validatedParams || (context.params ? await (context.params as Promise<{ id: string }>) : { id: '' });
    const retailerData = (request as NextRequest & { validatedBody?: Record<string, unknown> }).validatedBody || {};

    const result = await updateRetailer(id, retailerData as Record<string, unknown>);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Retailer updated successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating retailer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to update retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

const deleteRetailerHandler = async (request: NextRequest, context: { params?: unknown }): Promise<NextResponse> => {
  try {
    // Use validated parameters from the middleware
    const validatedParams = (request as NextRequest & { validatedParams?: { id: string } }).validatedParams;
    const { id } = validatedParams || (context.params ? await (context.params as Promise<{ id: string }>) : { id: '' });
    await deleteRetailer(id);

    const response = NextResponse.json({
      success: true,
      data: null,
      message: 'Retailer deleted successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error deleting retailer:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to delete retailer',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Add routes to API contract
buildTimeApiContract.addRoute({
  path: '/api/retailers/[id]',
  method: 'GET',
  inputSchema: RouteParamsSchema,
  outputSchema: RetailerResponseSchema,
  description: 'Get a single retailer by ID'
});

buildTimeApiContract.addRoute({
  path: '/api/retailers/[id]',
  method: 'PUT',
  inputSchema: RetailerFormDataSchema, // Body schema is the primary input for documentation
  outputSchema: RetailerUpdatedResponseSchema,
  description: 'Update a retailer by ID'
});

buildTimeApiContract.addRoute({
  path: '/api/retailers/[id]',
  method: 'DELETE',
  inputSchema: RouteParamsSchema,
  outputSchema: RetailerDeletedResponseSchema,
  description: 'Delete a retailer by ID'
});

// Apply validation middleware before security middleware
export const GET = withSecurity(
  withApiValidation(getRetailerHandler, {
    params: RouteParamsSchema,
    response: RetailerResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

export const PUT = withSecurity(
  withApiValidation(updateRetailerHandler, {
    params: RouteParamsSchema,
    body: RetailerFormDataSchema,
    response: RetailerUpdatedResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

export const DELETE = withSecurity(
  withApiValidation(deleteRetailerHandler, {
    params: RouteParamsSchema,
    response: RetailerDeletedResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);