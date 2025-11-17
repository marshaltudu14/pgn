import { apiClient, ApiError } from './api-client';
import { secureStorage } from './secure-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  LoginRequest,
  LoginResponse,
  AuthenticatedUser,
  RefreshResponse,
  EmploymentStatus,
} from '@pgn/shared';

export interface AuthenticationResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  requiresBiometricSetup?: boolean;
}

export interface BiometricResult {
  success: boolean;
  error?: string;
  type?: LocalAuthentication.AuthenticationType[];
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  biometricEnabled: boolean;
  lastActivity: number;
}

export class MobileAuthService {
  private tokenRefreshPromise: Promise<string> | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
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

      // Check if biometric setup should be offered
      const biometricResult = await this.checkBiometricAvailability();
      const shouldOfferBiometric = biometricResult.success && biometricResult.type && biometricResult.type.length > 0;

      return {
        success: true,
        user: response.employee,
        requiresBiometricSetup: shouldOfferBiometric,
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  async biometricLogin(): Promise<AuthenticationResult> {
    try {
      
      // Check if user has credentials stored
      const hasCredentials = await secureStorage.hasStoredCredentials();
      if (!hasCredentials) {
        return {
          success: false,
          error: 'No stored credentials found. Please login with password first.',
        };
      }

      // Attempt biometric authentication
      const biometricResult = await this.authenticateWithBiometrics({
        promptMessage: 'Use your fingerprint or face to login',
        disableDeviceFallback: false,
      });

      if (!biometricResult.success) {
        return {
          success: false,
          error: biometricResult.error || 'Biometric authentication failed',
        };
      }

      // Retrieve stored user data
      const userData = await secureStorage.getUserData();
      const authToken = await secureStorage.getAuthToken();

      if (!userData || !authToken) {
        return {
          success: false,
          error: 'Stored credentials are incomplete. Please login again.',
        };
      }

      // Convert StoredUser to AuthenticatedUser
      const authenticatedUser: AuthenticatedUser = {
        id: userData.id,
        humanReadableId: userData.humanReadableId,
        fullName: userData.fullName,
        email: userData.email,
        employmentStatus: userData.employmentStatus as any,
        canLogin: userData.canLogin,
      };

      // Validate stored token with server
      try {
        const currentUser = await apiClient.getCurrentUser(authToken);
        
        // Update stored user data in case it changed
        await secureStorage.setUserData({
          id: currentUser.id,
          humanReadableId: currentUser.humanReadableId,
          fullName: currentUser.fullName,
          email: currentUser.email,
          employmentStatus: currentUser.employmentStatus,
          canLogin: currentUser.canLogin,
        });

        // Setup token refresh
        this.setupTokenRefresh(authToken);

        return {
          success: true,
          user: currentUser,
        };
      } catch (tokenError) {
        console.warn('⚠️ Stored token is invalid, attempting refresh...');

        const refreshToken = await secureStorage.getRefreshToken();
        if (refreshToken) {
          const refreshResult = await this.refreshAuthToken(refreshToken);
          if (refreshResult.success) {
            // Retry biometric login with new token
            return this.biometricLogin();
          }
        }

        return {
          success: false,
          error: 'Your session has expired. Please login with password.',
        };
      }
    } catch (error) {
      console.error('❌ Biometric login failed:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      
      const authToken = await secureStorage.getAuthToken();
      if (authToken) {
        try {
          // Notify server of logout
          await apiClient.logout(authToken);
        } catch (error) {
          console.warn('⚠️ Server logout failed:', error);
          // Continue with local logout even if server call fails
        }
      }

      // Clear local storage
      await secureStorage.clearAllAuthData();

      // Clear token refresh
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }

            return { success: true };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  // Token Management
  async getValidToken(): Promise<string | null> {
    try {
      const currentToken = await secureStorage.getAuthToken();
      if (!currentToken) {
        return null;
      }

      // Simple validation - in production, you might want to decode JWT and check expiration
      try {
        const user = await apiClient.getCurrentUser(currentToken);
        return currentToken; // Token is valid
      } catch (error) {
        console.warn('⚠️ Token validation failed, attempting refresh...');

        const refreshToken = await secureStorage.getRefreshToken();
        if (refreshToken) {
          const refreshResult = await this.refreshAuthToken(refreshToken);
          return refreshResult.success && refreshResult.token ? refreshResult.token : null;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get valid token:', error);
      return null;
    }
  }

  async refreshAuthToken(refreshToken: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      console.log('🔄 Mobile Auth Service: Refreshing auth token');

      // Prevent multiple concurrent refresh attempts
      if (this.tokenRefreshPromise) {
        const token = await this.tokenRefreshPromise;
        return { success: true, token };
      }

      this.tokenRefreshPromise = (async () => {
        const response: RefreshResponse = await apiClient.refreshToken(refreshToken);

        // Store new token
        await secureStorage.setAuthToken(response.token);

        // Setup refresh for new token
        this.setupTokenRefresh(response.token);

        return response.token;
      })();

      const newToken = await this.tokenRefreshPromise;
      this.tokenRefreshPromise = null;

      return { success: true, token: newToken };
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.tokenRefreshPromise = null;
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  // Biometric Authentication Methods
  async checkBiometricAvailability(): Promise<BiometricResult> {
    try {
      console.log('🔍 Checking biometric availability...');

      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);

      if (!hasHardware) {
        return {
          success: false,
          error: 'Biometric hardware not available on this device',
        };
      }

      if (!isEnrolled) {
        return {
          success: false,
          error: 'No biometric data enrolled on this device',
        };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('✅ Biometric available:', { supportedTypes });

      return {
        success: true,
        type: supportedTypes,
      };
    } catch (error) {
      console.error('❌ Failed to check biometric availability:', error);
      return {
        success: false,
        error: 'Failed to check biometric availability',
      };
    }
  }

  async authenticateWithBiometrics(options?: LocalAuthentication.LocalAuthenticationOptions): Promise<BiometricResult> {
    try {
      console.log('👆 Attempting biometric authentication...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        requireConfirmation: true,
        ...options,
      });

      console.log('🔍 Biometric result:', { success: result.success });

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Biometric authentication failed',
        };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: 'Biometric authentication error occurred',
      };
    }
  }

  async enableBiometricAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Enabling biometric authentication...');

      // First, verify biometrics are available
      const availabilityCheck = await this.checkBiometricAvailability();
      if (!availabilityCheck.success) {
        return {
          success: false,
          error: availabilityCheck.error,
        };
      }

      // Test authentication to ensure user can use biometrics
      const authTest = await this.authenticateWithBiometrics({
        promptMessage: 'Setup biometric authentication for PGN Mobile',
      });

      if (!authTest.success) {
        return {
          success: false,
          error: authTest.error || 'Biometric authentication test failed',
        };
      }

      // Store biometric preferences
      const biometricPrefs = await secureStorage.getBiometricPreferences() || {
        enabled: false,
        setupComplete: false,
      };

      biometricPrefs.enabled = true;
      biometricPrefs.setupComplete = true;
      biometricPrefs.lastUsed = Date.now();

      await secureStorage.setBiometricPreferences(biometricPrefs);

      console.log('✅ Biometric authentication enabled successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to enable biometric authentication:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  async disableBiometricAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔓 Disabling biometric authentication...');

      const biometricPrefs = await secureStorage.getBiometricPreferences() || {
        enabled: false,
        setupComplete: false,
      };

      biometricPrefs.enabled = false;

      await secureStorage.setBiometricPreferences(biometricPrefs);

      console.log('✅ Biometric authentication disabled successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to disable biometric authentication:', error);
      return {
        success: false,
        error: this.parseAuthError(error),
      };
    }
  }

  // State Management Methods
  async getCurrentAuthState(): Promise<AuthState> {
    console.log('🔐 Auth Service: Getting current auth state...');
    try {
      const userData = await secureStorage.getUserData();
      const biometricPrefs = await secureStorage.getBiometricPreferences();
      const authToken = await secureStorage.getAuthToken();

      console.log('🔐 Auth Service: Storage check:', {
        hasToken: !!authToken,
        hasUserData: !!userData,
        hasBiometricPrefs: !!biometricPrefs,
        userEmail: userData?.email
      });

      // If no token or user data, not authenticated
      if (!authToken || !userData) {
        console.log('🔐 Auth Service: No token or user data found - not authenticated');
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          biometricEnabled: false,
          lastActivity: Date.now(),
        };
      }

      // Validate the token by making a lightweight API call
      // For now, we'll do basic token validation (in a real app, you might want to validate with the server)
      console.log('🔐 Auth Service: Validating token...');
      const isValidToken = await this.validateToken(authToken);
      console.log('🔐 Auth Service: Token validation result:', isValidToken);

      if (!isValidToken) {
        console.log('🔐 Auth Service: Invalid token - clearing and returning not authenticated');
        // Clear invalid tokens
        await this.clearInvalidTokens();
        return {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'Session expired. Please login again.',
          biometricEnabled: false,
          lastActivity: Date.now(),
        };
      }

      // Convert StoredUser to AuthenticatedUser if needed
      const user: AuthenticatedUser = {
        id: userData.id,
        humanReadableId: userData.humanReadableId,
        fullName: userData.fullName,
        email: userData.email,
        employmentStatus: userData.employmentStatus as any,
        canLogin: userData.canLogin,
      };

      return {
        isAuthenticated: true,
        isLoading: false,
        user,
        error: null,
        biometricEnabled: biometricPrefs?.enabled || false,
        lastActivity: Date.now(),
      };
    } catch (error) {
      console.error('❌ Failed to get auth state:', error);
      return {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: this.parseAuthError(error),
        biometricEnabled: false,
        lastActivity: Date.now(),
      };
    }
  }

  // Private Methods
  private async validateToken(token: string): Promise<boolean> {
    try {
      console.log('🔐 Auth Service: Validating token with API call...');
      // Use the existing apiClient to validate token by getting current user
      // If the token is valid, getCurrentUser will return user data
      const user = await apiClient.getCurrentUser(token);
      console.log('🔐 Auth Service: Token validation successful - user:', user.email);
      return true;
    } catch (error) {
      console.error('❌ Auth Service: Token validation failed:', error);
      // If getCurrentUser fails, token is invalid
      return false;
    }
  }

  private async clearInvalidTokens(): Promise<void> {
    try {
      await secureStorage.clearAllAuthData();
    } catch (error) {
      console.error('❌ Failed to clear invalid tokens:', error);
    }
  }

  private setupTokenRefresh(token: string): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    // In a real implementation, you would decode the JWT to get the expiration
    // For now, we'll set a refresh interval of 14 minutes (tokens expire in 15)
    const refreshInterval = 14 * 60 * 1000; // 14 minutes

    this.tokenRefreshTimeout = setTimeout(async () => {
      console.log('⏰ Auto-refreshing token...');
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await this.refreshAuthToken(refreshToken);
      }
    }, refreshInterval) as any;
  }

  private initializeTokenRefresh(): void {
    // Initialize token refresh on app start
    this.getValidToken().then(token => {
      if (token) {
        this.setupTokenRefresh(token);
      }
    });
  }

  private parseAuthError(error: any): string {
    if (error instanceof Error) {
      const message = error.message;

      // Session expiration errors - these should trigger automatic logout
      if (message.includes('TOKEN_EXPIRED') ||
          message.includes('SESSION_EXPIRED') ||
          message.includes('TOKEN_REVOKED') ||
          message.includes('SESSION_TIMEOUT') ||
          message.toLowerCase().includes('session has expired') ||
          message.toLowerCase().includes('token has expired')) {
        return 'SESSION_EXPIRED';
      }

      // Common error patterns
      if (message.includes('401') || message.includes('unauthorized')) {
        // Check if it's a session expiration vs invalid credentials
        if (message.includes('invalid') || message.includes('Invalid')) {
          return 'Invalid email or password';
        }
        return 'SESSION_EXPIRED'; // Assume session timeout for other 401s
      }
      if (message.includes('403') || message.includes('forbidden')) {
        return 'Access denied. Your account may be suspended.';
      }
      if (message.includes('429') || message.includes('rate limit')) {
        return 'Too many attempts. Please try again later.';
      }
      if (message.includes('Network') || message.includes('timeout')) {
        return 'Network error. Please check your connection.';
      }
      if (message.includes('employment_status')) {
        return 'Your employment status does not allow login.';
      }

      return message;
    }

    return 'An unexpected error occurred';
  }

  // Check if an error indicates session expiration
  private isSessionExpiredError(error: string): boolean {
    return error === 'SESSION_EXPIRED' ||
           error.toLowerCase().includes('session has expired') ||
           error.toLowerCase().includes('token has expired') ||
           error.toLowerCase().includes('session timeout');
  }

  // Handle session expiration by clearing auth state
  async handleSessionExpiration(): Promise<void> {
    console.log('🚪 Session expired, clearing authentication state');
    try {
      // Clear all auth data
      await secureStorage.clearAllAuthData();

      // Clear token refresh timeout
      if (this.tokenRefreshTimeout) {
        clearTimeout(this.tokenRefreshTimeout);
        this.tokenRefreshTimeout = null;
      }

      // Clear any pending refresh promises
      this.tokenRefreshPromise = null;

      console.log('✅ Session expiration handled successfully');
    } catch (error) {
      console.error('❌ Failed to handle session expiration:', error);
    }
  }
}

// Create singleton instance
export const mobileAuthService = new MobileAuthService();