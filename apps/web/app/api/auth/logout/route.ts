import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { jwtService } from '@/lib/jwt';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';

/**
 * POST /api/auth/logout
 *
 * Invalidates the current user's session and token
 * Requires authentication - only logged-in users can logout
 */
const logoutHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get authenticated user from request (security middleware attaches user)
    const user = (req as AuthenticatedRequest).user;

    if (!user || !user.employeeId) {
      return AuthErrorService.authError('User not found in token');
    }

    // Extract token from Authorization header (security middleware already validated it)
    const authHeader = req.headers.get('authorization');
    const token = jwtService.extractTokenFromHeader(authHeader || '');

    if (!token) {
      return AuthErrorService.authError('Token not found in request');
    }

    try {
      // Attempt logout using auth service with the validated token
      const logoutResponse = await authService.logout({ token });

      // Return success response
      const response = NextResponse.json(logoutResponse);

      return addSecurityHeaders(response);

    } catch (logoutError) {
      const errorMessage = logoutError instanceof Error ? logoutError.message : 'Logout failed';
      return AuthErrorService.authError(errorMessage);
    }

  } catch (error) {
    console.error('Logout API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during logout');
  }
};

// Logout requires authentication (default behavior)
export const POST = withRateLimit(withSecurity(logoutHandler), apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}