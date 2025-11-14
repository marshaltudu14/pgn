// Generic authentication and rate limiting types shared between web and app

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

export interface AuthMiddlewareOptions {
  requiredRole?: string;
  redirectTo?: string;
  excludePaths?: string[];
  requireAuth?: boolean;
  checkEmploymentStatus?: boolean;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}