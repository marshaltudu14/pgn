import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { addSecurityHeaders } from '@/lib/security-middleware';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/auth/admin-logout
 *
 * Logout endpoint for admin users (Supabase session based)
 * This does not require JWT authentication since it's for admin session cleanup
 */
const adminLogoutHandler = async (_req: NextRequest): Promise<NextResponse> => {
  try {
    // For admin logout, we just need to sign out from Supabase
    // The authService.logout method expects a token, but for admins we handle it differently
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Supabase admin logout error:', error);
        // Continue with response even if Supabase logout fails
      }
    } catch (supabaseError) {
      console.warn('Supabase client error during admin logout:', supabaseError);
      // Continue with response even if Supabase client fails
    }

    const apiResponse = {
      success: true,
      data: {
        message: 'Admin logged out successfully',
      },
    };

    const response = NextResponse.json(apiResponse);
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Admin logout API error:', error);
    return AuthErrorService.serverError('An unexpected error occurred during admin logout');
  }
};

// Admin logout uses rate limiting but doesn't require JWT authentication
export const POST = withRateLimit(adminLogoutHandler, apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('GET', ['POST']);
  return addSecurityHeaders(response);
}