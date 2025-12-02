import { NextRequest, NextResponse } from 'next/server';
import { getStates } from '@/services/regions.service';
import { StatesListResponseSchema } from '@pgn/shared';
import { withApiValidation } from '@/lib/api-validation';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { apiContract } from '@pgn/shared';

// GET /api/regions/states - Get all distinct states
const getStatesHandler = withApiValidation(
  async (_req: NextRequest): Promise<NextResponse> => {
    try {
      const states = await getStates();

      const response = NextResponse.json({ data: states });
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Error fetching states:', error);

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }
  },
  {
    response: StatesListResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development',
  }
);

// Add route definition to API contract
apiContract.addRoute({
  path: '/api/regions/states',
  method: 'GET',
  outputSchema: StatesListResponseSchema,
  description: 'Get all distinct states from the regions database'
});

export const GET = withSecurity(getStatesHandler);