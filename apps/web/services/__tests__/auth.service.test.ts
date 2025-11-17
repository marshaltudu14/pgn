/**
 * Unit tests for AuthService using Jest
 */

import { AuthService } from '../auth.service';
import { jwtService } from '@/lib/jwt';
import {
  LoginRequest,
  RefreshRequest,
  LogoutRequest,
  EmploymentStatus
} from '@pgn/shared';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
  },
};

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock JWT service
jest.mock('@/lib/jwt', () => ({
  jwtService: {
    generateToken: jest.fn(),
    refreshToken: jest.fn(),
    validateToken: jest.fn(),
  },
}));

const mockSupabase = mockSupabaseClient;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockEmployeeData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      human_readable_user_id: 'PGN-2024-0001',
      employment_status: 'ACTIVE' as EmploymentStatus,
      can_login: true,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@company.com',
    };

    const validLoginRequest: LoginRequest = {
      email: 'john.doe@company.com',
      password: 'password123',
    };

    it('should successfully authenticate valid credentials', async () => {
      // Mock employee lookup
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockEmployeeData,
            error: null,
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Mock Supabase auth
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Mock JWT generation
      const mockToken = 'mock.jwt.token';
      (jwtService.generateToken as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(validLoginRequest);

      expect(result).toEqual({
        message: 'Login successful',
        token: mockToken,
        employee: {
          id: mockEmployeeData.id,
          humanReadableId: mockEmployeeData.human_readable_user_id,
          fullName: 'John Doe',
          email: mockEmployeeData.email,
          employmentStatus: mockEmployeeData.employment_status,
          canLogin: mockEmployeeData.can_login,
        },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('employees');
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'john.doe@company.com',
        password: 'password123',
      });
    });

    it('should throw error for invalid user ID', async () => {
      // Mock employee lookup for non-existent user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No rows returned' },
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        'Employee account not found - contact administrator'
      );
    });

    it('should throw error for suspended employee', async () => {
      const suspendedEmployee = {
        ...mockEmployeeData,
        employment_status: 'SUSPENDED' as EmploymentStatus,
        can_login: false,
      };

      // Mock employee lookup
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: suspendedEmployee,
            error: null,
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        'Account suspended - contact administrator'
      );
    });

    it('should throw error for Supabase auth failure', async () => {
      // Mock employee lookup
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockEmployeeData,
            error: null,
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Mock Supabase auth failure
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      await expect(authService.login(validLoginRequest)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('refreshToken', () => {
    const validRefreshRequest: RefreshRequest = {
      token: 'existing.jwt.token',
    };

    it('should successfully refresh a valid token', async () => {
      const mockPayload = {
        sub: 'PGN-2024-0001',
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        employmentStatus: 'ACTIVE' as EmploymentStatus,
        canLogin: true,
      };

      const mockEmployeeData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        human_readable_user_id: 'PGN-2024-0001',
        employment_status: 'ACTIVE' as EmploymentStatus,
        can_login: true,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
      };

      // Mock token validation
      (jwtService.validateToken as jest.Mock).mockReturnValue(mockPayload);

      // Mock employee lookup
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockEmployeeData,
            error: null,
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      // Mock new token generation
      const mockNewToken = 'new.jwt.token';
      (jwtService.generateToken as jest.Mock).mockReturnValue(mockNewToken);

      const result = await authService.refreshToken(validRefreshRequest);

      expect(result).toEqual({
        token: mockNewToken,
      });

      expect(jwtService.validateToken).toHaveBeenCalledWith('existing.jwt.token');
      expect(jwtService.generateToken).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      (jwtService.validateToken as jest.Mock).mockReturnValue(null);

      await expect(authService.refreshToken(validRefreshRequest)).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw error for user no longer authorized', async () => {
      const mockPayload = {
        sub: 'PGN-2024-0001',
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        employmentStatus: 'ACTIVE' as EmploymentStatus,
        canLogin: true,
      };

      // Mock token validation
      (jwtService.validateToken as jest.Mock).mockReturnValue(mockPayload);

      // Mock employee lookup for user who can no longer login
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No rows returned' },
          }),
        }),
      });
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(authService.refreshToken(validRefreshRequest)).rejects.toThrow(
        'User no longer authorized to access the system'
      );
    });
  });

  describe('logout', () => {
    const validLogoutRequest: LogoutRequest = {
      token: 'valid.jwt.token',
    };

    it('should successfully logout with valid token', async () => {
      const mockPayload = {
        sub: 'PGN-2024-0001',
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        employmentStatus: 'ACTIVE' as EmploymentStatus,
        canLogin: true,
        iat: 1234567890,
        exp: 1234568790,
      };

      // Mock token validation
      (jwtService.validateToken as jest.Mock).mockReturnValue(mockPayload);

      // Mock Supabase logout
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await authService.logout(validLogoutRequest);

      expect(result).toEqual({
        message: 'Logged out successfully',
      });

      expect(jwtService.validateToken).toHaveBeenCalledWith('valid.jwt.token');
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error for invalid token', async () => {
      (jwtService.validateToken as jest.Mock).mockReturnValue(null);

      await expect(authService.logout(validLogoutRequest)).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw error for Supabase logout failure', async () => {
      const mockPayload = {
        sub: 'PGN-2024-0001',
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        employmentStatus: 'ACTIVE' as EmploymentStatus,
        canLogin: true,
        iat: 1234567890,
        exp: 1234568790,
      };

      // Mock token validation
      (jwtService.validateToken as jest.Mock).mockReturnValue(mockPayload);

      // Mock Supabase logout failure
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' },
      });

      await expect(authService.logout(validLogoutRequest)).rejects.toThrow(
        'Logout failed'
      );
    });
  });

  describe('canLoginWithStatus', () => {
    it('should return true for ACTIVE status', () => {
      expect(authService.canLoginWithStatus('ACTIVE')).toBe(true);
    });

    it('should return true for ON_LEAVE status', () => {
      expect(authService.canLoginWithStatus('ON_LEAVE')).toBe(true);
    });

    it('should return false for SUSPENDED status', () => {
      expect(authService.canLoginWithStatus('SUSPENDED')).toBe(false);
    });

    it('should return false for RESIGNED status', () => {
      expect(authService.canLoginWithStatus('RESIGNED')).toBe(false);
    });

    it('should return false for TERMINATED status', () => {
      expect(authService.canLoginWithStatus('TERMINATED')).toBe(false);
    });
  });

  describe('trackFailedLoginAttempt', () => {
    it('should track failed login attempt', async () => {
      // This method just logs the attempt, so we expect no errors
      await expect(authService.trackFailedLoginAttempt('PGN-2024-0001', '192.168.1.1')).resolves.toBeUndefined();
    });
  });

  describe('hasExceededRateLimit', () => {
    it('should return false (no rate limiting implemented)', async () => {
      const result = await authService.hasExceededRateLimit();
      expect(result).toBe(false);
    });
  });
});