import { NextRequest, NextResponse } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard'];
// Paths that should redirect authenticated users away
const publicOnlyPaths = ['/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies or headers
  const token = request.cookies.get('auth-storage')?.value;

  // Parse auth state from cookie
  let isAuthenticated = false;
  if (token) {
    try {
      const authState = JSON.parse(token);
      isAuthenticated = authState.state?.isAuthenticated && authState.state?.token;
    } catch (error) {
      console.error('Error parsing auth cookie:', error);
    }
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