import { NextResponse } from 'next/server';
import { getDistrictsByState } from '@/services/regions.service';

// GET /api/regions/districts/[state] - Get districts by state
export async function GET(
  request: Request,
  { params }: { params: Promise<{ state: string }> }
) {
  try {
    const { state } = await params;
    const districts = await getDistrictsByState(state);

    return NextResponse.json(districts);
  } catch (error) {
    console.error('Error fetching districts:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}