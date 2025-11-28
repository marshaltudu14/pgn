import {
  isValidationError,
  extractValidationErrorMessage,
  transformApiErrorMessage,
  handleMobileApiResponse,
  parseAuthErrorCode,
  ValidationErrorDetail,
  ValidationErrorResponse
} from '../errorHandling';

describe('Error Handling Utilities', () => {
  describe('isValidationError', () => {
    it('should return true for valid validation error', () => {
      const error: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ path: ['email'], message: 'Invalid email format' }]
      };

      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      const error = {
        success: false,
        error: 'Server error',
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      };

      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for invalid error objects', () => {
      expect(isValidationError(null)).toBe(false);
      expect(isValidationError(undefined)).toBe(false);
      expect(isValidationError('string')).toBe(false);
      expect(isValidationError({})).toBe(false);
    });
  });

  describe('extractValidationErrorMessage', () => {
    it('should extract field-specific error message', () => {
      const error: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ path: ['email'], message: 'Invalid email format' }]
      };

      const result = extractValidationErrorMessage(error);
      expect(result).toBe('Email: Invalid email format');
    });

    it('should use fallback message when no details provided', () => {
      const error: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR'
      };

      const result = extractValidationErrorMessage(error);
      expect(result).toBe('Request body validation failed');
    });

    it('should use first error when multiple details provided', () => {
      const error: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: [
          { path: ['email'], message: 'Invalid email format' },
          { path: ['password'], message: 'Password too short' }
        ]
      };

      const result = extractValidationErrorMessage(error);
      expect(result).toBe('Email: Invalid email format');
    });
  });

  describe('transformApiErrorMessage', () => {
    it('should transform validation errors properly', () => {
      const validationError: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ path: ['email'], message: 'Invalid email format' }]
      };

      const result = transformApiErrorMessage(validationError);
      expect(result).toBe('Email: Invalid email format');
    });

    it('should transform string errors', () => {
      const result = transformApiErrorMessage('Network error occurred');
      expect(result).toBe('Network error occurred');
    });

    it('should transform Error objects', () => {
      const error = new Error('Invalid email format');
      const result = transformApiErrorMessage(error);
      expect(result).toBe('Please enter a valid email address.');
    });

    it('should transform auth error codes', () => {
      const error = {
        success: false,
        error: 'Authentication failed',
        code: 'INVALID_CREDENTIALS'
      };

      const result = transformApiErrorMessage(error);
      expect(result).toBe('Authentication failed');
    });

    it('should handle unknown error types', () => {
      const result = transformApiErrorMessage({ unknown: 'error' });
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });

    it('should clean technical error messages', () => {
      const error = 'DatabaseError: An employee with this email address already exists';
      const result = transformApiErrorMessage(error);
      expect(result).toBe('An employee with this email address already exists. Please use the Edit Employee page to update their information instead.');
    });
  });

  describe('handleMobileApiResponse', () => {
    it('should handle successful API response', () => {
      const response = {
        success: true,
        data: { id: '1', name: 'Test User' }
      };

      const result = handleMobileApiResponse(response);
      expect(result).toEqual({
        success: true,
        data: { id: '1', name: 'Test User' }
      });
    });

    it('should handle validation error response', () => {
      const response: ValidationErrorResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Request body validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ path: ['email'], message: 'Invalid email format' }]
      };

      const result = handleMobileApiResponse(response);
      expect(result).toEqual({
        success: false,
        error: 'Email: Invalid email format',
        validationDetails: [{ path: ['email'], message: 'Invalid email format' }]
      });
    });

    it('should handle general API error', () => {
      const response = {
        success: false,
        error: 'Server error',
        code: 'SERVER_ERROR'
      };

      const result = handleMobileApiResponse(response);
      expect(result).toEqual({
        success: false,
        error: 'Server is experiencing issues. Please try again in a moment.'
      });
    });

    it('should handle null/undefined responses', () => {
      const result = handleMobileApiResponse(null, 'Request failed');
      expect(result).toEqual({
        success: false,
        error: 'No response from server. Please check your connection.'
      });
    });

    it('should use default error message when provided', () => {
      const response = {
        success: false
      };

      const result = handleMobileApiResponse(response, 'Custom error message');
      expect(result).toEqual({
        success: false,
        error: 'Custom error message'
      });
    });
  });

  describe('parseAuthErrorCode', () => {
    it('should return correct message for known error codes', () => {
      expect(parseAuthErrorCode('INVALID_CREDENTIALS')).toBe('Invalid email or password.');
      expect(parseAuthErrorCode('ACCOUNT_SUSPENDED')).toBe('Account suspended - contact administrator');
      expect(parseAuthErrorCode('RATE_LIMITED')).toBe('Too many login attempts. Please try again later');
      expect(parseAuthErrorCode('SESSION_EXPIRED')).toBe('Your session has expired. Please sign in again.');
    });

    it('should use fallback message for unknown error codes', () => {
      const result = parseAuthErrorCode('UNKNOWN_CODE', 'Fallback message');
      expect(result).toBe('Fallback message');
    });

    it('should use default fallback for unknown error codes without fallback', () => {
      const result = parseAuthErrorCode('UNKNOWN_CODE');
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });
});