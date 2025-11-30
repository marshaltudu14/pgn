import { NextRequest, NextResponse } from 'next/server';
import { authService } from './services/auth.service';

// Paths that require authentication
const protectedPaths = ['/dashboard'];
// Paths that should redirect authenticated users away
const publicOnlyPaths = ['/'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass authentication for e2e testing
  const isTestMode = process.env.NODE_ENV === 'test' ||
                    process.env.E2E_TESTING === 'true' ||
                    request.headers.get('x-e2e-testing') === 'true';

  if (isTestMode) {
    // In test mode, skip authentication checks
    const response = NextResponse.next();
    response.headers.set('x-test-mode', 'true');
    return response;
  }

  // Check authentication using auth service
  let isAuthenticated = false;
  try {
    const currentUser = await authService.getCurrentUser();
    isAuthenticated = !!currentUser;
  } catch (error) {
    console.error('Error checking authentication in middleware:', error);
    isAuthenticated = false;
  }

  // Redirect unauthenticated users from protected paths to root (login)
  if (protectedPaths.some(path => pathname.startsWith(path)) && !isAuthenticated) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from public-only paths to dashboard
  if (publicOnlyPaths.some(path => pathname === path) && isAuthenticated) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Continue to the requested route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};