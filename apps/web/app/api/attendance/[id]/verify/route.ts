/**
 * Update Attendance Verification API Endpoint
 * Handles updating verification status of attendance records
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAttendanceVerification } from '@/services/attendance.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { withApiValidation } from '@/lib/api-validation';
import {
  UpdateVerificationRequestSchema,
  UpdateVerificationResponseSchema,
  VerificationStatus,
  apiContract,
  z,
} from '@pgn/shared';

// Schema for route parameters
const VerifyRouteParamsSchema = z.object({
  id: z.string().min(1, 'Attendance record ID is required'),
});

const updateVerificationHandler = async (
  request: NextRequest,
  context: { params?: any }
): Promise<NextResponse> => {
  try {
    // Use validated data from middleware
    const { id: recordId } = (request as any).validatedParams;
    const body = (request as any).validatedBody;

    const updateRequest = {
      verificationStatus: body.verificationStatus,
      verificationNotes: body.verificationNotes || undefined,
    };

    const updatedRecord = await updateAttendanceVerification(recordId, updateRequest);

    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Verification status updated successfully',
        record: updatedRecord,
      },
      message: 'Verification status updated successfully'
    });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error updating attendance verification:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Attendance record not found')) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'Attendance record not found'
          },
          { status: 404 }
        );
        return addSecurityHeaders(response);
      }

      if (error.message.includes('You do not have permission')) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to update this attendance record'
          },
          { status: 403 }
        );
        return addSecurityHeaders(response);
      }

      if (error.message.includes('new row violates row-level security policy')) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to update attendance verification. Please contact your administrator.'
          },
          { status: 403 }
        );
        return addSecurityHeaders(response);
      }
    }

    const response = NextResponse.json(
      {
        success: false,
        error: 'Failed to update attendance verification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

// Apply Zod validation middleware and wrap with security
export const PUT = withSecurity(
  withApiValidation(updateVerificationHandler, {
    body: UpdateVerificationRequestSchema,
    params: VerifyRouteParamsSchema,
    response: UpdateVerificationResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/[id]/verify',
  method: 'PUT',
  inputSchema: UpdateVerificationRequestSchema,
  outputSchema: UpdateVerificationResponseSchema,
  description: 'Update verification status of an attendance record'
});