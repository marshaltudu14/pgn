import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import {
  RefreshRequestSchema,
  RefreshResponseSchema,
  apiContract,
  type RefreshRequest,
} from '@pgn/shared';
import { withApiValidation } from '@/lib/api-validation';

/**
 * POST /api/auth/refresh
 *
 * Validates an existing token and generates a new token with updated expiration
 */
const refreshHandler = async (req: NextRequest): Promise<NextResponse> => {
  // Get validated body from the validation middleware
  const body = (req as NextRequest & { validatedBody: unknown }).validatedBody;

  try {
    // Attempt token refresh using auth service
    const refreshResponse = await authService.refreshToken(body as RefreshRequest);

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
}

// Add route to API contract
apiContract.addRoute({
  path: '/api/auth/refresh',
  method: 'POST',
  inputSchema: RefreshRequestSchema,
  outputSchema: RefreshResponseSchema,
  description: 'Refresh JWT token and get new expiration',
  requiresAuth: true,
  });

// Apply validation middleware FIRST, then security and rate limiting
const refreshWithValidation = withApiValidation(refreshHandler, {
  body: RefreshRequestSchema,
  response: RefreshResponseSchema,
});

// Export with security middleware (no auth required) and rate limiting
export const POST = withRateLimit(withSecurity(refreshWithValidation, { requireAuth: false }), apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}