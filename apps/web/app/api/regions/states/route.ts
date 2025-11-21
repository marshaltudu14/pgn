import { NextRequest, NextResponse } from 'next/server';
import { getStates } from '@/services/regions.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';

// GET /api/regions/states - Get all distinct states
const getStatesHandler = async (_request: NextRequest): Promise<NextResponse> => {
  try {
    const states = await getStates();

    const response = NextResponse.json(states);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching states:', error);

    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getStatesHandler);