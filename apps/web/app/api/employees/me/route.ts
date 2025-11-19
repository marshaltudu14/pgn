import { NextRequest, NextResponse } from 'next/server';
import { getEmployeeById } from '@/services/employee.service';
import { jwtService } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization token is required'
        },
        { status: 401 }
      );
    }

    // Extract and verify the JWT token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwtService.validateToken(token);

      if (!decoded || !decoded.sub || !decoded.employeeId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or malformed token'
          },
          { status: 401 }
        );
      }

      // Get employee data using the employeeId from the token
      const employee = await getEmployeeById(decoded.employeeId);

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            error: 'Employee not found'
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: employee,
        message: 'Current employee retrieved successfully'
      });
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token'
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error fetching current employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch current employee',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}