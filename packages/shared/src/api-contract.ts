/**
 * API Contract for PGN System
 * Provides type-safe API definitions and validation
 */

import { z } from 'zod';

// Export Zod for use in other modules
export { z };

// Base API response schema
export const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  data: z.any().optional(),
});

// API Route Definition
export interface ApiRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  inputSchema?: z.ZodSchema;
  outputSchema?: z.ZodSchema;
  description: string;
  requiresAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// API Contract Class
export class ApiContract {
  private routes: Map<string, ApiRoute> = new Map();

  addRoute(route: ApiRoute): void {
    const key = `${route.method}:${route.path}`;
    if (this.routes.has(key)) {
      throw new Error(`Route ${key} already exists in API contract`);
    }
    this.routes.set(key, route);
  }

  getRoute(method: string, path: string): ApiRoute | undefined {
    return this.routes.get(`${method}:${path}`);
  }

  getAllRoutes(): ApiRoute[] {
    return Array.from(this.routes.values());
  }

  validateRoute(method: string, path: string, data?: unknown): { valid: boolean; errors?: string[] } {
    const route = this.getRoute(method, path);
    if (!route) {
      return { valid: false, errors: [`Route ${method} ${path} not found in API contract`] };
    }

    if (route.inputSchema && data) {
      const result = route.inputSchema.safeParse(data);
      if (!result.success) {
        return {
          valid: false,
          errors: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
        };
      }
    }

    return { valid: true };
  }

  // Validate all routes are properly implemented
  validateImplementation(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // This would be used to validate that all contracted routes have actual implementations
    // Implementation would check against the file system or route registry

    return { valid: errors.length === 0, errors };
  }
}

// Global API contract instance
export const apiContract = new ApiContract();

// Helper function to create route definitions
export function defineRoute(route: ApiRoute): ApiRoute {
  return route;
}

// Type-safe route creation helpers
export function createGetRoute(path: string, schema: z.ZodSchema, description: string, options?: Partial<ApiRoute>): ApiRoute {
  return defineRoute({
    path,
    method: 'GET',
    inputSchema: schema,
    outputSchema: BaseApiResponseSchema,
    description,
    requiresAuth: true,
    ...options
  });
}

export function createPostRoute(path: string, inputSchema: z.ZodSchema, outputSchema: z.ZodSchema, description: string, options?: Partial<ApiRoute>): ApiRoute {
  return defineRoute({
    path,
    method: 'POST',
    inputSchema,
    outputSchema,
    description,
    requiresAuth: true,
    ...options
  });
}

export function createPutRoute(path: string, inputSchema: z.ZodSchema, outputSchema: z.ZodSchema, description: string, options?: Partial<ApiRoute>): ApiRoute {
  return defineRoute({
    path,
    method: 'PUT',
    inputSchema,
    outputSchema,
    description,
    requiresAuth: true,
    ...options
  });
}

export function createDeleteRoute(path: string, description: string, options?: Partial<ApiRoute>): ApiRoute {
  return defineRoute({
    path,
    method: 'DELETE',
    outputSchema: BaseApiResponseSchema,
    description,
    requiresAuth: true,
    ...options
  });
}

// Rate limiting presets
export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  API: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  HEAVY: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 requests per 15 minutes for heavy operations
} as const;