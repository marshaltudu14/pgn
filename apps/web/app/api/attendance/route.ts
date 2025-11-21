/**
 * Attendance API Endpoint
 * Handles fetching and filtering attendance records
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listAttendanceRecords,
} from '@/services/attendance.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { AttendanceListParams, VerificationStatus } from '@pgn/shared';

const getAttendanceHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: AttendanceListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      date: searchParams.get('date') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      status: searchParams.get('status') || undefined,
      verificationStatus: searchParams.get('verificationStatus') as VerificationStatus || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      sortBy: searchParams.get('sortBy') || 'attendance_date',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };

    const result = await listAttendanceRecords(params);

    const response = NextResponse.json({
      success: true,
      data: result,
      message: 'Attendance records retrieved successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance records',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

export const GET = withSecurity(getAttendanceHandler);