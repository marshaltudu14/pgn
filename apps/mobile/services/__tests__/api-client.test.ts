import { ApiClient, ApiError } from '../api-client';
import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  LogoutResponse,
  AuthenticatedUser
} from '@pgn/shared';

// Import the module and mock it
import * as apiModule from '@/constants/api';

// Mock fetch
global.fetch = jest.fn();
jest.mock('@/constants/api', () => ({
  ...apiModule,
  buildApiUrl: jest.fn((endpoint: string) => `http://localhost:3000/api${endpoint}`),
  getApiHeaders: jest.fn(() => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-client-info': 'pgn-mobile-client',
    'User-Agent': 'PGN-Mobile/1.0',
  })),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock constants
const mockBuildApiUrl = jest.fn((endpoint: string) => `https://api.test.com${endpoint}`);
const mockGetApiHeaders = jest.fn(() => ({
  'Content-Type': 'application/json',
  'User-Agent': 'PGN-Mobile/1.0.0',
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://api.test.com',
  API_ENDPOINTS: {
    LOGIN: '/auth/login',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GET_USER: '/auth/user',
  },
  buildApiUrl: mockBuildApiUrl,
  getApiHeaders: mockGetApiHeaders,
}));

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      json: async () => ({}),
      text: async () => '{}',
    } as Response);

    apiClient = new ApiClient();

    // Reset mock functions
    mockBuildApiUrl.mockClear();
    mockGetApiHeaders.mockClear();
    mockBuildApiUrl.mockImplementation((endpoint: string) => `https://api.test.com${endpoint}`);
    mockGetApiHeaders.mockReturnValue({
      'Content-Type': 'application/json',
      'User-Agent': 'PGN-Mobile/1.0.0',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('should accept custom config', () => {
      const customClient = new ApiClient({
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 500,
      });

      expect(customClient).toBeInstanceOf(ApiClient);
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: LoginResponse = {
        message: 'Login successful',
        token: 'mock-jwt-token',
        employee: {
          id: 'test-user-id',
          humanReadableId: 'PGN-2024-0001',
          fullName: 'Test User',
          email: 'test@example.com',
          employmentStatus: 'ACTIVE',
          canLogin: true,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => expectedResponse,
      } as Response);

      const result = await apiClient.login(credentials);

      expect(result).toEqual(expectedResponse);
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/auth/login');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        })
      );
    });

    it('should handle login API error', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const errorResponse: ApiError = {
        error: 'Unauthorized',
        message: 'Invalid credentials',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => errorResponse,
      } as Response);

      await expect(apiClient.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network error', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(apiClient.login(credentials)).rejects.toThrow('Network Error');
    });
  });

  describe('Refresh Token', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'refresh-token';
      const expectedResponse: RefreshResponse = {
        token: 'new-jwt-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => expectedResponse,
      } as Response);

      const result = await apiClient.refreshToken(refreshToken);

      expect(result).toEqual(expectedResponse);
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/auth/refresh');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: refreshToken } as RefreshRequest),
        })
      );
    });

    it('should handle refresh token error', async () => {
      const refreshToken = 'invalid-token';

      const errorResponse: ApiError = {
        error: 'InvalidToken',
        message: 'Refresh token is invalid',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => errorResponse,
      } as Response);

      await expect(apiClient.refreshToken(refreshToken)).rejects.toThrow('Refresh token is invalid');
    });
  });

  describe('Logout', () => {
    it('should successfully logout', async () => {
      const authToken = 'auth-token';
      const expectedResponse: LogoutResponse = {
        message: 'Logged out successfully',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => expectedResponse,
      } as Response);

      const result = await apiClient.logout(authToken);

      expect(result).toEqual(expectedResponse);
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/auth/logout');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ token: authToken } as LogoutRequest),
        })
      );
    });

    it('should handle logout error', async () => {
      const authToken = 'invalid-token';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => ({
          error: 'Unauthorized',
          message: 'Invalid token',
        }),
      } as Response);

      await expect(apiClient.logout(authToken)).rejects.toThrow('Invalid token');
    });
  });

  describe('Get Current User', () => {
    it('should successfully get current user', async () => {
      const token = 'valid-token';
      const expectedUser: AuthenticatedUser = {
        id: 'test-user-id',
        humanReadableId: 'PGN-2024-0001',
        fullName: 'Test User',
        email: 'test@example.com',
        employmentStatus: 'ACTIVE',
        canLogin: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => expectedUser,
      } as Response);

      const result = await apiClient.getCurrentUser(token);

      expect(result).toEqual(expectedUser);
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/auth/user');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/user',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should handle get current user error', async () => {
      const token = 'invalid-token';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => ({
          error: 'Unauthorized',
          message: 'Invalid token',
        }),
      } as Response);

      await expect(apiClient.getCurrentUser(token)).rejects.toThrow('Invalid token');
    });
  });

  describe('Check Connectivity', () => {
    it('should successfully check connectivity', async () => {
      // Connectivity check expects 405 Method Not Allowed
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405,
        headers: new Headers(),
        json: async () => ({}),
      } as Response);

      const result = await apiClient.checkConnectivity();

      expect(result).toBe(true);
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/auth/login');
    });

    it('should handle connectivity check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await apiClient.checkConnectivity();

      expect(result).toBe(false);
    });
  });

  describe('Get Config', () => {
    it('should return current configuration', () => {
      const config = apiClient.getConfig();

      expect(config).toEqual({
        baseURL: 'https://api.test.com',
        timeout: 15000,
        retryAttempts: 3,
        retryDelay: 1000,
      });
    });

    it('should return custom configuration', () => {
      const customClient = new ApiClient({
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 500,
      });

      const config = customClient.getConfig();

      expect(config).toEqual({
        baseURL: 'https://api.test.com',
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 500,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON response', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: async () => {
          throw new Error('Unexpected end of JSON input');
        },
      } as unknown as Response);

      await expect(apiClient.login(credentials)).rejects.toThrow('Unexpected end of JSON input');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      // First attempt fails with network error, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
          json: async () => ({
            message: 'Login successful',
            token: 'mock-jwt-token',
            employee: {
              id: 'test-user-id',
              humanReadableId: 'PGN-2024-0001',
              fullName: 'Test User',
              email: 'test@example.com',
              employmentStatus: 'ACTIVE',
              canLogin: true,
            },
          }),
        } as Response);

      jest.useFakeTimers();

      const promise = apiClient.login(credentials);

      // Fast forward through retry delay
      jest.advanceTimersByTime(1000);

      const result = await promise;

      expect(result).toBeDefined();
      expect(result.token).toBe('mock-jwt-token');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});