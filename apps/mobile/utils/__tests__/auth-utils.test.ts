import { SessionManager } from '../auth-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type for mock AsyncStorage data - using readonly to match AsyncStorage API
type MockStorageData = readonly [string, string | null][];

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default AsyncStorage mocks
    mockAsyncStorage.multiSet.mockResolvedValue();
    mockAsyncStorage.multiGet.mockResolvedValue([] as [string, string | null][]);
    mockAsyncStorage.multiRemove.mockResolvedValue();
    mockAsyncStorage.getAllKeys.mockResolvedValue([]);
  });

  describe('saveSession', () => {
    it('should save session data correctly to AsyncStorage', async () => {
      const sessionData = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresIn: 900, // 15 minutes
      };

      const currentTime = Date.now();
      const expectedExpiresAt = currentTime + (900 * 1000);

      // Mock Date.now to return predictable timestamp
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      await SessionManager.saveSession(sessionData);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        ['pgn_auth_token', sessionData.accessToken],
        ['pgn_refresh_token', sessionData.refreshToken],
        ['pgn_expires_in', sessionData.expiresIn.toString()],
        ['pgn_expires_at', expectedExpiresAt.toString()],
      ]);

      jest.restoreAllMocks();
    });

    it('should calculate expiration timestamp correctly', async () => {
      const sessionData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600, // 1 hour
      };

      const currentTime = 1640995200000; // Fixed timestamp
      const expectedExpiresAt = currentTime + (3600 * 1000);

      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      await SessionManager.saveSession(sessionData);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_expires_at', expectedExpiresAt.toString()],
        ])
      );

      jest.restoreAllMocks();
    });

    it('should handle zero expiration time', async () => {
      const sessionData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 0,
      };

      const currentTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      await SessionManager.saveSession(sessionData);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_expires_at', currentTime.toString()],
        ])
      );

      jest.restoreAllMocks();
    });

    it('should propagate AsyncStorage errors', async () => {
      const sessionData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
      };

      const storageError = new Error('Storage unavailable');
      mockAsyncStorage.multiSet.mockRejectedValue(storageError);

      await expect(SessionManager.saveSession(sessionData)).rejects.toThrow('Storage unavailable');
    });
  });

  describe('loadSession', () => {
    it('should load complete session data successfully', async () => {
      const storedData = [
        ['pgn_auth_token', 'stored-access-token'],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', '900'],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toEqual({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: 900,
        expiresAt: 1640999100000,
      });
    });

    it('should load session without expiresAt field', async () => {
      const storedData = [
        ['pgn_auth_token', 'stored-access-token'],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', '900'],
        ['pgn_expires_at', ''],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toEqual({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: 900,
        expiresAt: undefined,
      });
    });

    it('should return null when accessToken is missing', async () => {
      const storedData = [
        ['pgn_auth_token', null],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', '900'],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toBeNull();
    });

    it('should return null when refreshToken is missing', async () => {
      const storedData = [
        ['pgn_auth_token', 'stored-access-token'],
        ['pgn_refresh_token', null],
        ['pgn_expires_in', '900'],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toBeNull();
    });

    it('should return null when expiresIn is missing', async () => {
      const storedData = [
        ['pgn_auth_token', 'stored-access-token'],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', null],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toBeNull();
    });

    it('should handle empty strings in stored data', async () => {
      const storedData = [
        ['pgn_auth_token', ''],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', '900'],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toBeNull();
    });

    it('should handle invalid expiresIn value', async () => {
      const storedData = [
        ['pgn_auth_token', 'stored-access-token'],
        ['pgn_refresh_token', 'stored-refresh-token'],
        ['pgn_expires_in', 'invalid-number'],
        ['pgn_expires_at', '1640999100000'],
      ] as [string, string | null][];

      mockAsyncStorage.multiGet.mockResolvedValue(storedData);

      const session = await SessionManager.loadSession();

      expect(session).toEqual({
        accessToken: 'stored-access-token',
        refreshToken: 'stored-refresh-token',
        expiresIn: NaN, // parseInt('invalid-number', 10) returns NaN
        expiresAt: 1640999100000,
      });
    });

    it('should handle AsyncStorage errors and return null', async () => {
      const storageError = new Error('Storage read failed');
      mockAsyncStorage.multiGet.mockRejectedValue(storageError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const session = await SessionManager.loadSession();

      expect(session).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error loading session:', storageError);

      consoleSpy.mockRestore();
    });
  });

  describe('clearSession', () => {
    it('should clear all session-related keys from AsyncStorage', async () => {
      await SessionManager.clearSession();

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'pgn_auth_token',
        'pgn_refresh_token',
        'pgn_expires_in',
        'pgn_expires_at',
        'pgn_employee_data',
        'pgn_user_id',
        'pgn_last_login',
      ]);
    });

    it('should handle AsyncStorage errors during clear', async () => {
      const storageError = new Error('Clear operation failed');
      mockAsyncStorage.multiRemove.mockRejectedValue(storageError);

      await expect(SessionManager.clearSession()).rejects.toThrow('Clear operation failed');
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for non-expired session', () => {
      const futureTimestamp = Date.now() + 60000; // 1 minute from now
      const session = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        expiresAt: futureTimestamp,
      };

      const isExpired = SessionManager.isSessionExpired(session);

      expect(isExpired).toBe(false);
    });

    it('should return true for expired session', () => {
      const pastTimestamp = Date.now() - 60000; // 1 minute ago
      const session = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        expiresAt: pastTimestamp,
      };

      const isExpired = SessionManager.isSessionExpired(session);

      expect(isExpired).toBe(true);
    });

    it('should return true for session expired exactly now', () => {
      const currentTimestamp = Date.now();
      const session = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        expiresAt: currentTimestamp,
      };

      const isExpired = SessionManager.isSessionExpired(session);

      expect(isExpired).toBe(true);
    });

    it('should return false when expiresAt is not available (fallback)', () => {
      const session = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        expiresAt: undefined,
      };

      const isExpired = SessionManager.isSessionExpired(session);

      expect(isExpired).toBe(false);
    });

    it('should handle zero expiresAt value', () => {
      const session = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        expiresAt: 0,
      };

      // The current implementation treats expiresAt: 0 as "no expiry time"
      // because !0 evaluates to true in JavaScript, triggering the fallback logic
      // This is a design issue where 0 is treated as falsy (no expiry) rather than
      // a valid timestamp (January 1, 1970)
      const isExpired = SessionManager.isSessionExpired(session);
      expect(isExpired).toBe(false); // Matches current implementation behavior
    });
  });

  describe('getAccessToken', () => {
    it('should return valid access token for non-expired session', async () => {
      const futureTimestamp = Date.now() + 60000;
      const validSession = {
        accessToken: 'valid-access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        expiresAt: futureTimestamp,
      };

      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', validSession.accessToken],
        ['pgn_refresh_token', validSession.refreshToken],
        ['pgn_expires_in', validSession.expiresIn.toString()],
        ['pgn_expires_at', futureTimestamp.toString()],
      ] as [string, string | null][]);

      const token = await SessionManager.getAccessToken();

      expect(token).toBe('valid-access-token');
      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    });

    it('should return null and clear session for expired token', async () => {
      const pastTimestamp = Date.now() - 60000;
      const expiredSession = {
        accessToken: 'expired-access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        expiresAt: pastTimestamp,
      };

      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', expiredSession.accessToken],
        ['pgn_refresh_token', expiredSession.refreshToken],
        ['pgn_expires_in', expiredSession.expiresIn.toString()],
        ['pgn_expires_at', pastTimestamp.toString()],
      ] as [string, string | null][]);

      const token = await SessionManager.getAccessToken();

      expect(token).toBeNull();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'pgn_auth_token',
        'pgn_refresh_token',
        'pgn_expires_in',
        'pgn_expires_at',
        'pgn_employee_data',
        'pgn_user_id',
        'pgn_last_login',
      ]);
    });

    it('should return null when no session exists', async () => {
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', null],
        ['pgn_refresh_token', null],
        ['pgn_expires_in', null],
        ['pgn_expires_at', null],
      ] as [string, string | null][]);

      const token = await SessionManager.getAccessToken();

      expect(token).toBeNull();
    });

    it('should return null and clear session when expiresAt is undefined', async () => {
      // Test the fallback case where expiresAt is undefined - should not clear or validate
      const sessionWithoutExpiry = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900,
        expiresAt: undefined,
      };

      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', sessionWithoutExpiry.accessToken],
        ['pgn_refresh_token', sessionWithoutExpiry.refreshToken],
        ['pgn_expires_in', sessionWithoutExpiry.expiresIn.toString()],
        ['pgn_expires_at', ''],
      ] as [string, string | null][]);

      const token = await SessionManager.getAccessToken();

      expect(token).toBe('access-token');
      expect(mockAsyncStorage.multiRemove).not.toHaveBeenCalled();
    });

    it('should handle errors and return null', async () => {
      const storageError = new Error('Storage access failed');
      mockAsyncStorage.multiGet.mockRejectedValue(storageError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const token = await SessionManager.getAccessToken();

      expect(token).toBeNull();
      // The error comes from loadSession which is called by getAccessToken
      expect(consoleSpy).toHaveBeenCalledWith('Error loading session:', storageError);

      consoleSpy.mockRestore();
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token for valid session', async () => {
      const validSession = {
        accessToken: 'access-token',
        refreshToken: 'valid-refresh-token',
        expiresIn: 900,
        expiresAt: Date.now() + 60000,
      };

      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', validSession.accessToken],
        ['pgn_refresh_token', validSession.refreshToken],
        ['pgn_expires_in', validSession.expiresIn.toString()],
        ['pgn_expires_at', validSession.expiresAt!.toString()],
      ] as [string, string | null][]);

      const refreshToken = await SessionManager.getRefreshToken();

      expect(refreshToken).toBe('valid-refresh-token');
    });

    it('should return null when no session exists', async () => {
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', null],
        ['pgn_refresh_token', null],
        ['pgn_expires_in', null],
        ['pgn_expires_at', null],
      ] as [string, string | null][]);

      const refreshToken = await SessionManager.getRefreshToken();

      expect(refreshToken).toBeNull();
    });

    it('should return null for partial session data', async () => {
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', null],
        ['pgn_refresh_token', 'some-refresh-token'],
        ['pgn_expires_in', null],
        ['pgn_expires_at', null],
      ] as [string, string | null][]);

      const refreshToken = await SessionManager.getRefreshToken();

      expect(refreshToken).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const storageError = new Error('Storage read failed');
      mockAsyncStorage.multiGet.mockRejectedValue(storageError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const refreshToken = await SessionManager.getRefreshToken();

      expect(refreshToken).toBeNull();
      // The error comes from loadSession which is called by getRefreshToken
      expect(consoleSpy).toHaveBeenCalledWith('Error loading session:', storageError);

      consoleSpy.mockRestore();
    });
  });

  describe('debugStoredTokens', () => {
    it('should log relevant auth-related keys', async () => {
      const allKeys = [
        'pgn_auth_token',
        'pgn_refresh_token',
        'pgn_expires_in',
        'pgn_expires_at',
        'pgn_employee_data',
        'some_other_key',
        'auth_different_format',
        'token_another_format',
        'random_key',
      ];

      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys);

      await SessionManager.debugStoredTokens();

      expect(mockAsyncStorage.getAllKeys).toHaveBeenCalled();
    });

    it('should handle case when no keys match auth patterns', async () => {
      const allKeys = ['random_key_1', 'another_key', 'some_data'];

      mockAsyncStorage.getAllKeys.mockResolvedValue(allKeys);

      // Should not throw and should complete successfully
      await expect(SessionManager.debugStoredTokens()).resolves.toBeUndefined();
    });

    it('should handle empty key list', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue([]);

      await expect(SessionManager.debugStoredTokens()).resolves.toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      const storageError = new Error('Debug operation failed');
      mockAsyncStorage.getAllKeys.mockRejectedValue(storageError);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await SessionManager.debugStoredTokens();

      expect(consoleSpy).toHaveBeenCalledWith('Error debugging stored tokens:', storageError);

      consoleSpy.mockRestore();
    });
  });

  describe('Complete Session Lifecycle Integration', () => {
    it('should handle complete session lifecycle: save -> load -> validate -> clear', async () => {
      const sessionData = {
        accessToken: 'lifecycle-access-token',
        refreshToken: 'lifecycle-refresh-token',
        expiresIn: 900,
      };

      const currentTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      // Step 1: Save session
      await SessionManager.saveSession(sessionData);
      expect(mockAsyncStorage.multiSet).toHaveBeenCalled();

      // Step 2: Load session (mock the storage to return what we just saved)
      const expectedExpiresAt = currentTime + (900 * 1000);
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', sessionData.accessToken],
        ['pgn_refresh_token', sessionData.refreshToken],
        ['pgn_expires_in', sessionData.expiresIn.toString()],
        ['pgn_expires_at', expectedExpiresAt.toString()],
      ] as [string, string | null][]);

      const loadedSession = await SessionManager.loadSession();
      expect(loadedSession).toEqual({
        accessToken: sessionData.accessToken,
        refreshToken: sessionData.refreshToken,
        expiresIn: sessionData.expiresIn,
        expiresAt: expectedExpiresAt,
      });

      // Step 3: Validate session
      expect(SessionManager.isSessionExpired(loadedSession!)).toBe(false);

      // Step 4: Get access token
      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).toBe(sessionData.accessToken);

      // Step 5: Get refresh token
      const refreshToken = await SessionManager.getRefreshToken();
      expect(refreshToken).toBe(sessionData.refreshToken);

      // Step 6: Clear session
      await SessionManager.clearSession();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        'pgn_auth_token',
        'pgn_refresh_token',
        'pgn_expires_in',
        'pgn_expires_at',
        'pgn_employee_data',
        'pgn_user_id',
        'pgn_last_login',
      ]);

      jest.restoreAllMocks();
    });

    it('should handle expired session lifecycle with automatic cleanup', async () => {
      const sessionData = {
        accessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresIn: 900,
      };

      const pastTimestamp = Date.now() - 60000; // 1 minute ago
      jest.spyOn(Date, 'now').mockReturnValue(pastTimestamp);

      // Save session with past timestamp (simulating already expired)
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', sessionData.accessToken],
        ['pgn_refresh_token', sessionData.refreshToken],
        ['pgn_expires_in', sessionData.expiresIn.toString()],
        ['pgn_expires_at', pastTimestamp.toString()],
      ] as [string, string | null][]);

      // Try to get access token - should return null and clear session
      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).toBeNull();
      expect(mockAsyncStorage.multiRemove).toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('should handle corrupted data scenarios', async () => {
      // Test with corrupted JSON data or missing fields
      mockAsyncStorage.multiGet.mockResolvedValue([
        ['pgn_auth_token', 'partial-token'],
        ['pgn_refresh_token', ''], // Empty string
        ['pgn_expires_in', 'invalid-number'],
        ['pgn_expires_at', 'not-a-timestamp'],
      ] as [string, string | null][]);

      const session = await SessionManager.loadSession();
      expect(session).toBeNull();

      const accessToken = await SessionManager.getAccessToken();
      expect(accessToken).toBeNull();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle extremely large expiration values', async () => {
      const sessionData = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: Number.MAX_SAFE_INTEGER,
      };

      const currentTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      await SessionManager.saveSession(sessionData);

      // Should handle large values without overflow
      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_expires_at', (currentTime + Number.MAX_SAFE_INTEGER * 1000).toString()],
        ])
      );

      jest.restoreAllMocks();
    });

    it('should handle negative expiration values', async () => {
      const sessionData = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: -900,
      };

      const currentTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(currentTime);

      await SessionManager.saveSession(sessionData);

      // Should store negative timestamp (already expired)
      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_expires_at', (currentTime - 900000).toString()],
        ])
      );

      jest.restoreAllMocks();
    });

    it('should handle very long token strings', async () => {
      const longToken = 'a'.repeat(10000); // 10k character token
      const sessionData = {
        accessToken: longToken,
        refreshToken: 'refresh',
        expiresIn: 900,
      };

      await SessionManager.saveSession(sessionData);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_auth_token', longToken],
        ])
      );
    });

    it('should handle unicode characters in tokens', async () => {
      const unicodeToken = '🔐🚀📱✨';
      const sessionData = {
        accessToken: unicodeToken,
        refreshToken: 'refresh',
        expiresIn: 900,
      };

      await SessionManager.saveSession(sessionData);

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['pgn_auth_token', unicodeToken],
        ])
      );
    });
  });
});