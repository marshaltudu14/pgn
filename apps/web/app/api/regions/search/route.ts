import { NextRequest, NextResponse } from 'next/server';
import { searchRegions } from '@/services/regions.service';
import { searchRegionsSchema } from '@pgn/shared';
import { z } from 'zod';

// GET /api/regions/search - Search regions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = searchRegionsSchema.parse(Object.fromEntries(searchParams));

    const result = await searchRegions(query.q, {
      page: query.page,
      limit: query.limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching regions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}