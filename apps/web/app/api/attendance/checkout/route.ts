import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { attendanceService } from '@/services/attendance.service';
import { CheckOutRequest, CheckOutMethod, EmergencyCheckOutRequest } from '@pgn/shared';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * POST /api/attendance/checkout
 *
 * Handles employee check-out with location and selfie
 * Supports both manual check-outs and emergency check-outs
 */
const checkoutHandler = async (req: NextRequest): Promise<NextResponse> => {
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

    // Check if this is an emergency check-out (only reason and method are required)
    if (body.method && body.method !== 'MANUAL' && body.reason) {
      // Handle emergency check-out
      const emergencyRequest: EmergencyCheckOutRequest = {
        employeeId: user.employeeId,
        timestamp: new Date(),
        reason: body.reason,
        method: body.method as CheckOutMethod,
        lastLocationData: body.lastLocationData ? {
          latitude: body.lastLocationData.latitude,
          longitude: body.lastLocationData.longitude,
          accuracy: body.lastLocationData.accuracy || 0,
          timestamp: new Date(body.lastLocationData.timestamp || Date.now()),
          address: body.lastLocationData.address
        } : undefined,
        selfieData: body.selfieData, // Optional for emergency
        deviceInfo: body.deviceInfo
      };

      // Process emergency check-out through service
      const result = await attendanceService.emergencyCheckOut(user.employeeId, emergencyRequest);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Emergency check-out failed',
            message: result.message
          },
          { status: 400 }
        );
      }

      // Return emergency check-out success response
      const response = NextResponse.json({
        success: true,
        message: result.message,
        data: {
          attendanceId: result.attendanceId,
          timestamp: result.timestamp,
          status: result.status,
          checkInTime: result.checkInTime,
          checkOutTime: result.checkOutTime,
          workHours: result.workHours,
          verificationStatus: result.verificationStatus,
          emergencyCheckout: true
        }
      });

      // Set security headers
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Content-Type-Options', 'nosniff');

      return response;
    }

    // Handle regular check-out
    // Validate required fields for regular check-out
    if (!body.location || !body.selfieData) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Location and selfie data are required for regular check-out'
        },
        { status: 400 }
      );
    }

    // Build check-out request
    const checkOutRequest: CheckOutRequest = {
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
      deviceInfo: body.deviceInfo,
      method: body.method || 'MANUAL',
      reason: body.reason
    };

    // Process check-out through service
    const result = await attendanceService.checkOut(user.employeeId, checkOutRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Check-out failed',
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
        checkOutTime: result.checkOutTime,
        workHours: result.workHours,
        verificationStatus: result.verificationStatus,
        emergencyCheckout: false
      }
    });

    // Set security headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;

  } catch (error) {
    console.error('Check-out API error:', error);

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
        message: 'Check-out failed due to server error'
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
      message: 'Only POST method is supported for check-out'
    },
    { status: 405 }
  );
}

// Export with authentication middleware
export const POST = withAuth(checkoutHandler, {
  requireAuth: true,
  checkEmploymentStatus: true
});