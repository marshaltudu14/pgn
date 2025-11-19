/**
 * Unit Tests for Rate Limiting
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';

describe('Rate Limiting', () => {
  let mockRequest: any;

  beforeEach(() => {
    // Clear all mocks and timers
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();

    // Reset modules to get fresh state
    jest.resetModules();

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
      cookies: {} as any,
      json: jest.fn(),
      text: jest.fn(),
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      formData: jest.fn(),
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
      cache: 'default' as any,
      credentials: 'same-origin' as any,
      destination: 'document' as any,
      integrity: '',
      keepalive: false,
      method: 'GET',
      mode: 'cors' as any,
      redirect: 'follow' as any,
      referrer: '',
      referrerPolicy: '',
      signal: {} as any
    } as any;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('createRateLimit', () => {
    it('should create a rate limiting function', async () => {
      // Dynamic import to get fresh module state
      const rateLimitModule = await import('../rate-limit');
      const createRateLimit = rateLimitModule.createRateLimit;

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 10
      });

      expect(typeof rateLimit).toBe('function');
    });

    it('should return null for requests within limit', async () => {
      // Dynamic import to get fresh module state
      const rateLimitModule = await import('../rate-limit');
      const createRateLimit = rateLimitModule.createRateLimit;

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      });

      // Mock headers to return IP
      mockRequest.headers.get.mockReturnValue('192.168.1.1');

      // First request should be allowed
      const result = rateLimit(mockRequest);
      expect(result).toBeNull();
    });

    it('should return rate limit response when limit exceeded', async () => {
      // Dynamic import to get fresh module state
      const rateLimitModule = await import('../rate-limit');
      const createRateLimit = rateLimitModule.createRateLimit;

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: 'Custom rate limit message'
      });

      // Mock headers to return IP
      mockRequest.headers.get.mockReturnValue('192.168.1.1');

      // First request should be allowed
      const result1 = rateLimit(mockRequest);
      expect(result1).toBeNull();

      // Second request should be blocked (because maxRequests = 1)
      const blockedResult = rateLimit(mockRequest);
      expect(blockedResult).not.toBeNull();
      expect(blockedResult?.status).toBe(429);
    });

    it('should use different keys for different IP addresses', async () => {
      // Dynamic import to get fresh module state
      const rateLimitModule = await import('../rate-limit');
      const createRateLimit = rateLimitModule.createRateLimit;

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1
      });

      // First IP - make a request
      mockRequest.headers.get.mockReturnValue('192.168.1.1');
      const result1 = rateLimit(mockRequest);
      expect(result1).toBeNull();

      // Different IP - should be allowed (different key)
      mockRequest.headers.get.mockReturnValue('192.168.1.2');
      const result2 = rateLimit(mockRequest);
      expect(result2).toBeNull();
    });
  });

  describe('authRateLimit and apiRateLimit', () => {
    it('should provide auth rate limiting', async () => {
      const rateLimitModule = await import('../rate-limit');
      const authRateLimit = rateLimitModule.authRateLimit;

      expect(typeof authRateLimit).toBe('function');
    });

    it('should provide API rate limiting', async () => {
      const rateLimitModule = await import('../rate-limit');
      const apiRateLimit = rateLimitModule.apiRateLimit;

      expect(typeof apiRateLimit).toBe('function');
    });
  });

  describe('withRateLimit', () => {
    it('should wrap handler function with rate limiting', async () => {
      const rateLimitModule = await import('../rate-limit');
      const { createRateLimit, withRateLimit } = rateLimitModule;

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);

      mockRequest.headers.get.mockReturnValue('192.168.1.1');

      // First request should succeed
      const result = await wrappedHandler(mockRequest);
      expect(result.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to handler function', async () => {
      const rateLimitModule = await import('../rate-limit');
      const { createRateLimit, withRateLimit } = rateLimitModule;

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);

      mockRequest.headers.get.mockReturnValue('192.168.1.2'); // Use different IP

      const additionalArgs = ['arg1', 'arg2', { test: 'data' }];

      await wrappedHandler(mockRequest, ...additionalArgs);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, ...additionalArgs);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('should not throw errors when called', async () => {
      const rateLimitModule = await import('../rate-limit');
      const cleanupRateLimitStore = rateLimitModule.cleanupRateLimitStore;

      // The cleanup function should handle any state gracefully
      expect(() => {
        cleanupRateLimitStore();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should work with real-world scenario', async () => {
      const rateLimitModule = await import('../rate-limit');
      const { createRateLimit, withRateLimit } = rateLimitModule;

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Success' })
      );

      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);
      mockRequest.headers.get.mockReturnValue('192.168.1.1');

      // First request should succeed
      const result1 = await wrappedHandler(mockRequest);
      expect(result1.status).toBe(200);

      // Second request should also succeed
      const result2 = await wrappedHandler(mockRequest);
      expect(result2.status).toBe(200);
    });
  });
});