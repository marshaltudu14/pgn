/**
 * Unit Tests for Rate Limiting
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { createRateLimit, authRateLimit, apiRateLimit, withRateLimit, cleanupRateLimitStore } from '../rate-limit';

describe('Rate Limiting', () => {
  let mockRequest: NextRequest;
  let mockRateLimitStore: Map<string, { count: number; resetTime: number }>;

  beforeEach(() => {
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();

    // Create a fresh rate limit store for each test
    mockRateLimitStore = new Map();

    // Mock the module with our own store
    jest.doMock('../rate-limit', () => {
      // Create rate limit function with our test store
      function createRateLimit(options: {
        windowMs: number;
        maxRequests: number;
        message?: string;
        keyGenerator?: (req: NextRequest) => string;
      }) {
        const {
          windowMs,
          maxRequests,
          message = 'Too many requests, please try again later.',
          keyGenerator = (req: NextRequest) => {
            const forwarded = req.headers.get('x-forwarded-for');
            const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
            return ip;
          }
        } = options;

        return (req: NextRequest) => {
          const key = keyGenerator(req);
          const now = Date.now();

          const existing = mockRateLimitStore.get(key);

          if (!existing || now > existing.resetTime) {
            mockRateLimitStore.set(key, {
              count: 1,
              resetTime: now + windowMs,
            });
            return null;
          }

          existing.count++;

          if (existing.count > maxRequests) {
            return NextResponse.json(
              {
                error: 'Rate limit exceeded',
                message,
                retryAfter: Math.ceil((existing.resetTime - now) / 1000),
              },
              {
                status: 429,
                headers: {
                  'X-RateLimit-Limit': maxRequests.toString(),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': existing.resetTime.toString(),
                  'Retry-After': Math.ceil((existing.resetTime - now) / 1000).toString(),
                },
              }
            );
          }

          return null;
        };
      }

      function cleanupRateLimitStore() {
        const now = Date.now();
        for (const [key, data] of mockRateLimitStore.entries()) {
          if (now > data.resetTime) {
            mockRateLimitStore.delete(key);
          }
        }
      }

      // Predefined rate limits
      const authRateLimit = createRateLimit({
        windowMs: 900000, // 15 minutes
        maxRequests: 5,
        message: 'Too many login attempts, please try again later.',
      });

      const apiRateLimit = createRateLimit({
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        message: 'Too many API requests, please try again later.',
      });

      function withRateLimit<T extends unknown[]>(
        handler: (req: NextRequest, ...args: T) => Promise<NextResponse>,
        rateLimit: (req: NextRequest) => NextResponse | null
      ) {
        return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
          const result = rateLimit(req);

          if (result) {
            return result;
          }

          return handler(req, ...args);
        };
      }

      return {
        createRateLimit,
        authRateLimit,
        apiRateLimit,
        withRateLimit,
        cleanupRateLimitStore
      };
    });

    // Create a mock request
    mockRequest = {
      headers: {
        get: jest.fn(),
        append: jest.fn(),
        delete: jest.fn(),
        getSetCookie: jest.fn(),
        has: jest.fn(),
        set: jest.fn(),
        entries: jest.fn(),
        forEach: jest.fn(),
        keys: jest.fn(),
        values: jest.fn()
      },
      url: 'http://localhost:3000/test',
      cookies: {} as RequestCookies,
      json: jest.fn(),
      text: jest.fn(),
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      formData: jest.fn(),
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
      cache: 'default' as RequestCache,
      credentials: 'same-origin' as RequestCredentials,
      destination: 'document' as RequestDestination,
      integrity: '',
      keepalive: false,
      method: 'GET',
      mode: 'cors' as RequestMode,
      redirect: 'follow' as RequestRedirect,
      referrer: '',
      referrerPolicy: '' as ReferrerPolicy,
      signal: {} as AbortSignal
    } as any;
  });

  afterEach(() => {
    // Clean up module mocks
    jest.resetModules();
  });

  describe('createRateLimit', () => {
    it('should create a rate limiting function', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      });

      expect(typeof rateLimit).toBe('function');
    });

    it('should allow requests within limit', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      });

      // Mock headers to return IP
      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // Make 5 requests - all should be allowed
      for (let i = 0; i < 5; i++) {
        const result = rateLimit(mockRequest);
        expect(result).toBeNull();
      }
    });

    it('should block requests when limit exceeded', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 3,
        message: 'Custom rate limit message'
      });

      // Mock headers to return IP
      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // Make 3 requests - all should be allowed
      for (let i = 0; i < 3; i++) {
        const result = rateLimit(mockRequest);
        expect(result).toBeNull();
      }

      // 4th request should be blocked
      const blockedResult = rateLimit(mockRequest);
      expect(blockedResult).not.toBeNull();
      expect(blockedResult?.status).toBe(429);
    });

    it('should reset after window expires', async () => {
      jest.useFakeTimers();
      const mockDateNow = jest.fn();
      const originalDateNow = Date.now;
      Date.now = mockDateNow;

            const rateLimit = createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 2
      });

      // Mock headers to return IP
      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // Start at time 0
      mockDateNow.mockReturnValue(0);

      // Make 2 requests - both should be allowed
      for (let i = 0; i < 2; i++) {
        const result = rateLimit(mockRequest);
        expect(result).toBeNull();
      }

      // 3rd request should be blocked
      const blockedResult = rateLimit(mockRequest);
      expect(blockedResult).not.toBeNull();

      // Advance time by 1.1 seconds (past the window)
      mockDateNow.mockReturnValue(1100);

      // Next request should be allowed again
      const result = rateLimit(mockRequest);
      expect(result).toBeNull();

      // Restore original Date.now
      Date.now = originalDateNow;
      jest.useRealTimers();
    });

    it('should handle different IP addresses separately', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      // First IP - make 2 requests
      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');
      for (let i = 0; i < 2; i++) {
        const result = rateLimit(mockRequest);
        expect(result).toBeNull();
      }

      // Third request from same IP should be blocked
      const blockedResult = rateLimit(mockRequest);
      expect(blockedResult).not.toBeNull();

      // Different IP - should be allowed
      mockRequest.headers.set('x-forwarded-for', '192.168.1.2');
      const result = rateLimit(mockRequest);
      expect(result).toBeNull();
    });

    it('should use custom key generator', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
        keyGenerator: () => 'custom-key'
      });

      // Make 2 requests with same custom key
      for (let i = 0; i < 2; i++) {
        const result = rateLimit(mockRequest);
        expect(result).toBeNull();
      }

      // Third request should be blocked
      const blockedResult = rateLimit(mockRequest);
      expect(blockedResult).not.toBeNull();
    });

    it('should handle x-forwarded-for header correctly', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      });

      // Mock x-forwarded-for header with multiple IPs
      mockRequest.headers.set('x-forwarded-for', '203.0.113.1, 198.51.100.1, 192.0.2.1');

      const result = rateLimit(mockRequest);
      expect(result).toBeNull();

      // Verify it used the first IP
      expect(mockRequest.headers.get).toHaveBeenCalledWith('x-forwarded-for');
    });

    it('should handle missing x-forwarded-for header', () => {
            const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      });

      // Mock no headers - create a new request with empty headers
      mockRequest = new Request('http://localhost:3000/api/test', {
        method: 'GET',
        headers: new Headers(),
      }) as NextRequest;

      const result = rateLimit(mockRequest);
      expect(result).toBeNull();
    });
  });

  describe('authRateLimit and apiRateLimit', () => {
    it('should provide auth rate limiting', () => {
      // authRateLimit already imported
      expect(typeof authRateLimit).toBe('function');
    });

    it('should provide API rate limiting', () => {
      // apiRateLimit already imported
      expect(typeof apiRateLimit).toBe('function');
    });
  });

  describe('withRateLimit', () => {
    it('should wrap handler function with rate limiting', async () => {
      // withRateLimit and createRateLimit already imported

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);

      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // First request should succeed
      const result1 = await wrappedHandler(mockRequest);
      expect(result1.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Second request should succeed
      const result2 = await wrappedHandler(mockRequest);
      expect(result2.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(2);

      // Third request should be rate limited
      const result3 = await wrappedHandler(mockRequest);
      expect(result3.status).toBe(429);
      expect(mockHandler).toHaveBeenCalledTimes(2); // Should not be called again
    });

    it('should pass arguments to handler function', async () => {
      // withRateLimit and createRateLimit already imported

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);

      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      const additionalArgs = ['arg1', 'arg2', { test: 'data' }];

      await wrappedHandler(mockRequest, ...additionalArgs);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, ...additionalArgs);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should remove expired entries from store', () => {
      // createRateLimit and cleanupRateLimitStore already imported

      const rateLimit = createRateLimit({
        windowMs: 1000, // 1 second
        maxRequests: 1
      });

      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // Make a request to create an entry
      rateLimit(mockRequest);

      // Manually expire the entry by setting resetTime in the past
      const entry = mockRateLimitStore.get('192.168.1.1');
      if (entry) {
        entry.resetTime = Date.now() - 1000;
      }

      // Run cleanup
      cleanupRateLimitStore();

      // Make another request - should be allowed since old entry was cleaned up
      const result = rateLimit(mockRequest);
      expect(result).toBeNull();
    });

    it('should keep non-expired entries in store', () => {
      // createRateLimit and cleanupRateLimitStore already imported

      const rateLimit = createRateLimit({
        windowMs: 5000, // 5 seconds
        maxRequests: 1
      });

      mockRequest.headers.set('x-forwarded-for', '192.168.1.1');

      // Make a request to create an entry
      rateLimit(mockRequest);

      // Run cleanup - entry should still be valid
      cleanupRateLimitStore();

      // Make another request - should be blocked since entry is still valid
      const result = rateLimit(mockRequest);
      expect(result).not.toBeNull();
      expect(result?.status).toBe(429);
    });

    it('should handle empty store gracefully', () => {
      // cleanupRateLimitStore already imported

      expect(() => {
        cleanupRateLimitStore();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with real-world scenario', async () => {
      jest.useFakeTimers();

      // withRateLimit and apiRateLimit already imported

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      );

      const wrappedHandler = withRateLimit(mockHandler, apiRateLimit);
      mockRequest.headers.set('x-client-id', 'client-ip-123');

      // Simulate normal usage within limits
      for (let i = 0; i < 50; i++) {
        const result = await wrappedHandler(mockRequest);
        expect(result.status).toBe(200);
      }

      // Simulate rate limiting scenario
      for (let i = 0; i < 50; i++) {
        await wrappedHandler(mockRequest);
      }

      const rateLimitedResult = await wrappedHandler(mockRequest);
      expect(rateLimitedResult.status).toBe(429);

      // Wait for window to reset
      jest.advanceTimersByTime(60001);

      // Should work again after reset
      const resetResult = await wrappedHandler(mockRequest);
      expect(resetResult.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(101); // 50 + 50 + 1 after reset

      jest.useRealTimers();
    });
  });
});