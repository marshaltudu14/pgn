import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { attendanceService } from '@/services/attendance.service';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

/**
 * GET /api/attendance/status
 *
 * Returns current attendance status for the authenticated employee
 */
const statusHandler = async (req: NextRequest): Promise<NextResponse> => {
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

    // Get attendance status from service
    const status = await attendanceService.getAttendanceStatus(user.employeeId);

    // Return success response
    const response = NextResponse.json({
      success: true,
      data: status
    });

    // Set cache headers for status requests (short cache for real-time data)
    response.headers.set('Cache-Control', 'private, max-age=10');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    return response;

  } catch (error) {
    console.error('Attendance status API error:', error);

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch attendance status'
      },
      { status: 500 }
    );
  }
};

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only GET method is supported for attendance status'
    },
    { status: 405 }
  );
}

// Export with authentication middleware
export const GET = withAuth(statusHandler, {
  requireAuth: true,
  checkEmploymentStatus: true
});