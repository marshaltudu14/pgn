import { NextRequest, NextResponse } from 'next/server';
import { withSecurity, addSecurityHeaders, AuthenticatedRequest } from '@/lib/security-middleware';
import { attendanceService } from '@/services/attendance.service';
import { CheckOutRequest, CheckOutMethod, EmergencyCheckOutRequest } from '@pgn/shared';
import { withApiValidation } from '@/lib/api-validation';
import {
  CheckOutResponseSchema,
  DeviceInfoSchema,
  apiContract,
  z,
} from '@pgn/shared';

// Custom schema that accepts both 'selfie' and 'selfieData' field names for backward compatibility
const CheckOutMobileRequestCompatSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  lastLocationData: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0).optional(),
    timestamp: z.number().optional(),
    address: z.string().optional(),
  }).optional(),
  selfie: z.string().optional(),
  selfieData: z.string().optional(),
  deviceInfo: DeviceInfoSchema.optional(),
  method: z.enum(['MANUAL', 'AUTOMATIC', 'APP_CLOSED', 'BATTERY_DRAIN', 'FORCE_CLOSE']).default('MANUAL'),
  reason: z.string().optional(),
}).transform(
  (data: { selfie?: string; selfieData?: string }) => ({
    ...data,
    selfie: data.selfie || data.selfieData // Normalize to 'selfie' field
  })
);

/**
 * POST /api/attendance/checkout
 *
 * Handles employee check-out with location and selfie
 * Supports both manual check-outs and emergency check-outs
 */
const checkoutHandler = async (req: NextRequest): Promise<NextResponse> => {
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

    // Use validated body from middleware
    const body = (req as unknown as { validatedBody: Record<string, unknown> }).validatedBody;

    // Check if this is an emergency check-out (only reason and method are required)
    if (body.method && body.method !== 'MANUAL' && body.reason) {
      // Handle emergency check-out
      const emergencyRequest: EmergencyCheckOutRequest = {
        employeeId: user.employeeId,
        timestamp: new Date(),
        reason: body.reason as string,
        method: body.method as CheckOutMethod,
        lastLocationData: body.lastLocationData ? {
          latitude: (body.lastLocationData as { latitude: number }).latitude,
          longitude: (body.lastLocationData as { longitude: number }).longitude,
          accuracy: (body.lastLocationData as { accuracy?: number }).accuracy || 0,
          timestamp: new Date((body.lastLocationData as { timestamp?: number }).timestamp || Date.now()),
          address: (body.lastLocationData as { address?: string }).address
        } : undefined,
        selfieData: body.selfie as string, // Optional for emergency, normalized field
        deviceInfo: body.deviceInfo as {
          batteryLevel?: number;
          platform?: string;
          version?: string;
          model?: string;
        } | undefined
      };

      // Process emergency check-out through service
      const result = await attendanceService.emergencyCheckOut(user.employeeId, emergencyRequest);

      if (!result.success) {
        const response = NextResponse.json(
          {
            success: false,
            error: 'Emergency check-out failed',
            message: result.message
          },
          { status: 400 }
        );
        return addSecurityHeaders(response);
      }

      // Return emergency check-out success response
      const response = NextResponse.json({
        success: true,
        message: result.message,
        data: {
          attendanceId: result.attendanceId,
          timestamp: result.timestamp,
          status: result.status,
          checkInTime: result.checkInTime,
          checkOutTime: result.checkOutTime,
          workHours: result.workHours,
          verificationStatus: result.verificationStatus,
          emergencyCheckout: true
        }
      });

      return addSecurityHeaders(response);
    }

    // Handle regular check-out
    // Validate required fields for regular check-out (schema already validated this)
    if (!body.location || !body.selfie) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Location and selfie data are required for regular check-out'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Build check-out request
    const locationObj = body.location as { latitude: number; longitude: number; accuracy?: number; timestamp?: number; address?: string; };
    const checkOutRequest: CheckOutRequest = {
      employeeId: user.employeeId,
      location: {
        latitude: locationObj.latitude,
        longitude: locationObj.longitude,
        accuracy: locationObj.accuracy || 0,
        timestamp: new Date(locationObj.timestamp || Date.now()),
        address: locationObj.address
      },
      timestamp: new Date(),
      selfie: body.selfie as string, // Using normalized field
      deviceInfo: body.deviceInfo as {
        batteryLevel?: number;
        platform?: string;
        version?: string;
        model?: string;
      } | undefined,
      method: (body.method as CheckOutMethod) || 'MANUAL',
      reason: body.reason as string | undefined
    };

    // Process check-out through service
    const result = await attendanceService.checkOut(user.employeeId, checkOutRequest);

    if (!result.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Check-out failed',
          message: result.message
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Return success response following the schema format
    const response = NextResponse.json({
      success: true,
      message: result.message,
      data: {
        attendanceId: result.attendanceId!,
        checkOutTime: result.checkOutTime!.toISOString(),
        status: result.status!,
        workHours: result.workHours!,
        verificationStatus: result.verificationStatus!,
      }
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Check-out API error:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      const response = NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request body format'
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    // Handle unexpected errors
    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Check-out failed due to server error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
};

/**
 * Handle unsupported methods
 */
export async function GET(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Only POST method is supported for check-out'
    },
    { status: 405 }
  );
  return addSecurityHeaders(response);
}

// Apply Zod validation middleware and wrap with security
export const POST = withSecurity(
  withApiValidation(checkoutHandler, {
    body: CheckOutMobileRequestCompatSchema,
    response: CheckOutResponseSchema,
    validateResponse: process.env.NODE_ENV === 'development'
  })
);

// Add route to API contract
apiContract.addRoute({
  path: '/api/attendance/checkout',
  method: 'POST',
  inputSchema: CheckOutMobileRequestCompatSchema,
  outputSchema: CheckOutResponseSchema,
  description: 'Check out user for attendance with location and selfie'
});