import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, AuthenticatedRequest } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import { CheckInRequest } from '@pgn/shared';
import { addSecurityHeaders } from '@/lib/security-middleware';

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

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.location || !body.selfieData) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Location and selfie data are required'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Build check-in request
    const checkInRequest: CheckInRequest = {
      employeeId: user.employeeId,
      location: {
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        accuracy: body.location.accuracy || 0,
        timestamp: new Date(body.location.timestamp || Date.now()),
        address: body.location.address
      },
      timestamp: new Date(),
      selfie: body.selfieData,
      deviceInfo: body.deviceInfo
    };

    // Process check-in through service
    const result = await attendanceService.checkIn(user.employeeId, checkInRequest);

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Check-in failed',
          message: result.message
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Return success response
    const responseData = {
      attendanceId: result.attendanceId,
      timestamp: result.timestamp,
      status: result.status,
      checkInTime: result.checkInTime,
      verificationStatus: result.verificationStatus
    };
    console.log('🔍 [API DEBUG] Preparing success response:', responseData);

    const response = NextResponse.json({
      success: true,
      message: result.message,
      data: responseData
    });
    console.log('🔍 [API DEBUG] Check-in API completed successfully');

    // Add security headers
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

// Export with security middleware
export const POST = withSecurity(checkinHandler);