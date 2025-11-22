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
    console.log('[CHECKIN API] Starting check-in process');

    // Get authenticated user from request (attached by security middleware)
    const authenticatedReq = req as AuthenticatedRequest;
    const user = authenticatedReq.user;

    console.log('[CHECKIN API] Authenticated user:', {
      employeeId: user?.employeeId,
      hasUser: !!user
    });

    if (!user || !user.employeeId) {
      console.log('[CHECKIN API] Authentication failed - no user or employeeId');
      const response = NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Parse request body
    const body = await req.json();

    console.log('[CHECKIN API] Request body received:', {
      hasLocation: !!body.location,
      hasSelfieData: !!body.selfieData,
      faceConfidence: body.faceConfidence,
      hasDeviceInfo: !!body.deviceInfo
    });

    
    // Validate required fields
    if (!body.location || !body.selfieData) {
      console.log('[CHECKIN API] Validation failed:', {
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

    console.log('[CHECKIN API] Built check-in request:', {
      employeeId: checkInRequest.employeeId,
      location: {
        latitude: checkInRequest.location.latitude,
        longitude: checkInRequest.location.longitude,
        hasTimestamp: !!checkInRequest.location.timestamp
      },
      hasSelfie: !!checkInRequest.selfie,
      faceConfidence: checkInRequest.faceConfidence,
      hasDeviceInfo: !!checkInRequest.deviceInfo
    });

    // Process check-in through service
    console.log('[CHECKIN API] Calling attendance service...');
    const result = await attendanceService.checkIn(user.employeeId, checkInRequest);

    console.log('[CHECKIN API] Service result:', {
      success: result.success,
      message: result.message,
      hasAttendanceId: !!result.attendanceId,
      hasTimestamp: !!result.timestamp
    });

  
    if (!result.success) {
      console.log('[CHECKIN API] Service returned failure:', {
        message: result.message,
        success: result.success
      });
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

    console.log('[CHECKIN API] Returning success response:', {
      success: true,
      message: result.message,
      responseDataKeys: Object.keys(responseData)
    });

    const response = NextResponse.json({
      success: true,
      message: result.message,
      data: responseData
    });

    // Add security headers
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Check-in API error:', error);

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