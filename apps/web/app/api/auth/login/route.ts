import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, authRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { LoginRequest } from '@pgn/shared';

/**
 * POST /api/auth/login
 *
 * Authenticates an employee and returns a JWT token using Supabase
 */
export const POST = withRateLimit(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Parse request body
    const body = await req.json() as LoginRequest;

    // Validate required fields
    if (!body.userId || !body.password) {
      return AuthErrorService.validationError('User ID and password are required');
    }

    // Get client IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Check rate limit
    const hasExceededLimit = await authService.hasExceededRateLimit(ipAddress);
    if (hasExceededLimit) {
      return AuthErrorService.rateLimitError(
        'Too many login attempts, please try again later.',
        900 // 15 minutes
      );
    }

    try {
      // Attempt login using auth service
      const loginResponse = await authService.login(body);

      // Return success response
      const response = NextResponse.json(loginResponse);

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (loginError) {
      // Track failed login attempt for rate limiting
      await authService.trackFailedLoginAttempt(body.userId, ipAddress);

      // Handle specific employment status errors
      const errorMessage = loginError instanceof Error ? loginError.message : 'Login failed';

      // Check if it's an employment status related error
      const employmentStatusErrors = [
        'Account suspended - contact administrator',
        'Employment ended - thank you for your service',
        'Employment terminated - contact HR',
        'Currently on leave - contact administrator if access needed',
        'Account access denied'
      ];

      if (employmentStatusErrors.some(err => errorMessage === err)) {
        return AuthErrorService.accessDeniedError(errorMessage);
      }

      // Handle credential errors
      if (errorMessage === 'Invalid user ID or password') {
        return AuthErrorService.authError(errorMessage);
      }

      // Handle other errors
      return AuthErrorService.serverError(errorMessage);
    }

  } catch (error) {
    console.error('Login API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during login');
  }
}, authRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('GET', ['POST']);
}