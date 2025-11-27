/**
 * Unit tests for Supabase Server utility using Jest
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '../server';

// Mock dependencies
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Supabase Server Client', () => {
  const mockCookieStore = {
    getAll: jest.fn(),
    set: jest.fn(),
  };

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock cookies() to return the store
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key';

    // Mock createServerClient to return our mock client
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  describe('createClient', () => {
    it('should create a server client with correct configuration', async () => {
      const result = await createClient();

      expect(cookies).toHaveBeenCalled();
      expect(createServerClient).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'public-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
      expect(result).toBe(mockSupabaseClient);
    });

    it('should handle cookie operations correctly', async () => {
      await createClient();

      // Get the cookies config passed to createServerClient
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
        .cookies;

      // Test getAll
      mockCookieStore.getAll.mockReturnValue([
        { name: 'test', value: 'value' },
      ]);
      const allCookies = cookiesConfig.getAll();
      expect(mockCookieStore.getAll).toHaveBeenCalled();
      expect(allCookies).toEqual([{ name: 'test', value: 'value' }]);

      // Test setAll
      const cookiesToSet = [
        { name: 'test1', value: 'value1', options: { path: '/' } },
        { name: 'test2', value: 'value2', options: { path: '/api' } },
      ];
      cookiesConfig.setAll(cookiesToSet);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenCalledWith('test1', 'value1', {
        path: '/',
      });
      expect(mockCookieStore.set).toHaveBeenCalledWith('test2', 'value2', {
        path: '/api',
      });
    });

    it('should handle setAll errors gracefully', async () => {
      await createClient();
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
        .cookies;

      // Mock set to throw error
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Server Component Error');
      });

      // Should not throw
      expect(() => {
        cookiesConfig.setAll([{ name: 'test', value: 'value', options: {} }]);
      }).not.toThrow();
    });

    it('should handle missing NEXT_PUBLIC_SUPABASE_URL', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key';

      await createClient();

      // Verify createServerClient was called with undefined URL
      expect(createServerClient).toHaveBeenCalledWith(
        undefined,
        'public-key',
        expect.any(Object)
      );
    });

    it('should handle missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      await createClient();

      // Verify createServerClient was called with undefined key
      expect(createServerClient).toHaveBeenCalledWith(
        'https://example.supabase.co',
        undefined,
        expect.any(Object)
      );
    });

    it('should handle missing both environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      await createClient();

      // Verify createServerClient was called with undefined values
      expect(createServerClient).toHaveBeenCalledWith(
        undefined,
        undefined,
        expect.any(Object)
      );
    });

    it('should handle cookies() function throwing an error', async () => {
      (cookies as jest.Mock).mockRejectedValue(
        new Error('Cookies not available')
      );

      await expect(createClient()).rejects.toThrow('Cookies not available');
    });

    it('should handle empty cookies array', async () => {
      await createClient();
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
        .cookies;

      // Test getAll with empty array
      mockCookieStore.getAll.mockReturnValue([]);
      const allCookies = cookiesConfig.getAll();
      expect(mockCookieStore.getAll).toHaveBeenCalled();
      expect(allCookies).toEqual([]);
    });

    it('should handle cookies with various options', async () => {
      await createClient();
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
        .cookies;

      const cookiesToSet = [
        {
          name: 'complex-cookie',
          value: 'complex-value',
          options: {
            path: '/',
            domain: '.example.com',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600,
          },
        },
      ];

      cookiesConfig.setAll(cookiesToSet);
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'complex-cookie',
        'complex-value',
        {
          path: '/',
          domain: '.example.com',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 3600,
        }
      );
    });

    it('should handle multiple calls to createClient independently', async () => {
      // First call
      const result1 = await createClient();

      // Second call
      const result2 = await createClient();

      expect(cookies).toHaveBeenCalledTimes(2);
      expect(createServerClient).toHaveBeenCalledTimes(2);
      expect(result1).toBe(mockSupabaseClient);
      expect(result2).toBe(mockSupabaseClient);
    });

    it('should work with different environment variable values', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://custom.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'custom-public-key';

      await createClient();

      expect(createServerClient).toHaveBeenCalledWith(
        'https://custom.supabase.co',
        'custom-public-key',
        expect.any(Object)
      );
    });

    it('should preserve cookie store reference between getAll and setAll calls', async () => {
      await createClient();
      const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2]
        .cookies;

      // Call getAll
      mockCookieStore.getAll.mockReturnValue([
        { name: 'session', value: 'abc123' },
      ]);
      cookiesConfig.getAll();

      // Call setAll
      cookiesConfig.setAll([{ name: 'updated', value: 'def456', options: {} }]);

      // Both should use the same cookie store instance
      expect(mockCookieStore.getAll).toHaveBeenCalled();
      expect(mockCookieStore.set).toHaveBeenCalled();
    });
  });
});
