import { NextRequest, NextResponse } from 'next/server';
import { getRegionById, updateRegion, deleteRegion } from '@/services/regions.service';
import { updateRegionSchema } from '@pgn/shared';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

// GET /api/regions/[id] - Get a specific region
const getRegionByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const { id } = await params;
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
};

// PUT /api/regions/[id] - Update a specific region
const updateRegionHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateRegionSchema.parse(body);

    const region = await updateRegion(id, validatedData);

    const response = NextResponse.json(region);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating region:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

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
};

// DELETE /api/regions/[id] - Delete a specific region
const deleteRegionHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const { id } = await params;
    await deleteRegion(id);

    const response = NextResponse.json({ message: 'Region deleted successfully' });
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
};

// Export with security middleware
export const GET = withSecurity(getRegionByIdHandler);
export const PUT = withSecurity(updateRegionHandler);
export const DELETE = withSecurity(deleteRegionHandler);