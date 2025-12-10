import { api, checkApiConnectivity } from '../api-client';
import { SessionManager } from '@/utils/auth-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock useAuth store
const mockAuthState = {
  session: null,
  isTokenExpired: jest.fn(() => false),
  refreshToken: jest.fn(),
  clearSession: jest.fn(),
};

jest.mock('@/store/auth-store', () => ({
  useAuth: {
    getState: () => mockAuthState,
  },
}));

// Create typed mocks for SessionManager
const mockLoadSession = jest.mocked(SessionManager.loadSession);
const mockSaveSession = jest.mocked(SessionManager.saveSession);
const mockClearSession = jest.mocked(SessionManager.clearSession);
const mockIsSessionExpired = jest.mocked(SessionManager.isSessionExpired);

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock SessionManager with proper session management
jest.mock('@/utils/auth-utils', () => ({
  SessionManager: {
    loadSession: jest.fn(),
    saveSession: jest.fn(),
    clearSession: jest.fn(),
    isSessionExpired: jest.fn(() => false),
  },
}));

describe('API Client', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();

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

    // Set up authenticated session for private endpoints
    (mockAuthState as any).session = {
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
    };
    mockAuthState.isTokenExpired.mockReturnValue(false);

    // Mock SessionManager to return a valid session
    mockLoadSession.mockResolvedValue({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600, // 1 hour in seconds
      expiresAt: Date.now() + 3600000, // 1 hour from now
    });
    mockIsSessionExpired.mockReturnValue(false);
  });

  describe('API Methods', () => {
    it('should make GET requests', async () => {
      const testData = { id: 1, name: 'Test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => testData,
      } as Response);

      const result = await api.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should make POST requests', async () => {
      const requestData = { name: 'Test' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => responseData,
      } as Response);

      const result = await api.post('/test', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should make PUT requests', async () => {
      const requestData = { id: 1, name: 'Updated' };
      const responseData = { ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => responseData,
      } as Response);

      const result = await api.put('/test/1', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      } as Response);

      const result = await api.delete('/test/1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should make PATCH requests', async () => {
      const requestData = { name: 'Updated' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => responseData,
      } as Response);

      const result = await api.patch('/test/1', requestData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 errors', async () => {
      // Mock SessionManager to return no session so it doesn't try to refresh token
      mockLoadSession.mockResolvedValueOnce(null);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      const result = await api.get('/protected');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active session. Please login again.');
      expect(mockClearSession).not.toHaveBeenCalled(); // Clear session not called if no session exists
    });

    it('should handle 403 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Forbidden' }),
      } as Response);

      const result = await api.get('/forbidden');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied. You don\'t have permission to perform this action.');
    });

    it('should handle 429 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Too Many Requests' }),
      } as Response);

      const result = await api.get('/rate-limited');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many requests. Please wait before trying again.');
    });

    it('should handle 500 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      const result = await api.get('/error');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error. Please try again later.');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await api.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Please check your internet connection');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await api.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('took too long');
    });
  });

  describe('Connectivity Check', () => {
    it('should check API connectivity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405, // Method not allowed is expected for HEAD request
        headers: new Headers(),
      } as Response);

      const result = await checkApiConnectivity();

      expect(result).toBe(true);
    });

    it('should handle connectivity check failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      const result = await checkApiConnectivity();

      expect(result).toBe(false);
    });
  });

  describe('Headers and Client Info', () => {
    it('should include client info in requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      await api.get('/test');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers;

      expect(headers).toHaveProperty('x-client-info');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('Accept', 'application/json');
    });
  });
});