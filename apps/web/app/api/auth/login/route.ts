import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withRateLimit, createRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { LoginRequest } from '@pgn/shared';

/**
 * POST /api/auth/login
 *
 * Authenticates an employee and returns a JWT token using Supabase
 */
const loginHandler = async (req: NextRequest): Promise<NextResponse> => {
  
  try {
    // Parse request body first to get user identifier for rate limiting
      const body = await req.json() as LoginRequest;
  
    // Validate required fields
    if (!body.password || !body.email) {
      return AuthErrorService.validationError('Email and password are required');
    }

    // No rate limiting for admin users, rate limiting for employees
    const email = body.email.toLowerCase().trim();
    let userRateLimit = null;

    // Only apply rate limiting to non-admin users
    if (!email.includes('admin')) {
      userRateLimit = createRateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per user per 15 minutes
        message: 'Too many login attempts for this account, please try again later.',
        keyGenerator: () => `auth:user:email:${email}`,
      });

      // Check per-user rate limit
      const rateLimitResult = userRateLimit(req);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    // Get client IP for logging (currently not used but kept for future implementation)
    req.headers.get('x-forwarded-for');

    try {
        // Attempt login using auth service
      const loginResponse = await authService.login(body);

        // Return success response wrapped in API response structure
      const apiResponse = {
        success: true,
        data: {
          token: loginResponse.token,
          refreshToken: loginResponse.refreshToken,
          expiresIn: loginResponse.expiresIn,
          employee: loginResponse.employee,
        },
      };

      const response = NextResponse.json(apiResponse);

      return addSecurityHeaders(response);

    } catch (loginError) {
      // Track failed login attempt for rate limiting (only for non-admin users)
      if (!email.includes('admin')) {
        await authService.trackFailedLoginAttempt();
      }

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

      // Handle credential errors with user-friendly messages
      const credentialErrors = [
        'Invalid email or password',
        'Login failed. Please check your credentials',
        'Please confirm your email address',
        'Too many login attempts. Please try again later'
      ];

      if (credentialErrors.some(err => errorMessage === err)) {
        return AuthErrorService.authError(errorMessage);
      }

      // Handle employee not found errors
      if (errorMessage.includes('Employee account not found')) {
        return AuthErrorService.authError('Employee account not found - contact administrator');
      }

      // Handle other errors with a generic message for security
      return AuthErrorService.authError('Login failed. Please check your credentials and try again');
    }

  } catch {
    // Handle unexpected errors gracefully without exposing internal details
    return AuthErrorService.serverError('Login service temporarily unavailable. Please try again later');
  }
};

// Login should be public (no token validation) but still block external requests
// Only mobile apps should be able to call login
const loginWithSecurity = withSecurity(loginHandler, {
  requireAuth: false // Login doesn't require existing authentication
});

// Apply rate limiting on top of security middleware
export const POST = withRateLimit(loginWithSecurity, createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 attempts per IP per 15 minutes
  message: 'Too many login attempts from this IP, please try again later.',
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return `auth:${ip}`;
  }
}));

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}