/**
 * Unit tests for Supabase Admin utility functions using Jest
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  getUserByEmail,
  updateUserPasswordByEmail,
  createAuthUser,
  resetUserPassword,
  updateUserEmail
} from '../../supabase/admin';

// Mock the Supabase admin client
const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: jest.fn(),
      updateUserById: jest.fn(),
      listUsers: jest.fn()
    }
  }
};

// Mock the createClient function to return our mock
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseAdmin)
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

describe('Supabase Admin Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [mockUser]
        },
        error: null
      } as any);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual({
        success: true,
        data: mockUser
      });

      expect(mockSupabaseAdmin.auth.admin.listUsers).toHaveBeenCalledWith();
    });

    it('should return null when user not found', async () => {
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: []
        },
        error: null
      } as any);

      const result = await getUserByEmail('notfound@example.com');

      expect(result).toEqual({
        success: true,
        data: null
      });

      expect(mockSupabaseAdmin.auth.admin.listUsers).toHaveBeenCalledWith();
    });

    it('should handle errors', async () => {
      const mockError = new Error('Service unavailable');
      mockSupabaseAdmin.auth.admin.listUsers.mockRejectedValue(mockError);

      const result = await getUserByEmail('test@example.com');

      expect(result).toEqual({
        success: false,
        error: mockError
      });
    });

    it('should trim and lowercase email', async () => {
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: []
        },
        error: null
      } as any);

      await getUserByEmail('  Test@Example.COM  ');

      expect(mockSupabaseAdmin.auth.admin.listUsers).toHaveBeenCalledWith();
    });
  });

  describe('updateUserPasswordByEmail', () => {
    it('should update password successfully when user exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      // Mock getUserByEmail to return user
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [mockUser]
        },
        error: null
      } as any);

      // Mock updateUserById to succeed
      mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      const result = await updateUserPasswordByEmail('test@example.com', 'newPassword123');

      expect(result).toEqual({
        success: true,
        data: { user: mockUser }
      });

      // Verify user was found
      expect(mockSupabaseAdmin.auth.admin.listUsers).toHaveBeenCalledWith();

      // Verify password was updated with correct user ID
      expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-123',
        {
          password: 'newPassword123'
        }
      );
    });

    it('should return error when user not found', async () => {
      // Mock getUserByEmail to return null
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: []
        },
        error: null
      } as any);

      const result = await updateUserPasswordByEmail('notfound@example.com', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: 'User not found with this email'
      });

      // Verify updateUserById was not called
      expect(mockSupabaseAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle getUserByEmail errors', async () => {
      const mockError = new Error('Service unavailable');
      mockSupabaseAdmin.auth.admin.listUsers.mockRejectedValue(mockError);

      const result = await updateUserPasswordByEmail('test@example.com', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: mockError
      });

      // Verify updateUserById was not called
      expect(mockSupabaseAdmin.auth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle updateUserById errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockError = new Error('Update failed');

      // Mock getUserByEmail to return user
      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({
        data: {
          users: [mockUser]
        },
        error: null
      } as any);

      // Mock updateUserById to fail
      mockSupabaseAdmin.auth.admin.updateUserById.mockRejectedValue(mockError);

      const result = await updateUserPasswordByEmail('test@example.com', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: mockError
      });
    });
  });

  describe('createAuthUser', () => {
    it('should create user successfully', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'new@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      const result = await createAuthUser('new@example.com', 'password123');

      expect(result).toEqual({
        success: true,
        data: { user: mockUser }
      });

      expect(mockSupabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        email_confirm: true
      });
    });

    it('should handle creation errors', async () => {
      const mockError = new Error('Email already exists');
      mockSupabaseAdmin.auth.admin.createUser.mockRejectedValue(mockError);

      const result = await createAuthUser('existing@example.com', 'password123');

      expect(result).toEqual({
        success: false,
        error: mockError
      });
    });
  });

  describe('resetUserPassword', () => {
    it('should reset password successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      const result = await resetUserPassword('user-123', 'newPassword123');

      expect(result).toEqual({
        success: true,
        data: { user: mockUser }
      });

      expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-123',
        {
          password: 'newPassword123'
        }
      );
    });

    it('should handle reset errors', async () => {
      const mockError = new Error('User not found');
      mockSupabaseAdmin.auth.admin.updateUserById.mockRejectedValue(mockError);

      const result = await resetUserPassword('nonexistent-user', 'newPassword123');

      expect(result).toEqual({
        success: false,
        error: mockError
      });
    });
  });

  describe('updateUserEmail', () => {
    it('should update email successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'new@example.com',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUser },
        error: null
      } as any);

      const result = await updateUserEmail('user-123', 'new@example.com');

      expect(result).toEqual({
        success: true,
        data: { user: mockUser }
      });

      expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
        'user-123',
        {
          email: 'new@example.com',
          email_confirm: true
        }
      );
    });

    it('should handle email update errors', async () => {
      const mockError = new Error('Email already in use');
      mockSupabaseAdmin.auth.admin.updateUserById.mockRejectedValue(mockError);

      const result = await updateUserEmail('user-123', 'existing@example.com');

      expect(result).toEqual({
        success: false,
        error: mockError
      });
    });
  });
});