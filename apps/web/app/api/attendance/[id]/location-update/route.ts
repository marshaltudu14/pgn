import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import {
    LocationUpdateRequest, LocationUpdateResponseSchema,
    LocationUpdateRequestSchema, apiContract,
    RouteParamsSchema
} from '@pgn/shared';
import { NextRequest, NextResponse } from 'next/server';

const locationUpdateHandler = async (
  req: NextRequest,
  _context: { params?: unknown }
): Promise<NextResponse> => {
  try {
    // Use validated data from middleware
    const { id: attendanceId } = (req as unknown as { validatedParams: { id: string } }).validatedParams;
    const body = (req as unknown as { validatedBody: LocationUpdateRequest }).validatedBody;

    const success = await attendanceService.updateLocationTracking(attendanceId, body);

    if (!success) {
      const response = NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      );
      return addSecurityHeaders(response);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Location updated successfully',
      },
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error processing location update:', error);
    const response = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Apply Zod validation middleware and wrap with security
export const POST = withSecurity(
  withApiValidation(locationUpdateHandler, {
    body: LocationUpdateRequestSchema,
    params: RouteParamsSchema,
    response: LocationUpdateResponseSchema,
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/[id]/location-update',
  method: 'POST',
  inputSchema: LocationUpdateRequestSchema,
  outputSchema: LocationUpdateResponseSchema,
  description: 'Update location tracking for attendance record'
});
