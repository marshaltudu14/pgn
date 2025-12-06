import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthenticatedRequest } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import { CheckInRequest } from '@pgn/shared';
import { addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  CheckInResponseSchema,
  CheckInMobileRequestSchema,
  apiContract,
} from '@pgn/shared';

/**
 * POST /api/attendance/checkin
 *
 * Handles employee check-in with location and selfie
 */
const checkinHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get authenticated user from request (attached by security middleware)
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user || !user.employeeId) {
      const response = NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Check if employee is active
    if (user.employmentStatus !== 'ACTIVE') {
      const response = NextResponse.json(
        {
          error: 'Forbidden',
          message: 'Check-in not allowed. Only active employees can check in.',
          employmentStatus: user.employmentStatus
        },
        { status: 403 }
      );
      return addSecurityHeaders(response);
    }

    // Use validated body from middleware
    const body = (req as unknown as { validatedBody: Record<string, unknown> }).validatedBody;

    // Build check-in request
    const checkInRequest: CheckInRequest = {
      employeeId: user.employeeId,
      location: {
        latitude: (body.location as { latitude: number }).latitude,
        longitude: (body.location as { longitude: number }).longitude,
        accuracy: (body.location as { accuracy?: number }).accuracy || 0,
        timestamp: new Date((body.location as { timestamp?: number }).timestamp || Date.now()),
        address: (body.location as { address?: string }).address
      },
      timestamp: new Date(),
      selfie: body.selfie as string,
      deviceInfo: body.deviceInfo as {
        batteryLevel?: number;
        platform?: string;
        version?: string;
        model?: string;
      } | undefined
    };

    // Process check-in through service
    const result = await attendanceService.checkIn(user.employeeId, checkInRequest);

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Check-in failed',
          message: result.message || 'Failed to check in. Please try again.',
          code: 'CHECKIN_FAILED'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Build response following the schema structure
    const response = NextResponse.json({
      success: true,
      data: {
        message: result.message || 'Check-in successful',
        attendanceId: result.attendanceId!,
        checkInTime: result.checkInTime!.toISOString(),
        status: result.status!,
        verificationStatus: result.verificationStatus!,
        workHours: result.workHours
      }
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('❌ [API ERROR] Check-in API error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request body format'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Handle unexpected errors
    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Check-in failed due to server error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only POST method is supported for check-in'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

// Apply Zod validation middleware and wrap with security
export const POST = withSecurity(
  withApiValidation(checkinHandler, {
    body: CheckInMobileRequestSchema,
    response: CheckInResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/checkin',
  method: 'POST',
  inputSchema: CheckInMobileRequestSchema,
  outputSchema: CheckInResponseSchema,
  description: 'Check in user for attendance with location and selfie'
});