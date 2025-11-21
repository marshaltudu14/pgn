import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { RefreshRequest } from '@pgn/shared';

/**
 * POST /api/auth/refresh
 *
 * Validates an existing token and generates a new token with updated expiration
 */
const refreshHandler = async (req: NextRequest): Promise<NextResponse> => {
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

      // Return success response wrapped in API response structure
      const apiResponse = {
        success: true,
        data: refreshResponse,
      };

      const response = NextResponse.json(apiResponse);

      return addSecurityHeaders(response);

    } catch (refreshError) {
      const errorMessage = refreshError instanceof Error ? refreshError.message : 'Token refresh failed';
      return AuthErrorService.authError(errorMessage);
    }

  } catch (error) {
    console.error('Token refresh API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during token refresh');
  }
};

// Export with security middleware and rate limiting
export const POST = withRateLimit(withSecurity(refreshHandler), apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}