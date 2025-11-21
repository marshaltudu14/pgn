/**
 * Update Attendance Verification API Endpoint
 * Handles updating verification status of attendance records
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateAttendanceVerification } from '@/services/attendance.service';
import { withSecurity, addSecurityHeaders } from '@/lib/security-middleware';
import { UpdateVerificationRequest, VerificationStatus } from '@pgn/shared';

const updateVerificationHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; }> }
): Promise<NextResponse> => {
  try {
    const { id: recordId } = await params;

    if (!recordId) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Attendance record ID is required'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const body = await request.json();

    // Validate required fields
    if (!body.verificationStatus) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Verification status is required'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Validate verification status
    const validStatuses: VerificationStatus[] = ['PENDING', 'VERIFIED', 'REJECTED', 'FLAGGED'];
    if (!validStatuses.includes(body.verificationStatus)) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Invalid verification status. Must be one of: PENDING, VERIFIED, REJECTED, FLAGGED'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const updateRequest: UpdateVerificationRequest = {
      verificationStatus: body.verificationStatus,
      verificationNotes: body.verificationNotes || undefined,
    };

    const updatedRecord = await updateAttendanceVerification(recordId, updateRequest);

    const response = NextResponse.json({
      success: true,
      data: updatedRecord,
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

export const PUT = withSecurity(updateVerificationHandler);