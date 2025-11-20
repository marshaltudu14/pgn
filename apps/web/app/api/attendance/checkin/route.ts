import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { attendanceService } from '@/services/attendance.service';
import { CheckInRequest } from '@pgn/shared';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * POST /api/attendance/checkin
 *
 * Handles employee check-in with location and selfie
 */
const checkinHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get authenticated user from request
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    if (!user || !user.employeeId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.location || !body.selfieData) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Location and selfie data are required'
        },
        { status: 400 }
      );
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
      faceConfidence: body.faceConfidence || 0,
      deviceInfo: body.deviceInfo
    };

    // Process check-in through service
    const result = await attendanceService.checkIn(user.employeeId, checkInRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-in failed',
          message: result.message
        },
        { status: 400 }
      );
    }

    // Return success response
    const response = NextResponse.json({
      success: true,
      message: result.message,
      data: {
        attendanceId: result.attendanceId,
        timestamp: result.timestamp,
        status: result.status,
        checkInTime: result.checkInTime,
        verificationStatus: result.verificationStatus
      }
    });

    // Set security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;

  } catch (error) {
    console.error('Check-in API error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request body format'
        },
        { status: 400 }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Check-in failed due to server error'
      },
      { status: 500 }
    );
  }
};

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only POST method is supported for check-in'
    },
    { status: 405 }
  );
}

// Export with authentication middleware and rate limiting
export const POST = withAuth(checkinHandler, {
  requireAuth: true,
  checkEmploymentStatus: true
});