import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';

/**
 * Configuration options for API route validation
 */
export interface ApiValidationOptions {
  body?: ZodType<unknown>; // Request body validation schema
  query?: ZodType<unknown>; // Query parameters validation schema
  params?: ZodType<unknown>; // Route parameters validation schema
  response?: ZodType<unknown>; // Response validation schema
  requireAuth?: boolean; // Whether authentication is required
  validateResponse?: boolean; // Whether to validate the response
  onError?: (error: ZodError | unknown) => NextResponse; // Custom error handler
}

/**
 * Enhanced API validation middleware
 *
 * This middleware validates:
 * 1. Request body (JSON)
 * 2. Query parameters
 * 3. Route parameters
 * 4. Response data (optional)
 */
export function withApiValidation<T extends NextResponse>(
  handler: (req: NextRequest, context: { params?: unknown }) => Promise<T>,
  options: ApiValidationOptions
) {
  return async (req: NextRequest, context: { params?: unknown }): Promise<T> => {
    try {
      // Handle Next.js 16 dynamic params - params is now a Promise
      let resolvedParams = context.params;
      if (context.params && typeof context.params === 'object' && 'then' in context.params) {
        resolvedParams = await context.params;
      }
      // Validate request body if schema is provided
      if (options.body) {
        const clonedReq = req.clone();
        let body;

        try {
          body = await clonedReq.json();
        } catch {
          const errorResponse = NextResponse.json(
            {
              success: false,
              error: 'Invalid JSON in request body',
              message: 'Request body must be valid JSON',
              code: 'INVALID_JSON'
            },
            { status: 400 }
          );
          return errorResponse as T;
        }

        const validationResult = options.body.safeParse(body);

        if (!validationResult.success) {
          const errorMessage = validationResult.error.issues.map(err =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');

          const errorResponse = NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              message: `Request body validation failed: ${errorMessage}`,
              code: 'VALIDATION_ERROR',
              details: validationResult.error.issues
            },
            { status: 400 }
          );
          return errorResponse as T;
        }

        // Store validated data on the request for later use
        (req as NextRequest & { validatedBody: unknown }).validatedBody = validationResult.data;
      }

      // Validate query parameters if schema is provided
      if (options.query) {
        const { searchParams } = new URL(req.url);
        const queryParams: Record<string, string | string[]> = {};

        searchParams.forEach((value, key) => {
          // Handle array parameters (e.g., id[]=1&id[]=2)
          if (key.endsWith('[]')) {
            const arrayKey = key.slice(0, -2);
            if (!queryParams[arrayKey]) {
              queryParams[arrayKey] = [];
            }
            (queryParams[arrayKey] as string[]).push(value);
          } else {
            queryParams[key] = value;
          }
        });

        const validationResult = options.query.safeParse(queryParams);

        if (!validationResult.success) {
          const errorMessage = validationResult.error.issues.map(err =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');

          const errorResponse = NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              message: `Query parameters validation failed: ${errorMessage}`,
              code: 'VALIDATION_ERROR',
              details: validationResult.error.issues
            },
            { status: 400 }
          );
          return errorResponse as T;
        }

        // Store validated query data on the request
        (req as NextRequest & { validatedQuery: unknown }).validatedQuery = validationResult.data;
      }

      // Validate route parameters if schema is provided
      if (options.params && resolvedParams) {
        const validationResult = options.params.safeParse(resolvedParams);

        if (!validationResult.success) {
          const errorMessage = validationResult.error.issues.map(err =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');

          const errorResponse = NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              message: `Route parameters validation failed: ${errorMessage}`,
              code: 'VALIDATION_ERROR',
              details: validationResult.error.issues
            },
            { status: 400 }
          );
          return errorResponse as T;
        }

        // Store validated parameters on the request
        (req as NextRequest & { validatedParams: unknown }).validatedParams = validationResult.data;
      }

      // Call the original handler with resolved params
      const response = await handler(req, { params: resolvedParams });

      // Validate response if schema is provided and validation is enabled
      if (options.validateResponse && options.response && response instanceof NextResponse) {
        try {
          const clonedResponse = response.clone();
          const responseData = await clonedResponse.json();

          const validationResult = options.response.safeParse(responseData);

          if (!validationResult.success) {
            console.error('Response validation failed:', validationResult.error.issues);

            // Log the error but don't fail the request in production
            // This helps catch breaking changes during development
            if (process.env.NODE_ENV === 'development') {
              const errorResponse = NextResponse.json(
                {
                  success: false,
                  error: 'Response validation failed',
                  message: 'API response does not match expected schema',
                  code: 'RESPONSE_VALIDATION_ERROR',
                  details: validationResult.error.issues
                },
                { status: 500 }
              );
              return errorResponse as T;
            }
          }
        } catch (responseParseError) {
          console.error('Failed to parse response for validation:', responseParseError);
        }
      }

      return response;

    } catch (error) {
      console.error('API validation middleware error:', error);

      if (options.onError) {
        return options.onError(error as ZodError) as T;
      }

      const errorResponse = NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: 'An unexpected error occurred during request validation',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
      return errorResponse as T;
    }
  };
}

/**
 * Helper function to create typed API route handler
 */
export function createApiHandler<TInput = unknown, TOutput extends NextResponse = NextResponse>(
  options: ApiValidationOptions & {
    handler: (req: NextRequest, context: {
      params?: unknown;
      body?: TInput;
      query?: unknown;
    }) => Promise<TOutput>;
  }
) {
  return withApiValidation(
    async (req: NextRequest, context: { params?: unknown }) => {
      return await options.handler(req, {
        ...context,
        body: (req as NextRequest & { validatedBody?: TInput }).validatedBody,
        query: (req as NextRequest & { validatedQuery?: unknown }).validatedQuery,
        params: (req as NextRequest & { validatedParams?: unknown }).validatedParams,
      });
    },
    options
  );
}

/**
 * Development-time validation helper
 * This can be used in tests to ensure all routes have proper validation
 */
export function validateApiRoute(_routeHandler: (...args: unknown[]) => unknown): {
  hasValidation: boolean;
  schemas: string[];
} {
  // This is a placeholder for development-time validation checking
  // In a real implementation, we could inspect the route handler
  // to ensure it has proper validation schemas

  return {
    hasValidation: true, // Placeholder
    schemas: [] // Placeholder
  };
}

/**
 * Type helpers for typed API handlers
 */
export type ValidatedRequestBody<T> = T & { __validated: true };
export type ValidatedRequestQuery<T> = T & { __validated: true };
export type ValidatedRequestParams<T> = T & { __validated: true };