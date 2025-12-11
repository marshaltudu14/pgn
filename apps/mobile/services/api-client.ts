/**
 * PGN API Client - Following Dukancard's Proven Patterns
 *
 * This API client implements the exact same authentication and error handling
 * patterns as dukancard's proven enterprise-grade API client.
 */

import { SessionManager } from '@/utils/auth-utils';
import { API_ENDPOINTS, buildApiUrl } from '@/constants/api';

// Note: API_BASE_URL is imported from @/constants/api

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.REFRESH_TOKEN,
  API_ENDPOINTS.LOGOUT,
];


// Error types matching dukancard's pattern
export interface ApiError {
  error: string;
  message: string;
  code: string;
  employmentStatus?: string;
  retryAfter?: number;
  context?: string;
}

export interface ValidationErrorDetail {
  path: string[];
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: ValidationErrorDetail[];
}

export interface AppError {
  code: string;
  title: string;
  message: string;
  details?: any;
  retry?: boolean;
}

// Error handling matching dukancard's pattern
export function createAppError(code: string, title: string, message: string, details?: any): AppError {
  return {
    code,
    title,
    message,
    details,
    retry: ['network', 'timeout'].includes(code),
  };
}

export function handleApiError(error: Error | null): AppError {
  if (!error) {
    return createAppError('unknown', 'Unknown Error', 'An unexpected error occurred');
  }

  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return createAppError(
      'network',
      'Network Error',
      'Please check your internet connection and try again.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('timeout')) {
    return createAppError(
      'timeout',
      'Request Timeout',
      'The request took too long. Please try again.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('token has expired') || errorMessage.includes('unauthorized')) {
    return createAppError(
      'unauthorized',
      'Session Expired',
      'Your session has expired. Please sign in again.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('forbidden')) {
    return createAppError(
      'forbidden',
      'Access Denied',
      'You do not have permission to perform this action.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('not found')) {
    return createAppError(
      'not_found',
      'Not Found',
      'The requested resource was not found.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('rate limit')) {
    return createAppError(
      'rate_limit',
      'Too Many Requests',
      'Please wait a moment before trying again.',
      { originalError: error.message }
    );
  }

  if (errorMessage.includes('validation')) {
    return createAppError(
      'validation',
      'Invalid Data',
      'Please check your input and try again.',
      { originalError: error.message }
    );
  }

  return createAppError(
    'server',
    'Server Error',
    'Something went wrong. Please try again later.',
    { originalError: error.message }
  );
}

// Helper to check if endpoint is public
function isPublicEndpoint(endpoint: string): boolean {
  return PUBLIC_ENDPOINTS.some(publicEndpoint => endpoint.includes(publicEndpoint));
}

// Global refresh lock to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Refresh token API call following dukancard's pattern
async function refreshTokenAPI(refreshToken: string): Promise<boolean> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Set refresh lock and create promise
  isRefreshing = true;
  refreshPromise = (async (): Promise<boolean> => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.REFRESH_TOKEN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-client-info': 'pgn-mobile-client',
          'User-Agent': 'pgn-mobile-app/1.0.0',
        },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Safely parse JSON response
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('JSON Parse Error in refresh:', {
          status: response.status,
          error: parseError instanceof Error ? parseError.message : 'Unknown refresh parse error',
        });
        return false;
      }

      // Check for successful response with proper structure
      if (responseData.success && responseData.data?.token) {
        // Save new session to storage
        await SessionManager.saveSession({
          accessToken: responseData.data.token,
          refreshToken: responseData.data.refreshToken || refreshToken,
          expiresIn: responseData.data.expiresIn || 900,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      // Clear refresh lock
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Core API call function following dukancard's pattern with automatic token refresh
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = buildApiUrl(endpoint);

    // Prepare base headers
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-type': 'mobile', // Header to identify mobile clients for region filtering
      'x-client-info': 'pgn-mobile-client',
      'User-Agent': 'pgn-mobile-app/1.0.0',
    };

    // Add authorization header for private endpoints
    const authHeaders: Record<string, string> = {};
    if (!isPublicEndpoint(endpoint)) {
      let session = await SessionManager.loadSession();

      console.log('[API Client] Session for', endpoint, ':', {
        hasSession: !!session,
        hasAccessToken: !!session?.accessToken,
        isExpired: session ? SessionManager.isSessionExpired(session) : false,
        endpoint: endpoint
      });

      // Check if session exists and token is not expired
      if (!session || SessionManager.isSessionExpired(session)) {
        // Try to refresh token if we have a refresh token
        if (session?.refreshToken) {
          console.log('[API Client] Token expired, refreshing for:', endpoint);
          const refreshSuccess = await refreshTokenAPI(session.refreshToken);

          if (refreshSuccess) {
            session = await SessionManager.loadSession();
            console.log('[API Client] Token refreshed successfully for:', endpoint);
          } else {
            console.error('[API Client] Token refresh failed for:', endpoint);
            await SessionManager.clearSession();
            return {
              success: false,
              error: "Session expired. Please login again.",
            };
          }
        } else {
          console.error('[API Client] No session or refresh token for:', endpoint);
          return {
            success: false,
            error: "No active session. Please login again.",
          };
        }
      }

      // Add authorization header with current token
      if (session?.accessToken) {
        authHeaders.Authorization = `Bearer ${session.accessToken}`;
        console.log('[API Client] Authorization header added for:', endpoint);
      } else {
        console.error('[API Client] No access token after refresh for:', endpoint);
        return {
          success: false,
          error: "No access token available. Please login again.",
        };
      }
    }

    // Combine all headers
    const headers = {
      ...baseHeaders,
      ...authHeaders,
      ...options.headers,
    };

    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 as a fallback (should rarely happen with proactive refresh)
    if (response.status === 401 && !isPublicEndpoint(endpoint)) {
      console.error('[API Client] Received 401 after proactive refresh check for:', endpoint);
      await SessionManager.clearSession();
      return {
        success: false,
        error: "Session expired. Please login again.",
      };
    }

    
    const responseData = await response.json();

    if (!response.ok) {
      // Handle specific HTTP status codes
      if (response.status === 403) {
        return {
          success: false,
          error: "Access denied. You don't have permission to perform this action."
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: "Too many requests. Please wait before trying again."
        };
      }

      if (response.status >= 500) {
        return {
          success: false,
          error: "Server error. Please try again later."
        };
      }

      // Return error from API response if available
      // For 401 errors, always prefer the message field for user-friendly errors
      if (response.status === 401) {
        const authMessage = responseData.message || responseData.error || 'Invalid email or password.';
        return {
          success: false,
          error: authMessage,
          // Include the error code for better client-side handling
          code: responseData.code || 'INVALID_CREDENTIALS',
        };
      }

      // For other errors, use standard error extraction
      const errorMessage = responseData.message || responseData.error || 'Request failed';
      return {
        success: false,
        error: errorMessage,
        code: responseData.code || 'SERVER_ERROR',
        // Preserve validation details if present
        details: responseData.details,
      };
    }

    // Check if response is already wrapped in our API structure
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      // Response is already wrapped, return as-is
      // Preserve validation error details if present
      return responseData as ApiResponse<T>;
    }

    // Otherwise, wrap the response
    return {
      success: true,
      data: responseData,
    };

  } catch (error) {
    console.error('API Call Error:', {
      endpoint,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const appError = handleApiError(error instanceof Error ? error : null);

    return {
      success: false,
      error: appError.message,
    };
  }
}

// Convenience methods matching dukancard's pattern
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = any>(endpoint: string, data?: any, options?: Omit<RequestInit, 'method' | 'body'>) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Utility function for checking connectivity
export async function checkApiConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.LOGIN), {
      method: 'HEAD',
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

// Export the main apiCall function for direct usage
export { apiCall as default };

// Legacy exports for compatibility
export const apiClient = {
  login: async (credentials: { email: string; password: string }) => {
    return api.post(API_ENDPOINTS.LOGIN, credentials);
  },

  refreshToken: async (refreshToken: string) => {
    return api.post(API_ENDPOINTS.REFRESH_TOKEN, { token: refreshToken });
  },

  logout: async (authToken: string) => {
    return api.post(API_ENDPOINTS.LOGOUT, { token: authToken });
  },

  getCurrentUser: async () => {
    return api.get(API_ENDPOINTS.GET_AUTH_USER);
  },

  checkConnectivity: checkApiConnectivity,
};