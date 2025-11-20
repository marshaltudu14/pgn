import { NextResponse } from 'next/server';
import { getCitiesByDistrict } from '@/services/regions.service';

// GET /api/regions/cities/[state]/[district] - Get cities by state and district
export async function GET(
  request: Request,
  { params }: { params: Promise<{ state: string; district: string }> }
) {
  try {
    // Decode URL parameters (they might be encoded)
    const { state, district } = await params;
    const decodedState = decodeURIComponent(state);
    const decodedDistrict = decodeURIComponent(district);

    const cities = await getCitiesByDistrict(decodedState, decodedDistrict);

    return NextResponse.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}