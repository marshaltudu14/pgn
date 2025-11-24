import { withSecurity } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import { LocationUpdateRequest } from '@pgn/shared';
import { NextRequest, NextResponse } from 'next/server';

const locationUpdateHandler = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  try {
    const { id: attendanceId } = await params;

    if (!attendanceId) {
      return NextResponse.json(
        { success: false, error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { latitude, longitude, accuracy, batteryLevel, timestamp } = body;

    // Validate required fields
    if (latitude === undefined || longitude === undefined || !timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required location data' },
        { status: 400 }
      );
    }

    const updateRequest: LocationUpdateRequest = {
      location: {
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(timestamp),
      },
      batteryLevel,
      timestamp: new Date(timestamp),
    };

    const success = await attendanceService.updateLocationTracking(attendanceId, updateRequest);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing location update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const POST = withSecurity(locationUpdateHandler);
