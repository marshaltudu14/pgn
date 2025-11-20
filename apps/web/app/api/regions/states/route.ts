import { NextResponse } from 'next/server';
import { getStates } from '@/services/regions.service';

// GET /api/regions/states - Get all distinct states
export async function GET() {
  try {
    const states = await getStates();

    return NextResponse.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}