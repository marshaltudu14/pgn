/**
 * Attendance API Endpoint
 * Handles fetching and filtering attendance records
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listAttendanceRecords,
} from '@/services/attendance.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  AttendanceListParamsSchema,
  AttendanceListResponseSchema,
  apiContract,
} from '@pgn/shared';

const getAttendanceHandler = async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Use validated query parameters from the middleware
    const params = (request as any).validatedQuery;

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

// Apply Zod validation middleware and wrap with security
export const GET = withSecurity(
  withApiValidation(getAttendanceHandler, {
    query: AttendanceListParamsSchema,
    response: AttendanceListResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance',
  method: 'GET',
  inputSchema: AttendanceListParamsSchema,
  outputSchema: AttendanceListResponseSchema,
  description: 'Retrieve paginated list of attendance records with filtering'
});