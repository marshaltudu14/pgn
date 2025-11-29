import { NextResponse, NextRequest } from 'next/server';
import { withRateLimit, apiRateLimit } from '@/lib/rate-limit';
import { AuthErrorService } from '@/lib/auth-errors';
import { authService } from '@/services/auth.service';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  UserResponseSchema,
  apiContract
} from '@pgn/shared';

/**
 * GET /api/auth/user
 *
 * Returns current user profile information based on JWT token
 */
const userHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get authenticated user from request (security middleware attaches user)
    const user = (req as AuthenticatedRequest).user;

    if (!user || !user.employeeId) {
      const response = AuthErrorService.authError('User not found in token');
      return addSecurityHeaders(response);
    }

      // Get current employment status from database to ensure it's up-to-date
    const currentEmploymentStatus = await authService.getCurrentEmploymentStatus(user.employeeId);

    if (!currentEmploymentStatus) {
      const response = AuthErrorService.authError('User not found in system');
      return addSecurityHeaders(response);
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
      const response = AuthErrorService.accessDeniedError(message);
      return addSecurityHeaders(response);
    }

    // Return user profile information
    const userProfile = {
      id: user.employeeId,
      humanReadableId: user.sub,
      employmentStatus: currentEmploymentStatus,
      canLogin: authService.canLoginWithStatus(currentEmploymentStatus),
    };

    // Return success response wrapped in API response structure
    const apiResponse = {
      success: true,
      data: userProfile,
    };

    const response = NextResponse.json(apiResponse);

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('User profile API error:', error);
    const response = AuthErrorService.serverError('An unexpected error occurred while fetching user profile');
    return addSecurityHeaders(response);
  }
};

// Add route to API contract
apiContract.addRoute({
  path: '/api/auth/user',
  method: 'GET',
  outputSchema: UserResponseSchema,
  description: 'Get current user profile information'
});

// Apply validation middleware for response only, then security and rate limiting
const userWithValidation = withApiValidation(userHandler, {
  response: UserResponseSchema,
  validateResponse: process.env.NODE_ENV === 'development',
});

export const GET = withRateLimit(withSecurity(userWithValidation), apiRateLimit);

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('POST', ['GET']);
  return addSecurityHeaders(response);
}

export async function PUT(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('PUT', ['GET']);
  return addSecurityHeaders(response);
}

export async function DELETE(): Promise<NextResponse> {
  const response = AuthErrorService.methodNotAllowedError('DELETE', ['GET']);
  return addSecurityHeaders(response);
}