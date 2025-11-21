/**
 * Security Middleware for PGN API
 *
 * This middleware implements security measures to block all external requests
 * and only allow React Native app access, following dukancard's proven patterns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtService } from './jwt';
import { JWTPayload } from '@pgn/shared';

// Interface for authenticated requests with user payload
export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

// Mobile client identification patterns
const MOBILE_CLIENT_PATTERNS = [
  /pgn-mobile/i,
  /pgn-app/i,
  /Expo/i,
  /ReactNative/i,
];

// Suspicious user agent patterns to block
const SUSPICIOUS_PATTERNS = [
  /curl/i,
  /wget/i,
  /postman/i,
  /insomnia/i,
  /httpie/i,
  /python-requests/i,
  /node-fetch/i,
  /axios/i,
  /bot/i,
  /spider/i,
  /crawler/i,
  /scrapy/i,
  /swagger/i,
  /openapi/i,
];

export interface SecurityValidationResult {
  allowed: boolean;
  reason?: string;
  clientType?: 'mobile' | 'web';
}

/**
 * Validates if the request is from a legitimate source
 */
export function validateRequestSecurity(request: NextRequest): SecurityValidationResult {
  const userAgent = request.headers.get('User-Agent') || '';
  const clientInfo = request.headers.get('x-client-info') || '';
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Check for same-origin requests (allow web app access)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteOrigin = new URL(siteUrl).origin;

  // Allow same-origin requests
  if (origin === siteOrigin ||
      (referer && referer.startsWith(siteOrigin)) ||
      (host && (host === 'localhost:3000' || host.includes('localhost')))) {
    return {
      allowed: true,
      clientType: 'web'
    };
  }

  // Check for legitimate mobile client
  const isMobileClient = MOBILE_CLIENT_PATTERNS.some(pattern =>
    pattern.test(userAgent) || pattern.test(clientInfo)
  );

  // Check for suspicious user agents
  const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => pattern.test(userAgent));

  // Block suspicious requests unless they're from legitimate mobile client
  if (isSuspicious && !isMobileClient) {
    return {
      allowed: false,
      reason: `Blocked suspicious user agent: ${userAgent.substring(0, 100)}`
    };
  }

  // Allow mobile clients
  if (isMobileClient) {
    // Additional checks for mobile client
    const expectedClientInfo = 'pgn-mobile-client';
    if (!clientInfo.includes(expectedClientInfo) && !userAgent.includes('Expo')) {
      return {
        allowed: false,
        reason: 'Invalid or missing mobile client identification'
      };
    }

    return {
      allowed: true,
      clientType: 'mobile'
    };
  }

  // Block all other external requests
  return {
    allowed: false,
    reason: 'External requests not allowed - only mobile app or web app access permitted'
  };
}

/**
 * Validates JWT token for mobile clients
 */
export async function validateMobileToken(request: NextRequest): Promise<{
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return {
        valid: false,
        error: 'Missing Authorization header'
      };
    }

    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        valid: false,
        error: 'Invalid token format'
      };
    }

    const payload = jwtService.validateToken(token);

    if (!payload) {
      return {
        valid: false,
        error: 'Invalid or expired token'
      };
    }

    // Check employment status
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

      return {
        valid: false,
        error: message
      };
    }

    return {
      valid: true,
      payload
    };

  } catch {
    return {
      valid: false,
      error: 'Token validation failed'
    };
  }
}

/**
 * Creates a security middleware that blocks external requests
 */
export function createSecurityMiddleware() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Skip security for health check endpoints
    if (request.nextUrl.pathname === '/api/health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Security validation
    const securityCheck = validateRequestSecurity(request);

    if (!securityCheck.allowed) {
      console.warn(`🚫 Security: Blocked request - ${securityCheck.reason}`, {
        url: request.url,
        userAgent: request.headers.get('User-Agent')?.substring(0, 100),
        clientInfo: request.headers.get('x-client-info'),
        origin: request.headers.get('origin'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'External requests are not allowed',
        code: 'EXTERNAL_ACCESS_DENIED'
      }, {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'false',
          'Access-Control-Allow-Methods': 'false',
        }
      });
    }

    // For OPTIONS requests, return CORS headers for mobile clients
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Token validation for mobile clients
    const tokenCheck = await validateMobileToken(request);

    if (!tokenCheck.valid || !tokenCheck.payload) {
      console.warn(`🔐 Security: Invalid token - ${tokenCheck.error}`, {
        url: request.url,
        userAgent: request.headers.get('User-Agent')?.substring(0, 100),
      });

      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        message: tokenCheck.error || 'Token validation failed',
        code: 'AUTHENTICATION_FAILED'
      }, {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Attach user info to request for downstream handlers
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = tokenCheck.payload;

    return null; // Continue to the actual handler
  };
}

/**
 * Higher-order function to wrap API route handlers with security
 */
export function withSecurity<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
  options: { requireAuth?: boolean } = {}
) {
  const { requireAuth = true } = options;

  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    // Skip security for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Security validation (always applied)
    const securityCheck = validateRequestSecurity(req);

    if (!securityCheck.allowed) {
      console.warn(`🚫 Security: Blocked request - ${securityCheck.reason}`, {
        url: req.url,
        userAgent: req.headers.get('User-Agent')?.substring(0, 100),
        clientInfo: req.headers.get('x-client-info'),
        origin: req.headers.get('origin'),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return NextResponse.json({
        success: false,
        error: 'Access denied',
        message: 'External requests are not allowed',
        code: 'EXTERNAL_ACCESS_DENIED'
      }, {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'false',
          'Access-Control-Allow-Methods': 'false',
        }
      });
    }

    // Token validation only if authentication is required
    if (requireAuth) {
      const tokenCheck = await validateMobileToken(req);

      if (!tokenCheck.valid || !tokenCheck.payload) {
        console.warn(`🔐 Security: Invalid token - ${tokenCheck.error}`, {
          url: req.url,
          userAgent: req.headers.get('User-Agent')?.substring(0, 100),
        });

        return NextResponse.json({
          success: false,
          error: 'Authentication failed',
          message: tokenCheck.error || 'Token validation failed',
          code: 'AUTHENTICATION_FAILED'
        }, {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      // Attach user info to request for downstream handlers
      const authenticatedRequest = req as AuthenticatedRequest;
      authenticatedRequest.user = tokenCheck.payload;
    }

    // Call the original handler
    const response = await handler(req, ...args);

    // Add security headers to response
    return addSecurityHeaders(response);
  };
}

/**
 * Helper function to add security headers to responses
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Remove server information
  response.headers.set('Server', '');
  response.headers.set('X-Powered-By', '');

  return response;
}

/**
 * Rate limiting configuration (to be implemented with Redis)
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Strict limit for auth endpoints
  },
  attendance: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Reasonable limit for attendance operations
  }
};