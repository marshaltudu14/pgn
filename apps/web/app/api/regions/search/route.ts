import { NextRequest, NextResponse } from 'next/server';
import { searchRegions } from '@/services/regions.service';
import { searchRegionsSchema } from '@pgn/shared';
import { z } from 'zod';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

// GET /api/regions/search - Search regions
const searchRegionsHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = searchRegionsSchema.parse(Object.fromEntries(searchParams));

    const result = await searchRegions(query.q, {
      page: query.page,
      limit: query.limit,
    });

    const response = NextResponse.json(result);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error searching regions:', error);

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

export const GET = withSecurity(searchRegionsHandler);