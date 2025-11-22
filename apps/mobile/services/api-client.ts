/**
 * PGN API Client - Following Dukancard's Proven Patterns
 *
 * This API client implements the exact same authentication and error handling
 * patterns as dukancard's proven enterprise-grade API client.
 */

import { SessionManager } from '@/utils/auth-utils';

// API Configuration
const API_BASE_URL = __DEV__ ? 'http://192.168.31.23:3000/api' : 'https://pgnwork.com/api';

// Public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
];

// Device info for security tracking
const getDeviceInfo = () => {
  return {
    platform: 'mobile',
    timestamp: Date.now(),
    version: '1.0.0',
    client: 'pgn-mobile-client'
  };
};

// Error types matching dukancard's pattern
export interface ApiError {
  error: string;
  message: string;
  employmentStatus?: string;
  retryAfter?: number;
  context?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
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

      const responseData = await response.json();

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
    const url = `${API_BASE_URL}${endpoint}`;

    // Prepare base headers
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-client-info': 'pgn-mobile-client',
      'User-Agent': 'pgn-mobile-app/1.0.0',
    };

    // Add authorization header for private endpoints
    const authHeaders: Record<string, string> = {};
    if (!isPublicEndpoint(endpoint)) {
      const session = await SessionManager.loadSession();
      if (session?.accessToken && !SessionManager.isSessionExpired(session)) {
        authHeaders.Authorization = `Bearer ${session.accessToken}`;
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

    // Handle 401 with automatic token refresh and retry
    if (response.status === 401 && !isPublicEndpoint(endpoint)) {
      try {
        const session = await SessionManager.loadSession();
        if (session?.refreshToken) {
          // Try to refresh token
          const refreshSuccess = await refreshTokenAPI(session.refreshToken);

          if (refreshSuccess) {
            // Retry the original request with new token
            const newSession = await SessionManager.loadSession();
            const retryHeaders = {
              ...baseHeaders,
              Authorization: `Bearer ${newSession?.accessToken}`,
              ...options.headers,
            };

            const retryResponse = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });

            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              return {
                success: true,
                data: retryData,
              };
            }
          }
        }
      } catch (refreshError) {
        console.error('Automatic token refresh failed:', refreshError);
      }

      // Refresh failed or retry failed, clear session
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
      return {
        success: false,
        error: responseData.error || responseData.message || 'Request failed',
      };
    }

    // Check if response is already wrapped in our API structure
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      // Response is already wrapped, return as-is
      return responseData;
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    return api.post('/auth/login', credentials);
  },

  refreshToken: async (refreshToken: string) => {
    return api.post('/auth/refresh', { token: refreshToken });
  },

  logout: async (authToken: string) => {
    return api.post('/auth/logout', { token: authToken });
  },

  getCurrentUser: async () => {
    return api.get('/auth/user');
  },

  checkConnectivity: checkApiConnectivity,
};