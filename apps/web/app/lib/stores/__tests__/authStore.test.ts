/**
 * Unit tests for Auth Store using Jest
 */

import { useAuthStore } from '../authStore';
import { AuthenticatedUser } from '@pgn/shared';

// Mock the UI store
const mockShowNotification = jest.fn();
jest.mock('../uiStore', () => ({
  useUIStore: {
    getState: () => ({
      showNotification: mockShowNotification
    })
  }
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage - window object is already defined in jest.setup.js
Object.defineProperty(global.window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true
});


// Mock the zustand persist storage
jest.mock('zustand/middleware', () => ({
  ...jest.requireActual('zustand/middleware'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  persist: (createStateFn: any, _options: any) => (set: any, get: any, api: any) => {
    const initialState = createStateFn(set, get, api);
    // Mock the persist functionality by returning the state directly
    return initialState;
  },
}));

describe('useAuthStore', () => {
  const mockUser: AuthenticatedUser = {
    id: 'test-id',
    humanReadableId: 'PGN-2024-0001',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    department: 'Engineering',
    region: 'North',
    employmentStatus: 'ACTIVE',
    canLogin: true,
    profilePhotoUrl: undefined,
    startDate: new Date().toISOString()
  };

  const mockAdminUser: AuthenticatedUser = {
    ...mockUser,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
    });
  });

  afterEach(() => {
    // Reset fetch mock
    (fetch as jest.Mock).mockReset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isAdmin).toBe(false);
    });
  });

  describe('store methods availability', () => {
    it('should have all required methods', () => {
      const store = useAuthStore.getState();

      expect(typeof store.login).toBe('function');
      expect(typeof store.logout).toBe('function');
      expect(typeof store.initialize).toBe('function');
    });
  });

  describe('login functionality', () => {
    it('should successfully login with valid credentials', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            employee: mockUser,
            token: null // Admin users don't get tokens in web dashboard
          }
        })
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password123');

      expect(loginResult.success).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAdmin).toBe(true); // Web dashboard forces admin to true
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Welcome back, Test User!',
        'success'
      );
    });

    it('should successfully login admin user without token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            employee: mockAdminUser,
            token: null // Admin users don't get JWT tokens
          }
        })
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('admin@example.com', 'adminpassword');

      expect(loginResult.success).toBe(true);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual(mockAdminUser);
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAdmin).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login with invalid credentials', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid credentials'
        })
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'wrongpassword');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should handle rate limiting (429 status)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: 'Too many requests'
        })
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should handle server errors (500 status)', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Internal server error'
        })
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should handle invalid JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should handle generic errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

      const store = useAuthStore.getState();
      const loginResult = await store.login('test@example.com', 'password');

      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBeTruthy();
    });

    it('should return login result with correct structure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: mockUser,
          token: 'mock-token'
        })
      });

      const store = useAuthStore.getState();
      const result = await store.login('test@example.com', 'password');

      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('logout functionality', () => {
    it('should successfully logout with token', async () => {
      // First login to set up authenticated state
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: mockUser,
          token: 'mock-token'
        })
      });

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password');

      // Then mock logout API
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await store.logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isAdmin).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'You have been logged out successfully.',
        'info'
      );
    });

    it('should call admin logout API when no token exists', async () => {
      // Set up state without token (admin user)
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: mockAdminUser,
          token: null
        })
      });

      // Mock admin logout response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Admin logged out successfully' } })
      });

      const store = useAuthStore.getState();
      await store.login('admin@example.com', 'password');

      // Reset fetch mock to track logout call
      (fetch as jest.Mock).mockClear();

      // Mock admin logout response again
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Admin logged out successfully' } })
      });

      await store.logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(fetch).toHaveBeenCalledWith('/api/auth/admin-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-info': 'pgn-web-client',
          'User-Agent': 'pgn-admin-dashboard/1.0.0',
        },
        signal: expect.any(AbortSignal),
      });
      expect(mockShowNotification).toHaveBeenCalledWith(
        'You have been logged out successfully.',
        'info'
      );
    });
  });

  describe('admin detection', () => {
    it('should detect admin user by email containing "admin"', async () => {
      const adminUser = {
        ...mockUser,
        email: 'test.admin@company.com',
        firstName: 'Test',
        lastName: 'Admin'
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            employee: adminUser,
            token: null // Admin users don't get tokens in web dashboard
          }
        })
      });

      const store = useAuthStore.getState();
      await store.login('test.admin@company.com', 'password');

      expect(useAuthStore.getState().isAdmin).toBe(true);
    });

    it('should detect admin user when no token is provided', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            employee: mockUser, // Regular user
            token: null // No token indicates admin
          }
        })
      });

      const store = useAuthStore.getState();
      await store.login('admin@company.com', 'password');

      expect(useAuthStore.getState().isAdmin).toBe(true);
    });

    it('should not detect admin for regular users with token', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: mockUser,
          token: 'mock-jwt-token'
        })
      });

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password');

      expect(useAuthStore.getState().isAdmin).toBe(false);
    });
  });

  describe('fetch calls', () => {
    it('should make correct API call to login endpoint', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          employee: mockUser,
          token: 'mock-token'
        })
      });

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password123');

      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-info': 'pgn-web-client',
          'User-Agent': 'pgn-admin-dashboard/1.0.0',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });

    it('should make correct API call to logout endpoint', async () => {
      // First login with a token (employee-style) to test logout API call
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            employee: mockUser,
            token: 'mock-token' // Provide a token to test API call
          }
        })
      });

      const store = useAuthStore.getState();

      // Manually set state with token to simulate employee login
      // (even though web dashboard would normally reject this)
      useAuthStore.setState({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isAdmin: false,
        isLoading: false,
      });

      // Reset fetch mock to track logout call
      (fetch as jest.Mock).mockReset();

      // Mock the logout response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      await store.logout();

      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-info': 'pgn-web-client',
          'User-Agent': 'pgn-admin-dashboard/1.0.0',
          'Authorization': 'Bearer mock-token',
        },
        signal: expect.any(AbortSignal),
      });
    });
  });
});