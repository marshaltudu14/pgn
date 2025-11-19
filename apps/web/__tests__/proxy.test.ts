
import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { proxy } from '../proxy';
import { authService } from '../services/auth.service';

// Mock dependencies
jest.mock('../services/auth.service', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      next: jest.fn(),
      redirect: jest.fn(),
    },
  };
});

describe('Proxy Middleware', () => {
  let mockRequest: Partial<NextRequest> & { nextUrl: { pathname: string }; url: string };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      nextUrl: {
        pathname: '/',
      } as any,
      url: 'http://localhost:3000/',
    };
  });

  it('should allow public paths for unauthenticated users', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    mockRequest.nextUrl.pathname = '/about';

    await proxy(mockRequest as NextRequest);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect unauthenticated users from protected paths', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
    mockRequest.nextUrl.pathname = '/dashboard';

    await proxy(mockRequest as NextRequest);

    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/',
      search: expect.stringContaining('redirect=%2Fdashboard'),
    }));
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it('should allow authenticated users to access protected paths', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    mockRequest.nextUrl.pathname = '/dashboard';

    await proxy(mockRequest as NextRequest);

    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('should redirect authenticated users from public-only paths', async () => {
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    mockRequest.nextUrl.pathname = '/';

    await proxy(mockRequest as NextRequest);

    expect(NextResponse.redirect).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/dashboard',
    }));
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it('should handle auth service errors gracefully (treat as unauthenticated)', async () => {
    (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Auth error'));
    mockRequest.nextUrl.pathname = '/dashboard';

    await proxy(mockRequest as NextRequest);

    expect(NextResponse.redirect).toHaveBeenCalled(); // Should redirect to login
  });
});
