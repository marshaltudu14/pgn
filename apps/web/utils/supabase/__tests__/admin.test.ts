/**
 * Unit tests for Supabase Admin utility using Jest
 */

import {
  createAuthUser,
  getUserByEmail,
  resetUserPassword,
  updateUserEmail,
  updateUserPasswordByEmail,
  getSupabaseAdmin,
} from '../admin';

// Mock @supabase/supabase-js module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@supabase/supabase-js';

// Import the admin module directly to access internal function
import * as adminModule from '../admin';

// Mock console.error to prevent noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Supabase Admin Utility', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;
  let mockAuth: {
    admin: {
      createUser: jest.Mock;
      updateUserById: jest.Mock;
      listUsers: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create a comprehensive mock for Supabase client
    mockAuth = {
      admin: {
        createUser: jest.fn(),
        updateUserById: jest.fn(),
        listUsers: jest.fn(),
      },
    };

    mockSupabaseClient = {
      auth: mockAuth,
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe('getSupabaseAdmin', () => {
    it('should create a Supabase client with correct configuration when environment variables are set', () => {
      // Set environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      getSupabaseAdmin();

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-service-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );
    });

    it('should throw error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
      // NEXT_PUBLIC_SUPABASE_URL is not set

      expect(() => getSupabaseAdmin()).toThrow(
        'Missing Supabase environment variables for admin operations'
      );
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      // SUPABASE_SERVICE_ROLE_KEY is not set

      expect(() => getSupabaseAdmin()).toThrow(
        'Missing Supabase environment variables for admin operations'
      );
    });

    it('should throw error when both environment variables are missing', () => {
      // Neither environment variable is set

      expect(() => getSupabaseAdmin()).toThrow(
        'Missing Supabase environment variables for admin operations'
      );
    });
  });

  describe('createAuthUser', () => {
    beforeEach(() => {
      // Set environment variables for all tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    it('should create a new auth user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
      };

      mockAuth.admin.createUser.mockResolvedValue({
        data: { user: mockUserData },
        error: null,
      });

      const result = await createAuthUser(email, password);

      expect(mockAuth.admin.createUser).toHaveBeenCalledWith({
        email,
        password,
        email_confirm: true,
      });
      expect(result).toEqual({
        success: true,
        data: { user: mockUserData },
      });
    });

    it('should handle Supabase API errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockError = {
        message: 'User already exists',
        code: 'duplicate_user',
      };

      mockAuth.admin.createUser.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await createAuthUser(email, password);

      expect(mockAuth.admin.createUser).toHaveBeenCalledWith({
        email,
        password,
        email_confirm: true,
      });
      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error creating auth user:',
        mockError
      );
    });

    it('should handle network or unexpected errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const networkError = new Error('Network error');

      mockAuth.admin.createUser.mockRejectedValue(networkError);

      const result = await createAuthUser(email, password);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error creating auth user:',
        networkError
      );
    });

    it('should handle empty email', async () => {
      const email = '';
      const password = 'password123';

      mockAuth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: '' } },
        error: null,
      });

      const result = await createAuthUser(email, password);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.createUser).toHaveBeenCalledWith({
        email: '',
        password: 'password123',
        email_confirm: true,
      });
    });

    it('should handle empty password', async () => {
      const email = 'test@example.com';
      const password = '';

      mockAuth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const result = await createAuthUser(email, password);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '',
        email_confirm: true,
      });
    });
  });

  describe('resetUserPassword', () => {
    beforeEach(() => {
      // Set environment variables for all tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    it('should reset user password successfully', async () => {
      const userId = 'user-123';
      const newPassword = 'newPassword123';
      const mockUserData = {
        id: userId,
        email: 'test@example.com',
        updated_at: new Date().toISOString(),
      };

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUserData },
        error: null,
      });

      const result = await resetUserPassword(userId, newPassword);

      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith(userId, {
        password: newPassword,
      });
      expect(result).toEqual({
        success: true,
        data: { user: mockUserData },
      });
    });

    it('should handle Supabase API errors', async () => {
      const userId = 'user-123';
      const newPassword = 'newPassword123';
      const mockError = {
        message: 'User not found',
        code: 'user_not_found',
      };

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await resetUserPassword(userId, newPassword);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error resetting password:',
        mockError
      );
    });

    it('should handle network or unexpected errors', async () => {
      const userId = 'user-123';
      const newPassword = 'newPassword123';
      const networkError = new Error('Network error');

      mockAuth.admin.updateUserById.mockRejectedValue(networkError);

      const result = await resetUserPassword(userId, newPassword);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error resetting password:',
        networkError
      );
    });

    it('should handle empty user ID', async () => {
      const userId = '';
      const newPassword = 'newPassword123';

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: '', email: 'test@example.com' } },
        error: null,
      });

      const result = await resetUserPassword(userId, newPassword);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('', {
        password: 'newPassword123',
      });
    });

    it('should handle empty password', async () => {
      const userId = 'user-123';
      const newPassword = '';

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const result = await resetUserPassword(userId, newPassword);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        password: '',
      });
    });
  });

  describe('updateUserEmail', () => {
    beforeEach(() => {
      // Set environment variables for all tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    it('should update user email successfully', async () => {
      const userId = 'user-123';
      const newEmail = 'newemail@example.com';
      const mockUserData = {
        id: userId,
        email: newEmail,
        email_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUserData },
        error: null,
      });

      const result = await updateUserEmail(userId, newEmail);

      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith(userId, {
        email: newEmail,
        email_confirm: true,
      });
      expect(result).toEqual({
        success: true,
        data: { user: mockUserData },
      });
    });

    it('should handle Supabase API errors', async () => {
      const userId = 'user-123';
      const newEmail = 'newemail@example.com';
      const mockError = {
        message: 'Email already in use',
        code: 'duplicate_email',
      };

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await updateUserEmail(userId, newEmail);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error updating user email:',
        mockError
      );
    });

    it('should handle network or unexpected errors', async () => {
      const userId = 'user-123';
      const newEmail = 'newemail@example.com';
      const networkError = new Error('Network error');

      mockAuth.admin.updateUserById.mockRejectedValue(networkError);

      const result = await updateUserEmail(userId, newEmail);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error updating user email:',
        networkError
      );
    });

    it('should handle empty user ID', async () => {
      const userId = '';
      const newEmail = 'newemail@example.com';

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: '', email: 'newemail@example.com' } },
        error: null,
      });

      const result = await updateUserEmail(userId, newEmail);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('', {
        email: 'newemail@example.com',
        email_confirm: true,
      });
    });

    it('should handle empty email', async () => {
      const userId = 'user-123';
      const newEmail = '';

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: 'user-123', email: '' } },
        error: null,
      });

      const result = await updateUserEmail(userId, newEmail);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        email: '',
        email_confirm: true,
      });
    });
  });

  describe('getUserByEmail', () => {
    beforeEach(() => {
      // Set environment variables for all tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    it('should find user by email successfully', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await getUserByEmail(email);

      expect(mockAuth.admin.listUsers).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const mockUsersList = {
        users: [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' },
        ],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle case-insensitive email matching', async () => {
      const email = 'TEST@EXAMPLE.COM';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it('should handle email with leading/trailing whitespace', async () => {
      const email = '  test@example.com  ';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it('should handle Supabase API errors', async () => {
      const email = 'test@example.com';
      const mockError = {
        message: 'Permission denied',
        code: 'permission_denied',
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error getting user by email:',
        mockError
      );
    });

    it('should handle network or unexpected errors', async () => {
      const email = 'test@example.com';
      const networkError = new Error('Network error');

      mockAuth.admin.listUsers.mockRejectedValue(networkError);

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error getting user by email:',
        networkError
      );
    });

    it('should handle empty email', async () => {
      const email = '';
      const mockUsersList = {
        users: [],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await getUserByEmail(email);

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });
  });

  describe('updateUserPasswordByEmail', () => {
    beforeEach(() => {
      // Set environment variables for all tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    });

    it('should update user password by email successfully', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };
      const mockUpdatedUser = {
        ...mockUser,
        updated_at: new Date().toISOString(),
      };

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      // Mock updateUserById
      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUpdatedUser },
        error: null,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(mockAuth.admin.listUsers).toHaveBeenCalled();
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        password: newPassword,
      });
      expect(result).toEqual({
        success: true,
        data: { user: mockUpdatedUser },
      });
    });

    it('should handle case when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const newPassword = 'newPassword123';
      const mockUsersList = {
        users: [
          { id: 'user-1', email: 'user1@example.com' },
          { id: 'user-2', email: 'user2@example.com' },
        ],
      };

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: 'User not found with this email',
      });
      expect(mockAuth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle errors from getUserByEmail', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      const mockError = {
        message: 'Permission denied',
        code: 'permission_denied',
      };

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(mockAuth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle errors from updateUserById', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };
      const mockError = {
        message: 'Invalid password',
        code: 'invalid_password',
      };

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      // Mock updateUserById
      mockAuth.admin.updateUserById.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: mockError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error updating user password by email:',
        mockError
      );
    });

    it('should handle network or unexpected errors in getUserByEmail', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      const networkError = new Error('Network error');

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockRejectedValue(networkError);

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error getting user by email:',
        networkError
      );
      expect(mockAuth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle network or unexpected errors in updateUserById', async () => {
      const email = 'test@example.com';
      const newPassword = 'newPassword123';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };
      const networkError = new Error('Network error');

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      // Mock updateUserById
      mockAuth.admin.updateUserById.mockRejectedValue(networkError);

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: networkError,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error updating user password by email:',
        networkError
      );
    });

    it('should handle empty email', async () => {
      const email = '';
      const newPassword = 'newPassword123';

      // Mock empty users list for empty email search
      const mockUsersList = {
        users: [],
      };

      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result).toEqual({
        success: false,
        error: 'User not found with this email',
      });
      expect(mockAuth.admin.listUsers).toHaveBeenCalled();
      expect(mockAuth.admin.updateUserById).not.toHaveBeenCalled();
    });

    it('should handle empty password', async () => {
      const email = 'test@example.com';
      const newPassword = '';
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };
      const mockUsersList = {
        users: [mockUser],
      };
      const mockUpdatedUser = {
        ...mockUser,
        updated_at: new Date().toISOString(),
      };

      // Mock getUserByEmail (which calls listUsers internally)
      mockAuth.admin.listUsers.mockResolvedValue({
        data: mockUsersList,
        error: null,
      });

      // Mock updateUserById
      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: mockUpdatedUser },
        error: null,
      });

      const result = await updateUserPasswordByEmail(email, newPassword);

      expect(result.success).toBe(true);
      expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
        password: '',
      });
    });
  });
});
