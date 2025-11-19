import { apiClient, ApiError } from './api-client';
import { secureStorage } from './secure-storage';
import {
  LoginRequest,
  LoginResponse,
  AuthenticatedUser,
  RefreshResponse,
  EmploymentStatus,
  AuthenticationResult,
} from '@pgn/shared';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  lastActivity: number;
}

export class MobileAuthService {
  private tokenRefreshPromise: Promise<string> | null = null;
  private tokenRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiration

  constructor() {
    this.initializeTokenRefresh();
  }

  // Main Authentication Methods
  async login(credentials: LoginRequest): Promise<AuthenticationResult> {
    try {
      // Validate input
      if (!credentials.email || !credentials.password) {
        return {
          success: false,
          error: 'Email and password are required',
        };
      }

      // Call API
      const response: LoginResponse = await apiClient.login(credentials);

      // Store tokens securely
      await Promise.all([
        secureStorage.setAuthToken(response.token),
        secureStorage.setUserData(response.employee),
      ]);

      // Setup token refresh
      this.setupTokenRefresh(response.token);

      return {
        success: true,
        user: response.employee,
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    try {
      const response: RefreshResponse = await apiClient.refreshToken(refreshToken);

      // Store new tokens
      await secureStorage.setAuthToken(response.token);

      this.setupTokenRefresh(response.token);

      return response;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }

  async logout(authToken: string): Promise<void> {
    try {
      // Call API to logout
      await apiClient.logout(authToken);
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
    } finally {
      // Always clear local tokens regardless of API success
      await this.clearLocalTokens();
    }
  }

  // State Management Methods
  async getCurrentAuthState(): Promise<AuthState> {
    try {
      const userData = await secureStorage.getUserData();
      const authToken = await secureStorage.getAuthToken();

      // If no token or user data, not authenticated
      if (!authToken || !userData) {
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          lastActivity: Date.now(),
        };
      }

      // Validate the token by making a lightweight API call
      // For now, we'll do basic token validation (in a real app, you might want to validate with the server)
      const isValidToken = await this.validateToken(authToken);

      if (!isValidToken) {
        // Clear invalid tokens
        await this.clearInvalidTokens();
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          lastActivity: Date.now(),
        };
      }

      return {
        isAuthenticated: true,
        isLoading: false,
        user: userData as AuthenticatedUser,
        error: null,
        lastActivity: Date.now(),
      };
    } catch (error) {
      console.error('❌ Failed to get auth state:', error);
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Failed to check authentication status',
        lastActivity: Date.now(),
      };
    }
  }

  // Utility Methods
  private parseAuthError(error: any): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message;
    }

    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('NETWORK_ERROR')) {
        return 'Network error. Please check your internet connection.';
      }

      if (error.message.includes('TIMEOUT')) {
        return 'Request timed out. Please try again.';
      }

      if (error.message.includes('UNAUTHORIZED')) {
        return 'Invalid email or password.';
      }

      if (error.message.includes('FORBIDDEN')) {
        return 'Access denied. You may not have permission to login.';
      }

      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Basic token structure validation
      if (!token || token.length < 10) {
        return false;
      }

      // In a production app, you would validate the JWT token here
      // For now, we'll just check if the token format looks reasonable
      const parts = token.split('.');
      return parts.length === 3; // JWT should have 3 parts
    } catch {
      return false;
    }
  }

  async getUserDataFromToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Get user data from API using the token
      const user = await apiClient.getCurrentUser(token);

      if (user) {
        return user;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get user data from token:', error);
      return null;
    }
  }

  private setupTokenRefresh(token: string): void {
    try {
      // Clear any existing timeout
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
      }

      // Schedule token refresh
      // This is a simplified implementation - in production you'd parse the JWT to get expiration time
      const refreshTime = 14 * 60 * 1000; // Refresh every 14 minutes

      this.tokenRefreshTimeout = setTimeout(async () => {
        try {
          const currentToken = await secureStorage.getRefreshToken();
          if (currentToken) {
            await this.refreshToken(currentToken);
          }
        } catch (error) {
          console.error('❌ Automatic token refresh failed:', error);
        }
      }, refreshTime);

    } catch (error) {
      console.error('❌ Failed to setup token refresh:', error);
    }
  }

  private async clearLocalTokens(): Promise<void> {
    try {
      await secureStorage.clearAllAuthData();
    } catch (error) {
      console.error('❌ Failed to clear local tokens:', error);
    }
  }

  private async clearInvalidTokens(): Promise<void> {
    await this.clearLocalTokens();
  }

  private initializeTokenRefresh(): void {
    // Token refresh will be setup on the first successful login
  }

  // Cleanup method
  destroy(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }
    this.tokenRefreshPromise = null;
  }
}

// Export singleton instance
export const mobileAuthService = new MobileAuthService();