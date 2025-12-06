import { withApiValidation } from '@/lib/api-validation';
import { addSecurityHeaders, withSecurity } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import {
    LocationUpdateRequest, LocationUpdateResponseSchema,
    apiContract,
    RouteParamsSchema,
    z
} from '@pgn/shared';
import { NextRequest, NextResponse } from 'next/server';

// Custom schema that matches the current API format
const LocationUpdateCompatSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  batteryLevel: z.number().min(0).max(1).optional(),
  timestamp: z.union([z.number(), z.string()]), // Accept both Unix timestamp (number) and ISO string
});

const locationUpdateHandler = async (
  req: NextRequest,
  _context: { params?: unknown }
): Promise<NextResponse> => {
  try {
    // Use validated data from middleware
    const { id: attendanceId } = (req as unknown as { validatedParams: { id: string } }).validatedParams;
    const body = (req as unknown as { validatedBody: Record<string, unknown> }).validatedBody;

    // Handle timestamp - can be either Unix timestamp (number) or ISO string
    let timestampMs: number;
    if (typeof body.timestamp === 'number') {
      // Unix timestamp in milliseconds or seconds?
      // If it's too small to be milliseconds, assume it's seconds
      timestampMs = body.timestamp < 10000000000 ? body.timestamp * 1000 : body.timestamp;
    } else {
      // ISO string
      timestampMs = new Date(body.timestamp as string).getTime();
    }

    const updateRequest: LocationUpdateRequest = {
      location: {
        latitude: body.latitude as number,
        longitude: body.longitude as number,
        accuracy: (body.accuracy as number | undefined) || 0,
        timestamp: new Date(timestampMs),
      },
      batteryLevel: body.batteryLevel as number | undefined,
      timestamp: new Date(timestampMs),
    };

    const success = await attendanceService.updateLocationTracking(attendanceId, updateRequest);

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
    body: LocationUpdateCompatSchema,
    params: RouteParamsSchema,
    response: LocationUpdateResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/[id]/location-update',
  method: 'POST',
  inputSchema: LocationUpdateCompatSchema,
  outputSchema: LocationUpdateResponseSchema,
  description: 'Update location tracking for attendance record'
});
