
import { createClient } from '@supabase/supabase-js';
import { createAuthUser, resetUserPassword, updateUserEmail } from '../admin';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('Supabase Admin Utilities', () => {
  const mockCreateUser = jest.fn();
  const mockUpdateUserById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementation
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        admin: {
          createUser: mockCreateUser,
          updateUserById: mockUpdateUserById,
        },
      },
    });

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  describe('createAuthUser', () => {
    it('should create a user successfully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockCreateUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await createAuthUser('test@example.com', 'password123');

      expect(createClient).toHaveBeenCalledWith(
        'https://example.supabase.co',
        'service-role-key',
        expect.any(Object)
      );
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true,
      });
      expect(result).toEqual({ success: true, data: { user: mockUser } });
    });

    it('should handle errors', async () => {
      const mockError = { message: 'User already exists' };
      mockCreateUser.mockResolvedValue({ data: null, error: mockError });

      const result = await createAuthUser('test@example.com', 'password123');

      expect(result).toEqual({ success: false, error: mockError });
    });

    it('should throw error if env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      const result = await createAuthUser('test@example.com', 'password123');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('resetUserPassword', () => {
    it('should update password successfully', async () => {
      const mockUser = { id: 'user-123' };
      mockUpdateUserById.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await resetUserPassword('user-123', 'new-password');

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        password: 'new-password',
      });
      expect(result).toEqual({ success: true, data: { user: mockUser } });
    });

    it('should handle errors', async () => {
      const mockError = { message: 'User not found' };
      mockUpdateUserById.mockResolvedValue({ data: null, error: mockError });

      const result = await resetUserPassword('user-123', 'new-password');

      expect(result).toEqual({ success: false, error: mockError });
    });
  });

  describe('updateUserEmail', () => {
    it('should update email successfully', async () => {
      const mockUser = { id: 'user-123', email: 'new@example.com' };
      mockUpdateUserById.mockResolvedValue({ data: { user: mockUser }, error: null });

      const result = await updateUserEmail('user-123', 'new@example.com');

      expect(mockUpdateUserById).toHaveBeenCalledWith('user-123', {
        email: 'new@example.com',
        email_confirm: true,
      });
      expect(result).toEqual({ success: true, data: { user: mockUser } });
    });

    it('should handle errors', async () => {
      const mockError = { message: 'Email already taken' };
      mockUpdateUserById.mockResolvedValue({ data: null, error: mockError });

      const result = await updateUserEmail('user-123', 'new@example.com');

      expect(result).toEqual({ success: false, error: mockError });
    });
  });
});
