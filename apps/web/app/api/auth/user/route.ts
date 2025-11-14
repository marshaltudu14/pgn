import { NextResponse } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * GET /api/auth/user
 *
 * Returns current user profile information based on JWT token
 */
export const GET = withRateLimit(
  withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Extract user info from authenticated request
      const user = req.user;

      if (!user) {
        return AuthErrorService.authError('User not found in token');
      }

      // Get current employment status from database to ensure it's up-to-date
      const currentEmploymentStatus = await authService.getCurrentEmploymentStatus(user.employeeId);

      if (!currentEmploymentStatus) {
        return AuthErrorService.authError('User not found in system');
      }

      // Check if user can still login based on current employment status
      if (!authService.canLoginWithStatus(currentEmploymentStatus)) {
        // Get the appropriate employment status message
        let message = 'Account access denied';
        switch (currentEmploymentStatus) {
          case 'SUSPENDED':
            message = 'Account suspended - contact administrator';
            break;
          case 'RESIGNED':
            message = 'Employment ended - thank you for your service';
            break;
          case 'TERMINATED':
            message = 'Employment terminated - contact HR';
            break;
          case 'ON_LEAVE':
            message = 'Currently on leave - contact administrator if access needed';
            break;
          default:
            message = 'Account access denied';
        }
        return AuthErrorService.accessDeniedError(message);
      }

      // Return user profile information
      const userProfile = {
        id: user.employeeId,
        humanReadableId: user.sub,
        employmentStatus: currentEmploymentStatus,
        canLogin: authService.canLoginWithStatus(currentEmploymentStatus),
      };

      const response = NextResponse.json(userProfile);

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;

    } catch (error) {
      console.error('User profile API error:', error);
      return AuthErrorService.serverError('An unexpected error occurred while fetching user profile');
    }
  }),
  apiRateLimit
);

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('POST', ['GET']);
}

export async function PUT(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('PUT', ['GET']);
}

export async function DELETE(): Promise<NextResponse> {
  return AuthErrorService.methodNotAllowedError('DELETE', ['GET']);
}