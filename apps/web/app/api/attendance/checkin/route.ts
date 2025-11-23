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
    console.log('🔍 [API DEBUG] Check-in API handler started');

    // Get authenticated user from request (attached by security middleware)
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;
    console.log('🔍 [API DEBUG] Authenticated user:', {
      employeeId: user?.employeeId,
      hasUser: !!user
    });

    if (!user || !user.employeeId) {
      console.log('❌ [API ERROR] Unauthorized - no user or employeeId');
      const response = NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Parse request body
    console.log('🔍 [API DEBUG] Parsing request body...');
    const body = await req.json();
    console.log('🔍 [API DEBUG] Request body keys:', Object.keys(body));

    // Validate required fields
    if (!body.location || !body.selfieData) {
      console.log('❌ [API ERROR] Missing required fields:', {
        hasLocation: !!body.location,
        hasSelfieData: !!body.selfieData
      });
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
      faceConfidence: body.faceConfidence || 0,
      deviceInfo: body.deviceInfo
    };
    console.log('🔍 [API DEBUG] Check-in request built:', {
      employeeId: checkInRequest.employeeId,
      location: checkInRequest.location,
      timestamp: checkInRequest.timestamp,
      hasSelfie: !!checkInRequest.selfie,
      faceConfidence: checkInRequest.faceConfidence,
      deviceInfo: checkInRequest.deviceInfo
    });

    // Process check-in through service
    console.log('🔍 [API DEBUG] Calling attendance service...');
    const result = await attendanceService.checkIn(user.employeeId, checkInRequest);
    console.log('🔍 [API DEBUG] Service result:', {
      success: result.success,
      message: result.message,
      attendanceId: result.attendanceId
    });

    if (!result.success) {
      console.log('❌ [API ERROR] Service returned failure:', result.message);
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