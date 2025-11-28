import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import { withApiValidation } from '@/lib/api-validation';
import {
  AttendanceStatusResponseSchema,
  apiContract,
} from '@pgn/shared';

/**
 * GET /api/attendance/status
 *
 * Returns current attendance status for the authenticated employee
 */
const statusHandler = async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Get authenticated user from request (security middleware attaches user)
    const user = (req as AuthenticatedRequest).user;

    if (!user || !user.employeeId) {
      const response = NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid authentication' },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }

    // Get attendance status from service
    const status = await attendanceService.getAttendanceStatus(user.employeeId);

    // Return success response following the schema format
    const response = NextResponse.json({
      success: true,
      data: {
        status: status.status,
        checkInTime: status.checkInTime?.toISOString(),
        checkOutTime: status.checkOutTime?.toISOString(),
        workHours: status.workHours,
        employeeId: status.employeeId,
        totalDistance: status.totalDistance,
        lastLocationUpdate: status.lastLocationUpdate?.toISOString(),
        batteryLevel: status.batteryLevel,
        verificationStatus: status.verificationStatus,
        requiresCheckOut: status.requiresCheckOut,
        date: status.date,
        currentAttendanceId: status.currentAttendanceId,
      }
    });

    // Set cache headers for status requests (short cache for real-time data)
    response.headers.set('Cache-Control', 'private, max-age=10');
    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Attendance status API error:', error);

    // Handle unexpected errors
    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch attendance status'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only GET method is supported for attendance status'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

// Apply Zod validation middleware and wrap with security
export const GET = withSecurity(
  withApiValidation(statusHandler, {
    response: AttendanceStatusResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/status',
  method: 'GET',
  inputSchema: undefined, // No input schema for GET status
  outputSchema: AttendanceStatusResponseSchema,
  description: 'Get current attendance status for authenticated employee'
});