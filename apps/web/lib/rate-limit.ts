import { NextRequest, NextResponse } from 'next/server';
import { RateLimitOptions } from '@pgn/shared';

// Simple in-memory rate limiting store
// In production, you'd want to use Redis or a similar solution
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ExtendedRateLimitOptions extends RateLimitOptions {
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Rate limiting middleware for Next.js API routes
 */
export function createRateLimit(options: ExtendedRateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Use IP address as default key
      const forwarded = req.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
      return ip;
    }
  } = options;

  return (req: NextRequest): NextResponse | null => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get existing rate limit data
    const existing = rateLimitStore.get(key);

    if (!existing || now > existing.resetTime) {
      // New window or expired window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null; // Allow request
    }

    // Increment counter
    existing.count++;

    if (existing.count > maxRequests) {
      // Rate limit exceeded
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

    // Rate limit check passed, allow request to proceed
    // In API routes, return null to allow the handler to continue
    return null;
  };
}

/**
 * Rate limiting specifically for authentication endpoints
 */
export const authRateLimit = createRateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '900') * 1000), // Convert seconds to ms
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5'),
  message: 'Too many login attempts, please try again later.',
});

/**
 * Rate limiting for general API endpoints
 */
export const apiRateLimit = createRateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'Too many API requests, please try again later.',
});

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit<T extends unknown[]>(
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

/**
 * Cleanup function to remove expired entries from rate limit store
 * This should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 300000);
}