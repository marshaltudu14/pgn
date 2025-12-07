import { NextRequest, NextResponse } from 'next/server';
import { getRegionById, updateRegion, deleteRegion } from '@/services/regions.service';
import {
  updateRegionSchema,
  RegionResponseSchema,
  RegionDeleteResponseSchema,
  RegionIdParamSchema,
} from '@pgn/shared';
import { z } from 'zod';
import { withApiValidation } from '@/lib/api-validation';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { apiContract } from '@pgn/shared';

// Type extensions for validated request
interface ValidatedNextRequest extends NextRequest {
  validatedParams?: z.infer<typeof RegionIdParamSchema>;
  validatedBody?: z.infer<typeof updateRegionSchema>;
}

// GET /api/regions/[id] - Get a specific region
const getRegionByIdHandler = withApiValidation(
  async (req: NextRequest, _context: { params?: unknown }): Promise<NextResponse> => {
    try {
      const { id } = (req as ValidatedNextRequest).validatedParams!;
      const region = await getRegionById(id);

      if (!region) {
        const response = NextResponse.json(
          { error: 'Region not found' },
          { status: 404 }
        );
        return addSecurityHeaders(response);
      }

      const response = NextResponse.json(region);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching region:', error);

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RegionIdParamSchema,
    response: RegionResponseSchema,
  }
);

// PUT /api/regions/[id] - Update a specific region
const updateRegionHandler = withApiValidation(
  async (req: NextRequest, _context: { params?: unknown }): Promise<NextResponse> => {
    try {
      const { id } = (req as ValidatedNextRequest).validatedParams!;
      const validatedData = (req as ValidatedNextRequest).validatedBody!;

      const region = await updateRegion(id, validatedData);

      const response = NextResponse.json(region);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error updating region:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          const response = NextResponse.json(
            { error: error.message },
            { status: 404 }
          );
          return addSecurityHeaders(response);
        }
        if (error.message.includes('already exists')) {
          const response = NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RegionIdParamSchema,
    body: updateRegionSchema,
    response: RegionResponseSchema,
  }
);

// DELETE /api/regions/[id] - Delete a specific region
const deleteRegionHandler = withApiValidation(
  async (req: NextRequest, _context: { params?: unknown }): Promise<NextResponse> => {
    try {
      const { id } = (req as ValidatedNextRequest).validatedParams!;
      await deleteRegion(id);

      const response = NextResponse.json({
        success: true,
        message: 'Region deleted successfully'
      });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error deleting region:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          const response = NextResponse.json(
            { error: error.message },
            { status: 404 }
          );
          return addSecurityHeaders(response);
        }
      }

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    params: RegionIdParamSchema,
    response: RegionDeleteResponseSchema,
  }
);

// Add route definitions to API contract
apiContract.addRoute({
  path: '/api/regions/[id]',
  method: 'GET',
  inputSchema: RegionIdParamSchema,
  outputSchema: RegionResponseSchema,
  description: 'Get a specific region by ID'
});

apiContract.addRoute({
  path: '/api/regions/[id]',
  method: 'PUT',
  inputSchema: updateRegionSchema,
  outputSchema: RegionResponseSchema,
  description: 'Update a specific region by ID'
});

apiContract.addRoute({
  path: '/api/regions/[id]',
  method: 'DELETE',
  inputSchema: RegionIdParamSchema,
  outputSchema: RegionDeleteResponseSchema,
  description: 'Delete a specific region by ID'
});

// Export with security middleware
export const GET = withSecurity(getRegionByIdHandler);
export const PUT = withSecurity(updateRegionHandler);
export const DELETE = withSecurity(deleteRegionHandler);