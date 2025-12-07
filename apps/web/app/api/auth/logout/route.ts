import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { jwtService } from '@/lib/jwt';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  LogoutRequestSchema,
  LogoutResponseSchema,
  apiContract
} from '@pgn/shared';

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

    // Try to get token from validated request body first, then fallback to Authorization header
    const body = (req as NextRequest & { validatedBody: unknown }).validatedBody;
    let token = (body as { token?: string })?.token;

    // If no token in body, try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      const headerToken = jwtService.extractTokenFromHeader(authHeader || undefined);
      token = headerToken;
    }

    if (!token) {
      return AuthErrorService.authError('Token not found in request');
    }

    try {
      // Attempt logout using auth service with the validated token
      const logoutResponse = await authService.logout({ token });

      // Return success response wrapped in API response structure
      const apiResponse = {
        success: true,
        data: logoutResponse,
      };

      const response = NextResponse.json(apiResponse);

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

// Add route to API contract
apiContract.addRoute({
  path: '/api/auth/logout',
  method: 'POST',
  inputSchema: LogoutRequestSchema,
  outputSchema: LogoutResponseSchema,
  description: 'Logout user and invalidate token'
});

// Apply validation middleware FIRST, then security and rate limiting
const logoutWithValidation = withApiValidation(logoutHandler, {
  body: LogoutRequestSchema,
  response: LogoutResponseSchema,
});

// Logout requires authentication (default behavior)
export const POST = withRateLimit(withSecurity(logoutWithValidation), apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}