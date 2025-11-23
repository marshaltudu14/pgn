/**
 * Unit tests for security-middleware.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtService } from '../jwt';
import {
  validateRequestSecurity,
  validateMobileToken,
  validateAdminSession,
  createSecurityMiddleware,
  withSecurity,
  addSecurityHeaders,
  AuthenticatedRequest,
  RATE_LIMIT_CONFIGS
} from '../security-middleware';
import { createClient } from '../../utils/supabase/server';
import { EmploymentStatus } from '@pgn/shared';

// Mock dependencies
jest.mock('../jwt', () => ({
  jwtService: {
    extractTokenFromHeader: jest.fn(),
    validateToken: jest.fn(),
  },
}));

jest.mock('../../utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock console.warn to avoid test output noise
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe('security-middleware', () => {
  let mockRequest: NextRequest;
  let mockSupabaseClient: any;
  let mockJwtService: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock JWT service
    mockJwtService = {
      extractTokenFromHeader: jwtService.extractTokenFromHeader as jest.MockedFunction<typeof jwtService.extractTokenFromHeader>,
      validateToken: jwtService.validateToken as jest.MockedFunction<typeof jwtService.validateToken>,
    };

    // Mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    };
    (createClient as jest.MockedFunction<typeof createClient>).mockResolvedValue(mockSupabaseClient);

    // Set default environment variables
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

      // Create mock NextRequest with simple working headers
    const headerValues: Record<string, string> = {
      'user-agent': 'Mozilla/5.0',
      'x-client-info': '',
      'origin': '',
      'referer': '',
      'host': '',
      'authorization': '',
    };

    mockRequest = {
      url: 'http://localhost:3000/api/test',
      method: 'GET',
      nextUrl: new URL('http://localhost:3000/api/test'),
      headers: {
        get: jest.fn((key: string) => {
          return headerValues[key.toLowerCase()] || null;
        }),
      },
    } as any;
  });

  describe('validateRequestSecurity', () => {
    it('should allow requests with matching origin', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'origin': return 'http://localhost:3000';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: true,
        clientType: 'web',
      });
    });

    it('should allow requests from localhost host', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'host': return 'localhost:3000';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: true,
        clientType: 'web',
      });
    });

    it('should allow requests from legitimate mobile clients', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'PGN-Mobile-App';
          case 'x-client-info': return 'pgn-mobile-client';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: true,
        clientType: 'mobile',
      });
    });

    it('should allow requests from Expo clients', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'Expo';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: true,
        clientType: 'mobile',
      });
    });

    it('should block mobile clients without proper identification', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'PGN-Mobile-App';
          case 'x-client-info': return 'invalid-client';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: false,
        reason: 'Invalid or missing mobile client identification',
      });
    });

    it('should block requests from suspicious user agents', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'curl/7.68.0';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked suspicious user agent');
    });

    it('should block external requests', () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'origin': return 'https://evil.com';
          default: return null;
        }
      });

      const result = validateRequestSecurity(mockRequest);

      expect(result).toEqual({
        allowed: false,
        reason: 'External requests not allowed - only mobile app or web app access permitted',
      });
    });
  });

  describe('validateMobileToken', () => {
    const mockPayload = {
      sub: 'PGN-2024-0001',
      employeeId: 'emp-123',
      employmentStatus: 'ACTIVE' as EmploymentStatus,
      canLogin: true,
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 900,
    };

    it('should validate valid mobile token', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return 'Bearer valid-token';
          default: return null;
        }
      });

      mockJwtService.extractTokenFromHeader.mockReturnValue('valid-token');
      mockJwtService.validateToken.mockReturnValue(mockPayload);

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: true,
        payload: mockPayload,
      });
    });

    it('should reject requests without Authorization header', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return null;
          default: return null;
        }
      });

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Missing Authorization header',
      });
    });

    it('should reject requests with invalid token format', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return 'Invalid-Format';
          default: return null;
        }
      });

      mockJwtService.extractTokenFromHeader.mockReturnValue(null);

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid token format',
      });
    });

    it('should reject requests with expired token', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return 'Bearer expired-token';
          default: return null;
        }
      });

      mockJwtService.extractTokenFromHeader.mockReturnValue('expired-token');
      mockJwtService.validateToken.mockReturnValue(null);

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Invalid or expired token',
      });
    });

    it('should reject requests from users who cannot login', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return 'Bearer suspended-token';
          default: return null;
        }
      });

      const suspendedPayload = { ...mockPayload, canLogin: false, employmentStatus: 'SUSPENDED' as EmploymentStatus };

      mockJwtService.extractTokenFromHeader.mockReturnValue('suspended-token');
      mockJwtService.validateToken.mockReturnValue(suspendedPayload);

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Account suspended - contact administrator',
      });
    });
  });

  describe('validateAdminSession', () => {
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@pgn.com',
      user_metadata: { role: 'admin' },
    };

    it('should validate admin session successfully', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      const result = await validateAdminSession(mockRequest);

      expect(result).toEqual({
        valid: true,
        user: mockAdminUser,
      });
    });

    it('should reject when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No session' },
      });

      const result = await validateAdminSession(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'No authenticated admin session found',
      });
    });

    it('should reject non-admin users', async () => {
      const nonAdminUser = {
        id: 'user-123',
        email: 'user@pgn.com',
        user_metadata: { role: 'employee' },
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: nonAdminUser },
        error: null,
      });

      const result = await validateAdminSession(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Access denied - admin role required',
      });
    });
  });

  describe('createSecurityMiddleware', () => {
    it('should return health check response for health endpoint', async () => {
      mockRequest.nextUrl.pathname = '/api/health';

      const middleware = createSecurityMiddleware();
      const response = await middleware(mockRequest);

      expect(response?.status).toBe(200);
      const data = await response?.json();
      expect(data).toHaveProperty('status', 'ok');
    });

    it('should block suspicious requests', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'curl/7.68.0';
          default: return null;
        }
      });

      const middleware = createSecurityMiddleware();
      const response = await middleware(mockRequest);

      expect(response?.status).toBe(403);
      const data = await response?.json();
      expect(data).toHaveProperty('code', 'EXTERNAL_ACCESS_DENIED');
    });

    it('should return CORS headers for OPTIONS requests', async () => {
      mockRequest.method = 'OPTIONS';
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'x-client-info': return 'pgn-mobile-client';
          default: return null;
        }
      });

      const middleware = createSecurityMiddleware();
      const response = await middleware(mockRequest);

      expect(response?.status).toBe(200);
      expect(response?.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response?.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('withSecurity', () => {
    it('should handle OPTIONS requests correctly', async () => {
      mockRequest.method = 'OPTIONS';
      const mockHandler = jest.fn();

      const wrappedHandler = withSecurity(mockHandler);

      const response = await wrappedHandler(mockRequest);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(mockHandler).not.toHaveBeenCalled(); // Handler should not be called for OPTIONS
    });

    it('should work without authentication when requireAuth is false', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        new NextResponse(JSON.stringify({ success: true }), { status: 200 })
      );

      const wrappedHandler = withSecurity(mockHandler, { requireAuth: false });

      // Mock legitimate web client
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'origin': return 'http://localhost:3000';
          default: return null;
        }
      });

      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(response.status).toBe(200);
    });

    it('should block requests that fail security validation', async () => {
      const mockHandler = jest.fn();

      const wrappedHandler = withSecurity(mockHandler, { requireAuth: true });

      // Mock suspicious user agent
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'user-agent': return 'curl/7.68.0';
          default: return null;
        }
      });

      const response = await wrappedHandler(mockRequest);

      expect(mockHandler).not.toHaveBeenCalled(); // Handler should not be called
      expect(response.status).toBe(403);
    });
  });

  describe('addSecurityHeaders', () => {
    it('should add security headers to response', () => {
      const mockResponse = new NextResponse('Test content');

      const response = addSecurityHeaders(mockResponse);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(response.headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()');
      expect(response.headers.get('Server')).toBe('');
      expect(response.headers.get('X-Powered-By')).toBe('');

      expect(response).toBe(mockResponse);
    });
  });

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have correct rate limit configurations', () => {
      expect(RATE_LIMIT_CONFIGS.default).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
      });

      expect(RATE_LIMIT_CONFIGS.auth).toEqual({
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      });

      expect(RATE_LIMIT_CONFIGS.attendance).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 10,
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle missing headers gracefully', () => {
      // Create request with minimal headers
      const minimalRequest = {
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        nextUrl: new URL('http://localhost:3000/api/test'),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      expect(() => {
        validateRequestSecurity(minimalRequest);
      }).not.toThrow();

      const result = validateRequestSecurity(minimalRequest);
      expect(result.allowed).toBe(false);
    });

    it('should handle token validation errors gracefully', async () => {
      (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
        switch (key.toLowerCase()) {
          case 'authorization': return 'Bearer valid-token';
          default: return null;
        }
      });

      mockJwtService.extractTokenFromHeader.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await validateMobileToken(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Token validation failed',
      });
    });

    it('should handle admin session validation errors gracefully', async () => {
      mockSupabaseClient.auth.getUser.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const result = await validateAdminSession(mockRequest);

      expect(result).toEqual({
        valid: false,
        error: 'Admin session validation failed',
      });
    });
  });
});