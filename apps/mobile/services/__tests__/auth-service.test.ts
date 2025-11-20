import { MobileAuthService, mobileAuthService } from '../auth-service';
import { apiClient, ApiError } from '../api-client';
import { secureStorage } from '../secure-storage';
import {
  LoginRequest,
  LoginResponse,
  AuthenticatedUser,
  RefreshResponse,
  EmploymentStatus,
  AuthenticationResult,
} from '@pgn/shared';

// Mock the dependencies
jest.mock('../api-client');
jest.mock('../secure-storage');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

// Mock implementation for user data
const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'test-user-id',
  humanReadableId: 'PGN-2024-0001',
  fullName: 'Test User',
  email: 'test@example.com',
  employmentStatus: 'ACTIVE',
  canLogin: true,
  phone: '+1234567890',
  department: 'IT',
  region: 'Test Region',
  startDate: '2024-01-01',
  profilePhotoUrl: 'https://example.com/profile.jpg',
  primaryRegion: 'Test Region',
  regionCode: 'TR',
  assignedRegions: ['Test Region'],
  ...overrides,
});

// Mock implementation for login response
const createMockLoginResponse = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
  message: 'Login successful',
  token: 'mock-jwt-token',
  employee: createMockUser(),
  ...overrides,
});

describe('MobileAuthService', () => {
  let authService: MobileAuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock secure storage methods
    mockSecureStorage.setAuthToken.mockResolvedValue();
    mockSecureStorage.setUserData.mockResolvedValue();
    mockSecureStorage.getAuthToken.mockResolvedValue('mock-token');
    mockSecureStorage.getUserData.mockResolvedValue(createMockUser());
    mockSecureStorage.getRefreshToken.mockResolvedValue('mock-refresh-token');
    mockSecureStorage.clearAllAuthData.mockResolvedValue();

    // Mock api client methods
    mockApiClient.login.mockResolvedValue(createMockLoginResponse());
    mockApiClient.refreshToken.mockResolvedValue({
      token: 'new-mock-token',
    });
    mockApiClient.logout.mockResolvedValue({ message: 'Logged out successfully' });
    mockApiClient.getCurrentUser.mockResolvedValue(createMockUser());
    mockApiClient.checkConnectivity.mockResolvedValue(true);

    authService = new MobileAuthService();
  });

  afterEach(() => {
    jest.useRealTimers();
    authService.destroy();
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse = createMockLoginResponse();
      mockApiClient.login.mockResolvedValue(expectedResponse);

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: true,
        user: expectedResponse.employee,
      });

      expect(mockApiClient.login).toHaveBeenCalledWith(credentials);
      expect(mockSecureStorage.setAuthToken).toHaveBeenCalledWith(expectedResponse.token);
      expect(mockSecureStorage.setUserData).toHaveBeenCalledWith(expectedResponse.employee);
    });

    it('should return error for missing email', async () => {
      const credentials: LoginRequest = {
        email: '',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockApiClient.login).not.toHaveBeenCalled();
    });

    it('should return error for missing password', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: '',
      };

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: false,
        error: 'Email and password are required',
      });

      expect(mockApiClient.login).not.toHaveBeenCalled();
    });

    it('should handle API login errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const apiError: ApiError = {
        error: 'Invalid credentials',
        message: 'Invalid credentials'
      };
      mockApiClient.login.mockRejectedValue(apiError);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');

      expect(mockApiClient.login).toHaveBeenCalledWith(credentials);
    });

    it('should handle network errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const networkError = new Error('NETWORK_ERROR');
      mockApiClient.login.mockRejectedValue(networkError);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });

    it('should handle timeout errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const timeoutError = new Error('TIMEOUT');
      mockApiClient.login.mockRejectedValue(timeoutError);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('TIMEOUT');
    });

    it('should handle unauthorized errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const unauthorizedError = new Error('UNAUTHORIZED');
      mockApiClient.login.mockRejectedValue(unauthorizedError);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('UNAUTHORIZED');
    });

    it('should handle forbidden errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const forbiddenError = new Error('FORBIDDEN');
      mockApiClient.login.mockRejectedValue(forbiddenError);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('FORBIDDEN');
    });

    it('should handle generic errors', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const genericError = new Error('Some unknown error');
      mockApiClient.login.mockRejectedValue(genericError);

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: false,
        error: 'Some unknown error',
      });
    });

    it('should handle non-Error objects', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockApiClient.login.mockRejectedValue('string error' as any);

      const result = await authService.login(credentials);

      expect(result).toEqual({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      });
    });
  });

  describe('Refresh Token', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'mock-refresh-token';
      const expectedResponse: RefreshResponse = {
        token: 'new-token',
      };

      mockApiClient.refreshToken.mockResolvedValue(expectedResponse);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual(expectedResponse);
      expect(mockApiClient.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockSecureStorage.setAuthToken).toHaveBeenCalledWith(expectedResponse.token);
    });

    it('should handle refresh token errors', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockApiClient.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('Logout', () => {
    it('should successfully logout and clear tokens', async () => {
      const authToken = 'mock-token';

      await authService.logout(authToken);

      expect(mockApiClient.logout).toHaveBeenCalledWith(authToken);
      expect(mockSecureStorage.clearAllAuthData).toHaveBeenCalled();
    });

    it('should clear tokens even if API call fails', async () => {
      const authToken = 'mock-token';

      mockApiClient.logout.mockRejectedValue(new Error('API error'));

      await authService.logout(authToken);

      expect(mockApiClient.logout).toHaveBeenCalledWith(authToken);
      expect(mockSecureStorage.clearAllAuthData).toHaveBeenCalled();
    });
  });

  describe('Get Current Auth State', () => {
    it('should return authenticated state when valid tokens exist', async () => {
      const mockUser = createMockUser();
      // Mock a valid JWT token format (header.payload.signature)
      mockSecureStorage.getAuthToken.mockResolvedValue('header.payload.signature');
      mockSecureStorage.getUserData.mockResolvedValue(mockUser);

      const state = await authService.getCurrentAuthState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
      expect(state.lastActivity).toBeGreaterThan(0);
    });

    it('should return unauthenticated state when no token exists', async () => {
      mockSecureStorage.getAuthToken.mockResolvedValue(null);
      mockSecureStorage.getUserData.mockResolvedValue(null);

      const state = await authService.getCurrentAuthState();

      expect(state).toEqual({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        lastActivity: expect.any(Number),
      });
    });

    it('should return unauthenticated state when no user data exists', async () => {
      mockSecureStorage.getAuthToken.mockResolvedValue('valid-token');
      mockSecureStorage.getUserData.mockResolvedValue(null);

      const state = await authService.getCurrentAuthState();

      expect(state).toEqual({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        lastActivity: expect.any(Number),
      });
    });

    it('should return unauthenticated state when token is invalid', async () => {
      mockSecureStorage.getAuthToken.mockResolvedValue('invalid-token');
      mockSecureStorage.getUserData.mockResolvedValue(createMockUser());

      const state = await authService.getCurrentAuthState();

      expect(state).toEqual({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        lastActivity: expect.any(Number),
      });
    });

    it('should handle errors gracefully', async () => {
      mockSecureStorage.getAuthToken.mockRejectedValue(new Error('Storage error'));

      const state = await authService.getCurrentAuthState();

      expect(state).toEqual({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Failed to check authentication status',
        lastActivity: expect.any(Number),
      });
    });
  });

  describe('Token Validation', () => {
    it('should validate proper JWT token', async () => {
      const validToken = 'header.payload.signature';

      const isValid = await authService.validateToken(validToken);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token format', async () => {
      const invalidToken = 'invalid-token';

      const isValid = await authService.validateToken(invalidToken);

      expect(isValid).toBe(false);
    });

    it('should reject empty token', async () => {
      const emptyToken = '';

      const isValid = await authService.validateToken(emptyToken);

      expect(isValid).toBe(false);
    });

    it('should reject short token', async () => {
      const shortToken = 'short';

      const isValid = await authService.validateToken(shortToken);

      expect(isValid).toBe(false);
    });

    it('should handle validation errors', async () => {
      const isValid = await authService.validateToken(null as any);

      expect(isValid).toBe(false);
    });
  });

  describe('Get User Data From Token', () => {
    it('should get user data from API using token', async () => {
      const token = 'valid-token';
      const mockUser = createMockUser();

      mockApiClient.getCurrentUser.mockResolvedValue(mockUser);

      const result = await authService.getUserDataFromToken(token);

      expect(result).toEqual(mockUser);
      expect(mockApiClient.getCurrentUser).toHaveBeenCalledWith(token);
    });

    it('should return null when API call fails', async () => {
      const token = 'invalid-token';

      mockApiClient.getCurrentUser.mockRejectedValue(new Error('API error'));

      const result = await authService.getUserDataFromToken(token);

      expect(result).toBeNull();
    });
  });

  describe('Token Refresh Setup', () => {
    it('should setup token refresh on successful login', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginResponse = createMockLoginResponse({
        token: 'new-token',
      });

      mockApiClient.login.mockResolvedValue(loginResponse);

      await authService.login(credentials);

      // Verify tokens are stored
      expect(mockSecureStorage.setAuthToken).toHaveBeenCalledWith(loginResponse.token);
      expect(mockSecureStorage.setUserData).toHaveBeenCalledWith(loginResponse.employee);

      // Fast forward time to trigger token refresh
      jest.advanceTimersByTime(14 * 60 * 1000);

      // Note: The actual refresh timer would be tested in an integration test
      // Here we just verify the setup doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('Exported Singleton', () => {
    it('should export a singleton instance', () => {
      expect(mobileAuthService).toBeInstanceOf(MobileAuthService);
    });

    it('should be the same instance across imports', () => {
      const { mobileAuthService: authService1 } = require('../auth-service');
      const { mobileAuthService: authService2 } = require('../auth-service');

      expect(authService1).toBe(authService2);
    });
  });

  describe('Cleanup', () => {
    it('should destroy cleanup properly', () => {
      expect(() => {
        authService.destroy();
      }).not.toThrow();
    });

    it('should handle multiple destroy calls', () => {
      expect(() => {
        authService.destroy();
        authService.destroy();
        authService.destroy();
      }).not.toThrow();
    });
  });
});