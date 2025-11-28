/**
 * Error handling utilities for mobile Zustand stores
 * Provides consistent error handling for API validation responses
 * Aligned with web app error handling for consistency
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
export function isValidationError(error: any): error is ValidationErrorResponse {
  return !!(
    error &&
    typeof error === 'object' &&
    error.success === false &&
    error.code === 'VALIDATION_ERROR' &&
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
      const fieldName = formatFieldName(firstError.path.join('.'));
      return `${fieldName}: ${firstError.message}`;
    }
    return firstError.message;
  }

  // Fall back to the main error message
  return error.message || error.error || 'Validation failed';
}

/**
 * Format field names to be more user-friendly
 */
function formatFieldName(fieldName: string): string {
  // Convert snake_case to readable format
  const formatted = fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  // Handle common field names
  switch (fieldName.toLowerCase()) {
    case 'email':
      return 'Email';
    case 'password':
      return 'Password';
    case 'firstname':
    case 'first_name':
      return 'First name';
    case 'lastname':
    case 'last_name':
      return 'Last name';
    case 'phone':
    case 'phonenumber':
    case 'phone_number':
      return 'Phone';
    case 'shopname':
    case 'shop_name':
      return 'Shop name';
    case 'farmname':
    case 'farm_name':
      return 'Farm name';
    case 'region':
      return 'Region';
    case 'city':
      return 'City';
    case 'state':
      return 'State';
    default:
      return formatted;
  }
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
    const errorValue = (error as any).error;
    if (typeof errorValue === 'string') {
      return cleanTechnicalErrorMessage(errorValue);
    }
  }

  // Handle object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const messageValue = (error as any).message;
    if (typeof messageValue === 'string') {
      return cleanTechnicalErrorMessage(messageValue);
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

  // Handle common authentication errors
  if (cleanError.includes('Invalid login credentials') || cleanError.includes('Invalid email or password')) {
    return 'The email or password you entered is incorrect.';
  }

  if (cleanError.includes('User not found') || cleanError.includes('Employee not found')) {
    return 'Your account was not found. Please contact your administrator.';
  }

  if (cleanError.includes('You do not have permission') || cleanError.includes('ACCESS_DENIED')) {
    return 'You do not have permission to perform this action. Please contact your administrator.';
  }

  if (cleanError.includes('Account suspended') || cleanError.includes('ACCOUNT_SUSPENDED')) {
    return 'Your account has been suspended. Please contact your administrator.';
  }

  if (cleanError.includes('Employment ended') || cleanError.includes('EMPLOYMENT_ENDED')) {
    return 'Your employment has ended. Thank you for your service.';
  }

  if (cleanError.includes('Employment terminated') || cleanError.includes('EMPLOYMENT_TERMINATED')) {
    return 'Your employment has been terminated. Please contact HR.';
  }

  if (cleanError.includes('Currently on leave') || cleanError.includes('EMPLOYMENT_ON_LEAVE')) {
    return 'You are currently on leave. Please contact your administrator if you need access.';
  }

  if (cleanError.includes('RATE_LIMITED') || cleanError.includes('Too many login attempts')) {
    return 'Too many login attempts. Please try again later.';
  }

  if (cleanError.includes('SESSION_EXPIRED') || cleanError.includes('TOKEN_EXPIRED')) {
    return 'Your session has expired. Please sign in again.';
  }

  // Handle common mobile-specific errors
  if (cleanError.includes('Location is required')) {
    return 'Location access is required for check-in/check-out. Please enable location services.';
  }

  if (cleanError.includes('Camera permission denied')) {
    return 'Camera permission is required for attendance verification. Please enable camera access in your device settings.';
  }

  if (cleanError.includes('Network connection failed') || cleanError.includes('NETWORK_ERROR')) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (cleanError.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  if (cleanError.includes('Server error') || cleanError.includes('Internal server error')) {
    return 'Server is experiencing issues. Please try again in a moment.';
  }

  // Handle specific employee existence error
  if (cleanError.includes('An employee with this email address already exists')) {
    return 'An employee with this email address already exists. Please use the Edit Employee page to update their information instead.';
  }

  // Handle dealer/retailer/farmer specific errors
  if (cleanError.includes('duplicate key') || cleanError.includes('already exists')) {
    return 'A record with these details already exists.';
  }

  // Return cleaned error or fallback
  return cleanError || 'An error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Enhanced API response handler for mobile stores
 * Handles validation errors and extracts user-friendly messages
 */
export function handleMobileApiResponse<T>(
  response: any,
  defaultErrorMessage: string = 'Request failed'
): { success: boolean; data?: T; error?: string; validationDetails?: ValidationErrorDetail[] } {
  try {
    // Check if this is a structured API response
    if (response && typeof response === 'object' && 'success' in response) {
      if (response.success && response.data !== undefined) {
        return {
          success: true,
          data: response.data as T
        };
      }

      // Handle validation errors specifically
      if (isValidationError(response)) {
        return {
          success: false,
          error: extractValidationErrorMessage(response),
          validationDetails: response.details || []
        };
      }

      // Handle other API errors
      const errorMessage = response.error || response.message || defaultErrorMessage;
      return {
        success: false,
        error: transformApiErrorMessage(errorMessage)
      };
    }

    // Handle non-structured responses (shouldn't happen with our API client)
    if (response === null || response === undefined) {
      return {
        success: false,
        error: 'No response from server. Please check your connection.'
      };
    }

    // Assume success for unexpected response formats
    return {
      success: true,
      data: response as T
    };
  } catch (error) {
    console.error('Mobile API response handling error:', error);
    return {
      success: false,
      error: transformApiErrorMessage(error)
    };
  }
}

/**
 * Parse authentication error codes into user-friendly messages
 * This is specifically for the auth store error parsing
 */
export function parseAuthErrorCode(errorCode: string, fallbackMessage?: string): string {
  switch (errorCode) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password.';
    case 'ACCOUNT_NOT_FOUND':
      return 'Employee account not found - contact administrator';
    case 'ACCOUNT_SUSPENDED':
      return 'Account suspended - contact administrator';
    case 'EMPLOYMENT_ENDED':
      return 'Employment ended - thank you for your service';
    case 'EMPLOYMENT_TERMINATED':
      return 'Employment terminated - contact HR';
    case 'EMPLOYMENT_ON_LEAVE':
      return 'Currently on leave - contact administrator if access needed';
    case 'ACCOUNT_ACCESS_DENIED':
      return 'Account access denied';
    case 'EMAIL_NOT_CONFIRMED':
      return 'Please confirm your email address';
    case 'RATE_LIMITED':
      return 'Too many login attempts. Please try again later';
    case 'ACCESS_DENIED':
      return 'Access denied. You may not have permission to login.';
    case 'SESSION_EXPIRED':
    case 'TOKEN_EXPIRED':
      return 'Your session has expired. Please sign in again.';
    case 'VALIDATION_ERROR':
      return 'Invalid input. Please check your information and try again.';
    case 'SERVER_ERROR':
      return 'Server error. Please try again later.';
    case 'NETWORK_ERROR':
      return 'Network error. Please check your internet connection.';
    default:
      return fallbackMessage || 'An unexpected error occurred. Please try again.';
  }
}