import { NextResponse } from 'next/server';
import { AuthErrorResponse, EmploymentStatus } from '@pgn/shared';

/**
 * Standardized error responses for authentication
 */
export class AuthErrorService {
  /**
   * Create a validation error response
   */
  static validationError(message: string, status: number = 400): NextResponse {
    const errorResponse: AuthErrorResponse = {
      error: 'Validation error',
      message,
    };
    return NextResponse.json(errorResponse, { status });
  }

  /**
   * Create an authentication error response
   */
  static authError(message: string = 'Authentication failed'): NextResponse {
    const errorResponse: AuthErrorResponse = {
      error: 'Authentication failed',
      message,
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  /**
   * Create an authorization error response (for access denied)
   */
  static accessDeniedError(
    message: string,
    employmentStatus?: EmploymentStatus
  ): NextResponse {
    const errorResponse: AuthErrorResponse = {
      error: 'Access denied',
      message,
      ...(employmentStatus && { employmentStatus }),
    };
    return NextResponse.json(errorResponse, { status: 403 });
  }

  /**
   * Create a rate limit error response
   */
  static rateLimitError(
    message: string = 'Too many requests, please try again later.',
    retryAfter?: number
  ): NextResponse {
    const errorResponse: AuthErrorResponse = {
      error: 'Rate limit exceeded',
      message,
      ...(retryAfter && { retryAfter }),
    };

    const response = NextResponse.json(errorResponse, { status: 429 });
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString());
    }

    return response;
  }

  /**
   * Create a server error response
   */
  static serverError(
    message: string = 'An unexpected error occurred'
  ): NextResponse {
    const errorResponse: AuthErrorResponse = {
      error: 'Internal server error',
      message,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  /**
   * Create a method not allowed error response
   */
  static methodNotAllowedError(
    method: string,
    allowedMethods?: string[]
  ): NextResponse {
    const message = allowedMethods
      ? `${method} method not allowed. Allowed methods: ${allowedMethods.join(', ')}`
      : `${method} method not allowed`;

    const response = NextResponse.json(
      {
        error: 'Method not allowed',
        message,
      },
      { status: 405 }
    );

    if (allowedMethods) {
      response.headers.set('Allow', allowedMethods.join(', '));
    }

    return response;
  }
}

/**
 * Employment status error messages
 */
export const EmploymentStatusMessages: Record<EmploymentStatus, string> = {
  ACTIVE: 'Account access denied',
  SUSPENDED: 'Account suspended - contact administrator',
  RESIGNED: 'Employment ended - thank you for your service',
  TERMINATED: 'Employment terminated - contact HR',
  ON_LEAVE: 'Currently on leave - contact administrator if access needed',
};

/**
 * Get employment status message
 */
export function getEmploymentStatusMessage(status: EmploymentStatus): string {
  return EmploymentStatusMessages[status];
}

/**
 * Check if employment status allows login
 */
export function canLoginWithStatus(status: EmploymentStatus): boolean {
  return status === 'ACTIVE' || status === 'ON_LEAVE';
}

/**
 * Create employment status-based error response
 */
export function createEmploymentStatusError(status: EmploymentStatus): NextResponse {
  return AuthErrorService.accessDeniedError(
    getEmploymentStatusMessage(status),
    status
  );
}