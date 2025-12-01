/**
 * Unit tests for Proxy utility using Jest
 */

import { NextRequest, NextResponse } from 'next/server';
import { config, proxy } from '../proxy';

// Mock the auth service
jest.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

import { authService } from '../services/auth.service';

describe('Proxy Utility', () => {
  let mockRequest: NextRequest;
  let originalNodeEnv: string | undefined;
  let originalE2ETesting: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original environment variables
    originalNodeEnv = process.env.NODE_ENV;
    originalE2ETesting = process.env.E2E_TESTING;

    // Ensure we're not in test mode for these authentication tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processEnv = process.env as any;
    processEnv.NODE_ENV = undefined;
    processEnv.E2E_TESTING = undefined;

    // Create a mock request with default values
    mockRequest = {
      nextUrl: {
        pathname: '/dashboard',
        searchParams: new URLSearchParams(),
        href: 'http://localhost:3000/dashboard',
        origin: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        path: '/dashboard',
        search: '',
        hash: '',
        toJSON: jest.fn(),
      },
      headers: {
        get: jest.fn(),
      },
    } as unknown as NextRequest;

    // Use Object.defineProperty to set the read-only url property
    Object.defineProperty(mockRequest, 'url', {
      value: 'http://localhost:3000/dashboard',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original environment variables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processEnv = process.env as any;
    processEnv.NODE_ENV = originalNodeEnv;
    processEnv.E2E_TESTING = originalE2ETesting;
  });

  describe('proxy function', () => {
    describe('Authentication checks', () => {
      it('should redirect unauthenticated users from protected paths to login', async () => {
        // Mock unauthenticated user
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

        const result = await proxy(mockRequest);

        expect(result).toBeInstanceOf(NextResponse);
        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard/);
      });

      it('should allow authenticated users to access protected paths', async () => {
        // Mock authenticated user
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
        });

        const result = await proxy(mockRequest);

        expect(result).toBeInstanceOf(NextResponse);
        // Should not be a redirect - NextResponse.next() doesn't have location header
        expect(result.headers.get('location')).toBeUndefined();
      });

      it('should handle authentication service errors gracefully', async () => {
        // Mock authentication service error
        (authService.getCurrentUser as jest.Mock).mockRejectedValue(
          new Error('Auth service error')
        );

        const result = await proxy(mockRequest);

        expect(result).toBeInstanceOf(NextResponse);
        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard/);
      });

      it('should redirect authenticated users from public-only paths to dashboard', async () => {
        // Mock authenticated user
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
        });

        // Set pathname to a public-only path
        mockRequest.nextUrl.pathname = '/';

        const result = await proxy(mockRequest);

        expect(result).toBeInstanceOf(NextResponse);
        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000\/dashboard/);
      });

      it('should allow unauthenticated users to access public-only paths', async () => {
        // Mock unauthenticated user
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);

        // Set pathname to a public-only path
        mockRequest.nextUrl.pathname = '/';

        const result = await proxy(mockRequest);

        expect(result).toBeInstanceOf(NextResponse);
        // Should not be a redirect - NextResponse.next() doesn't have location header
        expect(result.headers.get('location')).toBeUndefined();
      });
    });

    describe('Path matching', () => {
      it('should handle exact matches for protected paths', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/dashboard';

        const result = await proxy(mockRequest);

        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard/);
      });

      it('should handle path prefixes for protected paths', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/dashboard/settings';

        const result = await proxy(mockRequest);

        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard%2Fsettings/);
      });

      it('should handle nested protected paths', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/dashboard/users/123';

        const result = await proxy(mockRequest);

        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard%2Fusers%2F123/);
      });

      it('should allow access to non-protected paths for unauthenticated users', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/about';

        const result = await proxy(mockRequest);

        expect(result.headers.get('location')).toBeUndefined();
      });

      it('should allow access to non-protected paths for authenticated users', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
        });
        mockRequest.nextUrl.pathname = '/about';

        const result = await proxy(mockRequest);

        expect(result.headers.get('location')).toBeUndefined();
      });
    });

    describe('URL construction', () => {
      it('should preserve the original URL when redirecting to login', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/dashboard/settings/profile';
        Object.defineProperty(mockRequest, 'url', {
          value: 'http://localhost:3000/dashboard/settings/profile',
          writable: true,
          configurable: true,
        });

        const result = await proxy(mockRequest);

        const redirectUrl = String(result.headers.get('location'));
        expect(redirectUrl).toMatch(/localhost:3000/);
        expect(redirectUrl).toMatch(/redirect=%2Fdashboard%2Fsettings%2Fprofile/);
      });

      it('should construct correct dashboard URL when redirecting authenticated users', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
        });
        mockRequest.nextUrl.pathname = '/';
        Object.defineProperty(mockRequest, 'url', {
          value: 'http://localhost:3000/',
          writable: true,
          configurable: true,
        });

        const result = await proxy(mockRequest);

        const redirectUrl = String(result.headers.get('location'));
        expect(redirectUrl).toMatch(/localhost:3000\/dashboard/);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty pathname', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '';

        const result = await proxy(mockRequest);

        expect(result.headers.get('location')).toBeUndefined();
      });

      it('should handle root path correctly for unauthenticated users', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/';

        const result = await proxy(mockRequest);

        expect(result.headers.get('location')).toBeUndefined();
      });

      it('should handle root path correctly for authenticated users', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue({
          id: 'user-123',
          email: 'user@example.com',
        });
        mockRequest.nextUrl.pathname = '/';

        const result = await proxy(mockRequest);

        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000\/dashboard/);
      });

      it('should handle complex query parameters in redirect URL', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
        mockRequest.nextUrl.pathname = '/dashboard';
        mockRequest.nextUrl.searchParams.set('tab', 'settings');
        Object.defineProperty(mockRequest, 'url', {
          value: 'http://localhost:3000/dashboard?tab=settings',
          writable: true,
          configurable: true,
        });

        const result = await proxy(mockRequest);

        const redirectUrl = String(result.headers.get('location'));
        expect(redirectUrl).toMatch(/localhost:3000/);
        expect(redirectUrl).toMatch(/redirect=%2Fdashboard/);
      });

      it('should handle authentication service returning undefined', async () => {
        (authService.getCurrentUser as jest.Mock).mockResolvedValue(undefined);

        const result = await proxy(mockRequest);

        const location = String(result.headers.get('location'));
        expect(location).toMatch(/localhost:3000/);
        expect(location).toMatch(/redirect=%2Fdashboard/);
      });
    });
  });

  describe('config object', () => {
    it('should have a matcher property', () => {
      expect(config).toHaveProperty('matcher');
    });

    it('should exclude API routes from matcher', () => {
      expect(config.matcher[0]).toContain('api');
    });

    it('should exclude static files from matcher', () => {
      expect(config.matcher[0]).toContain('_next/static');
    });

    it('should exclude image optimization files from matcher', () => {
      expect(config.matcher[0]).toContain('_next/image');
    });

    it('should exclude favicon from matcher', () => {
      expect(config.matcher[0]).toContain('favicon.ico');
    });

    it('should match all other paths', () => {
      // Test that the matcher pattern allows typical application routes
      const matcher = config.matcher[0];

      // The pattern should contain the structure for matching paths
      expect(matcher).toContain('(?!'); // negative lookahead
      expect(matcher).toContain('api'); // excludes api routes
      expect(matcher).toContain('_next/static'); // excludes static files
      expect(matcher).toContain('_next/image'); // excludes image optimization
      expect(matcher).toContain('favicon.ico'); // excludes favicon

      // The pattern should allow all other paths with .*
      expect(matcher).toContain('.*)');
    });

    it('should not match excluded paths', () => {
      // Test that the matcher pattern properly excludes specific paths
      const matcher = config.matcher[0];

      // Verify the pattern starts and ends correctly
      expect(matcher).toMatch(/^\/\(\(\?!/); // starts with /((?!
      expect(matcher).toMatch(/\.\*\)$/); // ends with .*)

      // Verify all exclusions are present
      expect(matcher).toContain('api|');
      expect(matcher).toContain('_next/static|');
      expect(matcher).toContain('_next/image|');
      expect(matcher).toContain('favicon.ico');
    });
  });
});
