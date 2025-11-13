import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { RefreshRequest } from '@pgn/shared';

/**
 * POST /api/auth/refresh
 *
 * Validates an existing token and generates a new token with updated expiration
 */
export const POST = withRateLimit(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Parse request body
    const body = await req.json() as RefreshRequest;

    // Validate required fields
    if (!body.token) {
      return AuthErrorService.validationError('Token is required');
    }

    try {
      // Attempt token refresh using auth service
      const refreshResponse = await authService.refreshToken(body);

      // Return success response
      const response = NextResponse.json(refreshResponse);

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
      return AuthErrorService.authError(errorMessage);
    }

  } catch (error) {
    console.error('Token refresh API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during token refresh');
  }
}, apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('GET', ['POST']);
}