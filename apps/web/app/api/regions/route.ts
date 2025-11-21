import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/services/regions.service';
import { createRegionSchema, regionsQuerySchema } from '@pgn/shared';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

// GET /api/regions - Fetch all regions with filtering and pagination
const getRegionsHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = regionsQuerySchema.parse(Object.fromEntries(searchParams));

    // Extract filters and pagination
    const filters = {
      state: query.state,
      city: query.city,
    };

    const pagination = {
      page: query.page,
      limit: query.limit,
    };

    const result = await getRegions(filters, pagination);

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching regions:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// POST /api/regions - Create a new region
const createRegionHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createRegionSchema.parse(body);

    const region = await createRegion(validatedData);

    const response = NextResponse.json(region, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating region:', error);

    if (error instanceof z.ZodError) {
      const response = NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    if (error instanceof Error) {
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

export const GET = withSecurity(getRegionsHandler);
export const POST = withSecurity(createRegionHandler);