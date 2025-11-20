import { NextRequest, NextResponse } from 'next/server';
import { getRegions, createRegion } from '@/services/regions.service';
import { createRegionSchema, regionsQuerySchema } from '@pgn/shared';
import { z } from 'zod';

// GET /api/regions - Fetch all regions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = regionsQuerySchema.parse(Object.fromEntries(searchParams));

    // Extract filters and pagination
    const filters = {
      state: query.state,
      district: query.district,
      city: query.city,
    };

    const pagination = {
      page: query.page,
      limit: query.limit,
    };

    const result = await getRegions(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching regions:', error);

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

// POST /api/regions - Create a new region
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createRegionSchema.parse(body);

    const region = await createRegion(validatedData);

    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    console.error('Error creating region:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}