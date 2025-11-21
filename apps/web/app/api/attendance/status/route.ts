import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';

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

    // Return success response
    const response = NextResponse.json({
      success: true,
      data: status
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

// Export with security middleware
export const GET = withSecurity(statusHandler);