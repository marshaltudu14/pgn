import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { LogoutRequest } from '@pgn/shared';

/**
 * POST /api/auth/logout
 *
 * Validates and invalidates a JWT token using Supabase
 */
export const POST = withRateLimit(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Parse request body
    const body = await req.json() as LogoutRequest;

    // Validate required fields
    if (!body.token) {
      return AuthErrorService.validationError('Token is required');
    }

    try {
      // Attempt logout using auth service
      const logoutResponse = await authService.logout(body);

      // Return success response
      const response = NextResponse.json(logoutResponse);

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (logoutError) {
      const errorMessage = logoutError instanceof Error ? logoutError.message : 'Logout failed';
      return AuthErrorService.authError(errorMessage);
    }

  } catch (error) {
    console.error('Logout API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during logout');
  }
}, apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('GET', ['POST']);
}