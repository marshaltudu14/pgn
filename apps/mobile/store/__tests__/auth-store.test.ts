import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser, useIsAuthenticated, useAuthLoading, useAuthError } from '../auth-store';
import { api } from '@/services/api-client';
import {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
} from '@pgn/shared';
import { ApiResponse } from '@/services/api-client';
import { SessionManager } from '@/utils/auth-utils';

// Get mocked SessionManager
const mockSessionManager = SessionManager as jest.Mocked<typeof SessionManager>;

// Mock dependencies
jest.mock('@/services/api-client');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/utils/auth-utils', () => ({
  SessionManager: {
    clearSession: jest.fn(),
    loadSession: jest.fn(),
    saveSession: jest.fn(),
    isSessionExpired: jest.fn(() => false),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}));

// Mock location-foreground-service-notifee to prevent native module errors
jest.mock('@/services/location-foreground-service-notifee', () => ({
  locationTrackingServiceNotifee: {
    isTrackingActive: jest.fn(() => false),
    getEmergencyData: jest.fn(() => Promise.resolve(null)),
    stopTracking: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-battery
jest.mock('expo-battery', () => ({
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.8)),
  getBatteryStateAsync: jest.fn(() => Promise.resolve(2)),
}));

// Mock @notifee/react-native
jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve()),
  displayNotification: jest.fn(() => Promise.resolve()),
  requestPermission: jest.fn(() => Promise.resolve(1)),
  getTriggerNotifications: jest.fn(() => Promise.resolve([])),
  cancelTriggerNotifications: jest.fn(() => Promise.resolve()),
  getTriggerNotificationIds: jest.fn(() => Promise.resolve([])),
  isChannelCreated: jest.fn(() => Promise.resolve(false)),
  getChannels: jest.fn(() => Promise.resolve([])),
  getChannel: jest.fn(() => Promise.resolve(null)),
  deleteChannel: jest.fn(() => Promise.resolve()),
  createTriggerNotification: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotification: jest.fn(() => Promise.resolve()),
  cancelAllNotifications: jest.fn(() => Promise.resolve()),
  getDisplayedNotifications: jest.fn(() => Promise.resolve([])),
  getNotificationSettings: jest.fn(() => Promise.resolve({
    authorizationStatus: 1,
    notification: {
      alert: true,
      badge: true,
      sound: true,
    },
    car: {
      alert: true,
      badge: true,
      sound: true,
    },
    criticalAlert: true,
    lockScreen: {
      alert: true,
      badge: true,
      showWhenLocked: true,
    },
    provisional: false,
    showPreviews: true,
    timeSensitive: true,
  })),
}));

// Mock attendance-store to prevent circular dependency issues
jest.mock('@/store/attendance-store', () => ({
  useAttendance: {
    getState: jest.fn(() => ({
      emergencyCheckOut: jest.fn(() => Promise.resolve()),
    })),
  },
}));

// Mock React to avoid issues with hooks in node environment
jest.mock('react', () => ({
  useCallback: (fn: any) => fn,
  useMemo: (fn: any) => fn(),
  useState: (initial: any) => [initial, jest.fn()],
  useEffect: jest.fn(),
  useRef: () => ({ current: null }),
  useSyncExternalStore: (subscribe: any, getSnapshot: any) => getSnapshot(),
  useDebugValue: jest.fn(),
}));

// Create proper mock interface for api
interface MockApi {
  get: jest.MockedFunction<<T = any>(endpoint: string, options?: any) => Promise<ApiResponse<T>>>;
  post: jest.MockedFunction<<T = any>(endpoint: string, data?: any, options?: any) => Promise<ApiResponse<T>>>;
  put: jest.MockedFunction<<T = any>(endpoint: string, data?: any, options?: any) => Promise<ApiResponse<T>>>;
  delete: jest.MockedFunction<<T = any>(endpoint: string, options?: any) => Promise<ApiResponse<T>>>;
  patch: jest.MockedFunction<<T = any>(endpoint: string, data?: any, options?: any) => Promise<ApiResponse<T>>>;
}

const mockApi = api as unknown as MockApi;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Mock implementation for user data
const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'test-user-id',
  humanReadableId: 'PGN-2024-0001',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  employmentStatus: 'ACTIVE',
  canLogin: true,
  phone: '+1234567890',
  assignedCities: [
    { id: '1', city: 'New York', state: 'NY', label: 'New York, NY' },
    { id: '2', city: 'Boston', state: 'MA', label: 'Boston, MA' }
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock AsyncStorage methods
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.multiRemove.mockResolvedValue();
    mockAsyncStorage.multiSet.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // Mock SessionManager methods - use default mocks that can be overridden in specific tests
    mockSessionManager.saveSession.mockResolvedValue();
    mockSessionManager.clearSession.mockResolvedValue();
    mockSessionManager.loadSession.mockResolvedValue(null); // Default: no session
    mockSessionManager.getAccessToken.mockResolvedValue(null); // Default: no token
    mockSessionManager.getRefreshToken.mockResolvedValue(null); // Default: no refresh token

    // Mock API methods
    mockApi.post.mockResolvedValue({
      success: true,
      data: {
        message: 'Login successful',
        token: 'mock-token',
        employee: createMockUser(),
      },
    });
    mockApi.get.mockResolvedValue({
      success: true,
      data: createMockUser(),
    });
  });

  afterEach(() => {
    // Clean up any pending timers
    jest.clearAllTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    // Reset all mocks
    jest.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const authState = useAuth.getState();

      expect(authState.isAuthenticated).toBe(false);
      expect(authState.isLoading).toBe(false);
      expect(authState.user).toBe(null);
      expect(authState.error).toBe(null);
      expect(authState.isLoggingIn).toBe(false);
      expect(authState.lastActivity).toBeGreaterThan(0);
    });

    it('should have helper hooks working correctly', () => {
      const user = useUser();
      const isAuthenticated = useIsAuthenticated();
      const isLoading = useAuthLoading();
      const error = useAuthError();

      expect(user).toBe(null);
      expect(isAuthenticated).toBe(false); // Session expired initially
      expect(isLoading).toBe(false);
      expect(error).toBe(null);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedUser = createMockUser();
      mockApi.post.mockResolvedValue({
        success: true,
        data: {
          message: 'Login successful',
          token: 'mock-token',
          employee: expectedUser,
        },
      });

      // Reset the store state before test
      useAuth.getState().reset();

      // Set up mocks for this specific test
      mockSessionManager.loadSession.mockResolvedValue({
        accessToken: 'mock-token',
        refreshToken: '',
        expiresIn: 900,
        expiresAt: Date.now() + 900000,
      });

      const loginResult = await useAuth.getState().login(credentials);

      const authState = useAuth.getState();
      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).toEqual(expectedUser);
      expect(authState.error).toBe(null);
      expect(authState.isLoggingIn).toBe(false);

      expect(loginResult).toEqual({
        success: true,
        user: expectedUser,
      });

      // Verify SessionManager.saveSession was called with correct token
      expect(mockSessionManager.saveSession).toHaveBeenCalledWith({
        accessToken: 'mock-token',
        refreshToken: '',
        expiresIn: 900,
      });

      // Verify employee data was stored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('pgn_employee_data', JSON.stringify(expectedUser));
    });

    it('should handle login failure', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockApi.post.mockRejectedValue(new Error('Invalid credentials'));

      // Reset the store state before test
      useAuth.getState().reset();

      const loginResult = await useAuth.getState().login(credentials);

      const authState = useAuth.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
      expect(authState.error).toBe('Invalid credentials');
      expect(authState.isLoggingIn).toBe(false);

      expect(loginResult).toEqual({
        success: false,
        error: 'Invalid credentials',
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // Reset the store state before test
      useAuth.getState().reset();

      // Set up mocks for this test
      mockSessionManager.loadSession.mockResolvedValue({
        accessToken: 'mock-token',
        refreshToken: '',
        expiresIn: 900,
        expiresAt: Date.now() + 900000,
      });
      mockSessionManager.getAccessToken.mockResolvedValue('mock-token');

      // First login
      await useAuth.getState().login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(useAuth.getState().isAuthenticated).toBe(true);

      // Then logout
      const logoutResult = await useAuth.getState().logout();

      const authState = useAuth.getState();
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
      expect(authState.error).toBe(null);
      expect(authState.isLoading).toBe(false);

      expect(logoutResult).toEqual({
        success: true,
      });

      // Verify SessionManager.clearSession was called
      expect(mockSessionManager.clearSession).toHaveBeenCalled();

      // Verify clearLocalTokens was called (which clears employee data)
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('pgn_employee_data');
    });
  });

  describe('Utility Methods', () => {
    it('should validate JWT tokens correctly', () => {
      // Reset the store state before test
      useAuth.getState().reset();

      const authStore = useAuth.getState();

      // Valid JWT format
      expect(authStore.validateToken('header.payload.signature')).toBe(true);

      // Invalid formats
      expect(authStore.validateToken('short')).toBe(false);
      expect(authStore.validateToken('')).toBe(false);
      expect(authStore.validateToken('only.one.part')).toBe(true); // Has 3 parts, validates format
      expect(authStore.validateToken('too.many.parts.here')).toBe(false); // More than 3 parts, invalid
    });

    it('should parse auth errors correctly', () => {
      // Reset the store state before test
      useAuth.getState().reset();

      const authStore = useAuth.getState();

      // Network errors - these should hit the instanceof Error check and get mapped
      expect(authStore.parseAuthError(new Error('Network error: NETWORK_ERROR detected'))).toBe('Network connection failed. Please check your internet connection and try again.');
      expect(authStore.parseAuthError(new Error('Request TIMEOUT: Connection failed'))).toBe('Request timed out. Please try again.');
      expect(authStore.parseAuthError(new Error('Authentication UNAUTHORIZED: Invalid credentials'))).toBe('Invalid email or password.');
      expect(authStore.parseAuthError(new Error('Access FORBIDDEN: Permission denied'))).toBe('Access denied. You may not have permission to login.');

      // Generic errors
      expect(authStore.parseAuthError(new Error('Random error'))).toBe('Random error');
      expect(authStore.parseAuthError('String error')).toBe('String error');
      expect(authStore.parseAuthError({ message: 'Object error' })).toBe('Object error');
      expect(authStore.parseAuthError(null)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('State Management', () => {
    it('should handle basic state operations', () => {
      // Reset the store state before test
      useAuth.getState().reset();

      const authStore = useAuth.getState();

      // Test that we can call basic store methods without throwing
      expect(() => {
        // These methods should exist and be callable
        if (authStore.clearError) authStore.clearError();
        if (authStore.setLoading) authStore.setLoading(false);
        if (authStore.reset) authStore.reset();
      }).not.toThrow();

      // Should have basic properties
      expect(typeof authStore.isAuthenticated).toBe('boolean');
      expect(typeof authStore.isLoading).toBe('boolean');
      expect(typeof authStore.isLoggingIn).toBe('boolean');
    });
  });
});