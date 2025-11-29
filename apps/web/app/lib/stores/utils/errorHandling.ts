/**
 * Error handling utilities for Zustand stores
 * Provides consistent error handling for API validation responses
 */

export interface ValidationErrorDetail {
  path: string[];
  message: string;
}

export interface ValidationErrorResponse {
  success: false;
  error: string;
  message: string;
  code: string;
  details?: ValidationErrorDetail[];
}

/**
 * Check if an error response is a validation error
 */
export function isValidationError(error: unknown): error is ValidationErrorResponse {
  return (
    !!error &&
    typeof error === 'object' &&
    'success' in error &&
    error.success === false &&
    'code' in error &&
    error.code === 'VALIDATION_ERROR' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

/**
 * Extract user-friendly error messages from validation responses
 */
export function extractValidationErrorMessage(error: ValidationErrorResponse): string {
  // If we have detailed field errors, use them for more specific messages
  if (error.details && error.details.length > 0) {
    // Show the first validation error for simplicity
    const firstError = error.details[0];
    if (firstError.path.length > 0) {
      const fieldName = firstError.path.join('.');
      return `${fieldName}: ${firstError.message}`;
    }
    return firstError.message;
  }

  // Fall back to the main error message
  return error.message || error.error || 'Validation failed';
}

/**
 * Transform API error responses into user-friendly messages
 * Handles both validation errors and general API errors
 */
export function transformApiErrorMessage(error: unknown): string {
  // Handle validation errors with structured format
  if (isValidationError(error)) {
    return extractValidationErrorMessage(error);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return cleanTechnicalErrorMessage(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return cleanTechnicalErrorMessage(error.message);
  }

  // Handle object with error property
  if (error && typeof error === 'object' && 'error' in error) {
    const errorValue = (error as { error: unknown }).error;
    if (typeof errorValue === 'string') {
      return cleanTechnicalErrorMessage(errorValue);
    }
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Clean up technical error messages to make them user-friendly
 */
function cleanTechnicalErrorMessage(error: string): string {
  const cleanError = error
    .replace(/AuthApiError:\s*/, '')
    .replace(/DatabaseError:\s*/, '')
    .replace(/PgError:\s*/, '')
    .replace(/Request body validation failed:\s*/, '')
    .replace(/Query parameters validation failed:\s*/, '')
    .replace(/Route parameters validation failed:\s*/, '')
    .trim();

  // Handle common validation errors
  if (cleanError.includes('Invalid email format')) {
    return 'Please enter a valid email address.';
  }

  if (cleanError.includes('email:')) {
    return cleanError.replace(/email:\s*/, 'Email: ');
  }

  if (cleanError.includes('password:')) {
    return cleanError.replace(/password:\s*/, 'Password: ');
  }

  if (cleanError.includes('firstName:') || cleanError.includes('first_name:')) {
    return cleanError.replace(/(firstName|first_name):\s*/, 'First name: ');
  }

  if (cleanError.includes('lastName:') || cleanError.includes('last_name:')) {
    return cleanError.replace(/(lastName|last_name):\s*/, 'Last name: ');
  }

  if (cleanError.includes('phone:') || cleanError.includes('phone_number:')) {
    return cleanError.replace(/(phone|phone_number):\s*/, 'Phone: ');
  }

  if (cleanError.includes('Required')) {
    return 'This field is required.';
  }

  if (cleanError.includes('Too few characters') || cleanError.includes('String must contain')) {
    return 'This field is too short. Please enter more characters.';
  }

  if (cleanError.includes('Too many characters') || cleanError.includes('String must contain at most')) {
    return 'This field is too long. Please enter fewer characters.';
  }

  // Handle common Supabase/Auth errors
  if (cleanError.includes('An employee with this email address already exists')) {
    return 'An employee with this email address already exists. Please use the Edit Employee page to update their information instead.';
  }

  if (cleanError.includes('You do not have permission')) {
    return 'You do not have permission to perform this action. Please contact your administrator.';
  }

  if (cleanError.includes('User not found')) {
    return 'The requested user was not found in the system.';
  }

  if (cleanError.includes('Invalid login credentials')) {
    return 'The email or password you entered is incorrect.';
  }

  if (cleanError.includes('new row violates row-level security policy')) {
    return 'You do not have permission to perform this action. Please contact your administrator.';
  }

  if (cleanError.includes('duplicate key')) {
    return 'A record with these details already exists.';
  }

  if (cleanError.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (cleanError.includes('Failed to create auth user')) {
    return 'Failed to create user account. Please check the email and try again.';
  }

  // Network and server errors
  if (cleanError.includes('Network connection failed')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (cleanError.includes('Server error') || cleanError.includes('Internal server error')) {
    return 'Server is experiencing issues. Please try again in a moment.';
  }

  // Return cleaned error or fallback
  return cleanError || 'An error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Handle API responses consistently across stores
 * Returns success status and user-friendly error message
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage: string = 'Request failed'
): Promise<{ success: boolean; data?: T; error?: string; validationDetails?: ValidationErrorDetail[] }> {
  try {
    let data: unknown;

    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return {
        success: false,
        error: 'Server error: Invalid response format. Please try again.'
      };
    }

    if (!response.ok) {
      // Handle validation errors specifically
      if (response.status === 400 && isValidationError(data)) {
        return {
          success: false,
          error: extractValidationErrorMessage(data),
          validationDetails: data.details || []
        };
      }

      // Handle other HTTP errors
      const dataRecord = data as Record<string, unknown>;
      const errorKey = 'error' in dataRecord ? 'error' : 'message' in dataRecord ? 'message' : 'error';
      const serverMessage = (dataRecord[errorKey] as string) || errorMessage;

      const userFriendlyMessage = transformApiErrorMessage(serverMessage);

      // Show user-friendly error messages for specific status codes
      if (response.status === 500) {
        return {
          success: false,
          error: 'Server is experiencing issues. Please try again in a moment.'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Too many requests. Please wait a few minutes before trying again.'
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error: userFriendlyMessage || 'You are not authorized to perform this action.'
        };
      } else if (response.status === 404) {
        return {
          success: false,
          error: 'The requested resource was not found.'
        };
      } else {
        return {
          success: false,
          error: userFriendlyMessage
        };
      }
    }

    // Successful response
    const dataRecord = data as Record<string, unknown>;
    if (dataRecord.success && dataRecord.data !== undefined) {
      return {
        success: true,
        data: dataRecord.data as T
      };
    }

    // Handle unexpected successful response format
    return {
      success: true,
      data: data as T
    };
  } catch (error) {
    console.error('API response handling error:', error);
    return {
      success: false,
      error: transformApiErrorMessage(error)
    };
  }
}

/**
 * Get standardized authentication headers for API requests
 */
export function getAuthHeaders(token: string | null = null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-info': 'pgn-web-client',
    'User-Agent': 'pgn-admin-dashboard/1.0.0',
  };

  // Add Authorization header only if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}