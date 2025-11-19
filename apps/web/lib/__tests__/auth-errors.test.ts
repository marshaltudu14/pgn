
import { EmploymentStatus } from '@pgn/shared';
import { NextResponse } from 'next/server';
import { AuthErrorService, canLoginWithStatus, createEmploymentStatusError, EmploymentStatusMessages, getEmploymentStatusMessage } from '../auth-errors';

// Mock NextResponse
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: () => Promise.resolve(body),
        status: init?.status || 200,
        headers: {
          set: jest.fn(),
          get: jest.fn(),
        },
      })),
    },
  };
});

describe('AuthErrorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validationError', () => {
    it('should return 400 status and error message', () => {
      const message = 'Invalid input';
      const response = AuthErrorService.validationError(message);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Validation error', message },
        { status: 400 }
      );
      expect(response.status).toBe(400);
    });

    it('should allow custom status code', () => {
      const message = 'Invalid input';
      const response = AuthErrorService.validationError(message, 422);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Validation error', message },
        { status: 422 }
      );
      expect(response.status).toBe(422);
    });
  });

  describe('authError', () => {
    it('should return 401 status and default message', () => {
      const response = AuthErrorService.authError();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication failed', message: 'Authentication failed' },
        { status: 401 }
      );
      expect(response.status).toBe(401);
    });

    it('should return 401 status and custom message', () => {
      const message = 'Invalid credentials';
      AuthErrorService.authError(message);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Authentication failed', message },
        { status: 401 }
      );
    });
  });

  describe('accessDeniedError', () => {
    it('should return 403 status and message', () => {
      const message = 'Access denied';
      const response = AuthErrorService.accessDeniedError(message);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Access denied', message },
        { status: 403 }
      );
      expect(response.status).toBe(403);
    });

    it('should include employment status if provided', () => {
      const message = 'Suspended';
      const status: EmploymentStatus = 'SUSPENDED';
      AuthErrorService.accessDeniedError(message, status);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Access denied', message, employmentStatus: status },
        { status: 403 }
      );
    });
  });

  describe('rateLimitError', () => {
    it('should return 429 status and default message', () => {
      const response = AuthErrorService.rateLimitError();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Rate limit exceeded', message: 'Too many requests, please try again later.' },
        { status: 429 }
      );
      expect(response.status).toBe(429);
    });

    it('should set Retry-After header if provided', () => {
      const retryAfter = 60;
      const response = AuthErrorService.rateLimitError(undefined, retryAfter);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Rate limit exceeded', message: 'Too many requests, please try again later.', retryAfter },
        { status: 429 }
      );
      expect(response.headers.set).toHaveBeenCalledWith('Retry-After', '60');
    });
  });

  describe('serverError', () => {
    it('should return 500 status and default message', () => {
      const response = AuthErrorService.serverError();
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error', message: 'An unexpected error occurred' },
        { status: 500 }
      );
      expect(response.status).toBe(500);
    });
  });

  describe('methodNotAllowedError', () => {
    it('should return 405 status and message', () => {
      const response = AuthErrorService.methodNotAllowedError('POST');
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Method not allowed', message: 'POST method not allowed' },
        { status: 405 }
      );
      expect(response.status).toBe(405);
    });

    it('should include allowed methods in message and header', () => {
      const allowed = ['GET', 'PUT'];
      const response = AuthErrorService.methodNotAllowedError('POST', allowed);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Method not allowed', message: 'POST method not allowed. Allowed methods: GET, PUT' },
        { status: 405 }
      );
      expect(response.headers.set).toHaveBeenCalledWith('Allow', 'GET, PUT');
    });
  });
});

describe('Employment Status Utilities', () => {
  describe('getEmploymentStatusMessage', () => {
    it('should return correct message for status', () => {
      expect(getEmploymentStatusMessage('ACTIVE')).toBe(EmploymentStatusMessages.ACTIVE);
      expect(getEmploymentStatusMessage('SUSPENDED')).toBe(EmploymentStatusMessages.SUSPENDED);
    });
  });

  describe('canLoginWithStatus', () => {
    it('should return true for ACTIVE and ON_LEAVE', () => {
      expect(canLoginWithStatus('ACTIVE')).toBe(true);
      expect(canLoginWithStatus('ON_LEAVE')).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(canLoginWithStatus('SUSPENDED')).toBe(false);
      expect(canLoginWithStatus('RESIGNED')).toBe(false);
      expect(canLoginWithStatus('TERMINATED')).toBe(false);
    });
  });

  describe('createEmploymentStatusError', () => {
    it('should create access denied error with correct message and status', () => {
      const status: EmploymentStatus = 'SUSPENDED';
      createEmploymentStatusError(status);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { 
          error: 'Access denied', 
          message: EmploymentStatusMessages.SUSPENDED,
          employmentStatus: status 
        },
        { status: 403 }
      );
    });
  });
});
