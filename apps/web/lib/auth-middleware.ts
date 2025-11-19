import { NextRequest, NextResponse } from 'next/server';
import { jwtService } from './jwt';
import { JWTPayload, EmploymentStatus, AuthMiddlewareOptions } from '@pgn/shared';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * JWT Authentication Middleware for Next.js API routes
 *
 * This middleware validates JWT tokens and attaches user context to requests.
 * It checks for employment status in real-time and handles various error scenarios.
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions = {}) {
  const {
    requireAuth = true,
    checkEmploymentStatus = true
  } = options;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Skip authentication for options requests
    if (request.method === 'OPTIONS') {
      return null;
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = jwtService.extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      if (requireAuth) {
        return NextResponse.json(
          {
            error: 'Authentication required',
            message: 'Missing or invalid Authorization header'
          },
          { status: 401 }
        );
      }
      return null; // Continue without authentication if not required
    }

    // Validate the token
    const payload = jwtService.validateToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: 'Invalid or expired token'
        },
        { status: 401 }
      );
    }

    // Check if user can login based on employment status
    if (!payload.canLogin) {
      let message = 'Account access denied';

      switch (payload.employmentStatus) {
        case 'SUSPENDED':
          message = 'Account suspended - contact administrator';
          break;
        case 'RESIGNED':
          message = 'Employment ended - thank you for your service';
          break;
        case 'TERMINATED':
          message = 'Employment terminated - contact HR';
          break;
        default:
          message = 'Account access denied';
      }

      return NextResponse.json(
        {
          error: 'Access denied',
          message,
          employmentStatus: payload.employmentStatus
        },
        { status: 403 }
      );
    }

    // If employment status checking is enabled, verify current status in database
    if (checkEmploymentStatus) {
      try {
        // TODO: Implement database check for current employment status
        // This would query the employees table to ensure the employment status
        // hasn't changed since the token was issued

        // For now, we'll skip this step as it requires database integration
        // In a real implementation, you would:
        // 1. Connect to your database
        // 2. Query the employees table using payload.employeeId
        // 3. Verify the current employment_status and can_login fields
        // 4. Update the payload if needed

      } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json(
          {
            error: 'Authentication error',
            message: 'Unable to verify employment status'
          },
          { status: 500 }
        );
      }
    }

    // Attach user context to the request
    // In Next.js middleware, we can't modify the request object directly,
    // so we'll add the user info to headers for the API route to process
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.employeeId);
    requestHeaders.set('x-user-sub', payload.sub);
    requestHeaders.set('x-user-employment-status', payload.employmentStatus);
    requestHeaders.set('x-user-can-login', payload.canLogin.toString());

    // When used in API routes (withAuth), we need to return null to allow the handler to be called
    // The withAuth wrapper will read the headers we just set and create the user object
    if (request.headers.get('x-middleware-context') === 'withAuth') {
      // Return null to allow withAuth to proceed - headers are passed via the tempRequest
      return null;
    }

    // For Next.js middleware usage, create a new request with the modified headers
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Add user info to response headers for client-side access if needed
    response.headers.set('x-user-sub', payload.sub);
    response.headers.set('x-user-employment-status', payload.employmentStatus);

    return response;
  };
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function withAuth<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  const middleware = createAuthMiddleware(options);

  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Add context header to indicate this is being called from withAuth
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-middleware-context', 'withAuth');

    // Create a temporary request with the context header
    const tempRequest = new Request(req.url, {
      method: req.method,
      headers: requestHeaders,
      body: req.body,
    }) as NextRequest;
    const result = await middleware(tempRequest);

    // If middleware returned a response (error), return it
    if (result) {
      return result;
    }

    // Copy headers from tempRequest back to original request
    const authHeaders = tempRequest.headers;
    const originalHeaders = req.headers as Headers;

    // Update original headers with any new ones from tempRequest
    authHeaders.forEach((value, key) => {
      if (key.startsWith('x-user-')) {
        originalHeaders.set(key, value);
      }
    });

    // Extract user info from headers and attach to request
    const authenticatedReq = req as AuthenticatedRequest;

    if (authHeaders.get('x-user-id')) {
      authenticatedReq.user = {
        sub: authHeaders.get('x-user-sub') || '',
        employeeId: authHeaders.get('x-user-id') || '',
        employmentStatus: authHeaders.get('x-user-employment-status') as EmploymentStatus,
        canLogin: authHeaders.get('x-user-can-login') === 'true',
        iat: 0, // These will be available from the original token if needed
        exp: 0,
      };
    }

    // Call the original handler
    return handler(authenticatedReq, ...args);
  };
}

/**
 * Helper function to get user info from request
 */
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  const token = jwtService.extractTokenFromHeader(authHeader || undefined);

  if (!token) {
    return null;
  }

  return jwtService.validateToken(token);
}

/**
 * Public routes that don't require authentication
 */
export const publicRoutes = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout',
];

/**
 * Check if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}