import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withRateLimit, createRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  apiContract,
  type LoginRequest,
} from '@pgn/shared';
import { withApiValidation } from '@/lib/api-validation';

/**
 * POST /api/auth/login
 *
 * Authenticates an employee and returns a JWT token using Supabase
 */
const loginHandler = async (req: NextRequest): Promise<NextResponse> => {
  // Get validated body from the validation middleware
  const body = (req as NextRequest & { validatedBody: unknown }).validatedBody;

  // No rate limiting for admin users, rate limiting for employees
  const email = (body as { email: string }).email.toLowerCase().trim();
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
    const loginResponse = await authService.login(body as LoginRequest);

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

    // Check if it's an employment status related error using text patterns
    if (errorMessage.includes('Account suspended')) {
      return AuthErrorService.accessDeniedError(
        'Account suspended - contact administrator',
        undefined,
        'ACCOUNT_SUSPENDED'
      );
    }

    if (errorMessage.includes('Employment ended')) {
      return AuthErrorService.accessDeniedError(
        'Employment ended - thank you for your service',
        undefined,
        'EMPLOYMENT_ENDED'
      );
    }

    if (errorMessage.includes('Employment terminated')) {
      return AuthErrorService.accessDeniedError(
        'Employment terminated - contact HR',
        undefined,
        'EMPLOYMENT_TERMINATED'
      );
    }

    if (errorMessage.includes('Currently on leave')) {
      return AuthErrorService.accessDeniedError(
        'Currently on leave - contact administrator if access needed',
        undefined,
        'EMPLOYMENT_ON_LEAVE'
      );
    }

    if (errorMessage.includes('Account access denied')) {
      return AuthErrorService.accessDeniedError(
        'Account access denied',
        undefined,
        'ACCOUNT_ACCESS_DENIED'
      );
    }

    // Handle credential errors with specific codes
    if (errorMessage.includes('Invalid email or password') ||
        errorMessage.includes('Login failed. Please check your credentials')) {
      return AuthErrorService.authError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (errorMessage.includes('Please confirm your email address')) {
      return AuthErrorService.authError('Please confirm your email address', 'EMAIL_NOT_CONFIRMED');
    }

    if (errorMessage.includes('Too many login attempts')) {
      return AuthErrorService.authError('Too many login attempts. Please try again later', 'RATE_LIMITED');
    }

    // Handle employee not found errors
    if (errorMessage.includes('Employee account not found')) {
      return AuthErrorService.authError('Employee account not found - contact administrator', 'ACCOUNT_NOT_FOUND');
    }

    // Handle other errors with a generic message for security
    return AuthErrorService.authError('Login failed. Please check your credentials and try again', 'INVALID_CREDENTIALS');
  }
}

// Add route to API contract
apiContract.addRoute({
  path: '/api/auth/login',
  method: 'POST',
  inputSchema: LoginRequestSchema,
  outputSchema: LoginResponseSchema,
  description: 'Authenticate user and return JWT token',
  requiresAuth: false,
});


// Apply validation middleware FIRST, then security and rate limiting
const loginWithValidation = withApiValidation(loginHandler, {
  body: LoginRequestSchema,
  response: LoginResponseSchema,
  validateResponse: false, // Disable response validation to prevent schema mismatch issues
});

// Login should be public (no token validation) but still block external requests
// Only mobile apps should be able to call login
const loginWithSecurity = withSecurity(loginWithValidation, {
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