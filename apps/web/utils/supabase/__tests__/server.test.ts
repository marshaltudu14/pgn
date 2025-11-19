
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock cookies() to return the store
    (cookies as jest.Mock).mockResolvedValue(mockCookieStore);

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  });

  it('should create a server client with correct configuration', async () => {
    await createClient();

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
  });

  it('should handle cookie operations correctly', async () => {
    await createClient();
    
    // Get the cookies config passed to createServerClient
    const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;

    // Test getAll
    mockCookieStore.getAll.mockReturnValue([{ name: 'test', value: 'value' }]);
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
    expect(mockCookieStore.set).toHaveBeenCalledWith('test1', 'value1', { path: '/' });
    expect(mockCookieStore.set).toHaveBeenCalledWith('test2', 'value2', { path: '/api' });
  });

  it('should handle setAll errors gracefully', async () => {
    await createClient();
    const cookiesConfig = (createServerClient as jest.Mock).mock.calls[0][2].cookies;

    // Mock set to throw error
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Server Component Error');
    });

    // Should not throw
    expect(() => {
      cookiesConfig.setAll([{ name: 'test', value: 'value', options: {} }]);
    }).not.toThrow();
  });
});
