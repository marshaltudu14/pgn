import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, createRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { LoginRequest } from '@pgn/shared';

/**
 * POST /api/auth/login
 *
 * Authenticates an employee and returns a JWT token using Supabase
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  console.log('🚀 Login API endpoint called');

  try {
    // Parse request body first to get user identifier for rate limiting
    console.log('📝 Parsing request body...');
    const body = await req.json() as LoginRequest;
    console.log('📋 Request body received:', { email: body.email, userId: body.userId, hasPassword: !!body.password });

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

    // Get client IP for logging
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown';

    try {
      console.log('🔐 Calling authService.login()...');
      // Attempt login using auth service
      const loginResponse = await authService.login(body);
      console.log('✅ authService.login() successful');

      // Return success response
      const response = NextResponse.json(loginResponse);

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (loginError) {
      // Track failed login attempt for rate limiting (only for non-admin users)
      if (!email.includes('admin')) {
        await authService.trackFailedLoginAttempt(email, ipAddress);
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
}, createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per user per 15 minutes
  message: 'Too many login attempts for this account, please try again later.',
  keyGenerator: (req) => {
    // Use user identifier as key for per-user rate limiting
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    // Try to get user identifier from request body
    // Since we don't have the body yet, we'll use a combination approach
    // This will be refined when we actually process the request
    return `auth:${ip}`;
  }
}));

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('GET', ['POST']);
}