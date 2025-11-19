import { create } from 'zustand';
import {
  mobileAuthService,
  AuthenticationResult,
  BiometricResult,
  AuthState
} from '@/services/auth-service';
import {
  secureStorage,
  StoredUser,
  BiometricPreferences
} from '@/services/secure-storage';
import { apiClient } from '@/services/api-client';
import { AuthenticatedUser, LoginRequest } from '@pgn/shared';

export interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<AuthenticationResult>;
  biometricLogin: () => Promise<AuthenticationResult>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refreshToken: () => Promise<{ success: boolean; token?: string; error?: string }>;

  // Biometric actions
  checkBiometricAvailability: () => Promise<BiometricResult>;
  enableBiometricAuthentication: () => Promise<{ success: boolean; error?: string }>;
  disableBiometricAuthentication: () => Promise<{ success: boolean; error?: string }>;

  // State management
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  isLoggingIn: boolean; // Separate loading state for login process

  // User data management
  refreshUserData: () => Promise<void>;

  // Utility methods
  getValidToken: () => Promise<string | null>;
  isAuthenticatedUser: () => boolean;
  canUseBiometricLogin: () => boolean;
  canUseBiometricAutoLogin: () => Promise<boolean>;
  handleSessionExpiration: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  biometricEnabled: false,
  lastActivity: Date.now(),
  isLoggingIn: false,

  // Initialize authentication state on app start
  initializeAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const authState = await mobileAuthService.getCurrentAuthState();
      const biometricPrefs = await secureStorage.getBiometricPreferences();

      console.log('🔍 Auth initializeAuth:', {
        authState,
        biometricPrefs,
        biometricEnabled: biometricPrefs?.enabled || false,
      });

      set({
        isAuthenticated: authState.isAuthenticated,
        isLoading: false,
        user: authState.user,
        error: null,
        biometricEnabled: biometricPrefs?.enabled || false,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error('❌ Auth Store: Initialization failed', error);
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Failed to initialize authentication',
        biometricEnabled: false,
        lastActivity: Date.now(),
      });
    }
  },

  // Login with email and password
  login: async (credentials: LoginRequest): Promise<AuthenticationResult> => {
    set({ isLoggingIn: true, error: null });

    try {
      const result = await mobileAuthService.login(credentials);

      if (result.success && result.user) {
        console.log('🔍 Login successful, updating auth state:', {
          result,
          user: result.user,
        });

        set({
          isAuthenticated: true,
          isLoggingIn: false,
          user: result.user,
          error: null,
          lastActivity: Date.now(),
        });

        console.log('🔍 Auth state updated, login function returning success');
        return result;
      } else {
        set({
          isAuthenticated: false,
          isLoggingIn: false,
          user: null,
          error: result.error || 'Login failed',
          lastActivity: Date.now(),
        });

        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Auth Store: Login failed', error);

      set({
        isAuthenticated: false,
        isLoggingIn: false,
        user: null,
        error: errorMessage,
        lastActivity: Date.now(),
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Biometric login
  biometricLogin: async (): Promise<AuthenticationResult> => {
    console.log('🔍 Auth Store: biometricLogin called');
    set({ isLoggingIn: true, error: null });

    try {
      const result = await mobileAuthService.biometricLogin();

      if (result.success && result.user) {
        console.log('🔍 Auth Store: Biometric login successful, updating state');
        set({
          isAuthenticated: true,
          isLoggingIn: false,
          user: result.user,
          error: null,
          lastActivity: Date.now(),
        });

        return result;
      } else {
        set({
          isAuthenticated: false,
          isLoggingIn: false,
          user: null,
          error: result.error || 'Biometric login failed',
          lastActivity: Date.now(),
        });

        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Biometric login failed';
      console.error('❌ Auth Store: Biometric login failed', error);

      set({
        isAuthenticated: false,
        isLoggingIn: false,
        user: null,
        error: errorMessage,
        lastActivity: Date.now(),
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Logout
  logout: async (): Promise<{ success: boolean; error?: string }> => {
    set({ isLoading: true });

    try {
      const result = await mobileAuthService.logout();

      // Clear state regardless of server logout success
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        biometricEnabled: false, // Keep biometric preference
        lastActivity: Date.now(),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      console.error('❌ Auth Store: Logout failed', error);

      // Clear state even if logout failed
      set({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        biometricEnabled: false,
        lastActivity: Date.now(),
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Refresh authentication token
  refreshToken: async () => {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        return { success: false, error: 'No refresh token available' };
      }

      const result = await mobileAuthService.refreshAuthToken(refreshToken);

      return result;
    } catch (error) {
      console.error('❌ Auth Store: Token refresh failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  },

  // Check biometric availability
  checkBiometricAvailability: async (): Promise<BiometricResult> => {
    return await mobileAuthService.checkBiometricAvailability();
  },

  // Enable biometric authentication
  enableBiometricAuthentication: async () => {
    try {
      const result = await mobileAuthService.enableBiometricAuthentication();

      if (result.success) {
        set({ biometricEnabled: true });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable biometric authentication';
      console.error('❌ Auth Store: Failed to enable biometric authentication', error);
      return { success: false, error: errorMessage };
    }
  },

  // Disable biometric authentication
  disableBiometricAuthentication: async () => {
    try {
      const result = await mobileAuthService.disableBiometricAuthentication();

      if (result.success) {
        set({ biometricEnabled: false });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable biometric authentication';
      console.error('❌ Auth Store: Failed to disable biometric authentication', error);
      return { success: false, error: errorMessage };
    }
  },

  // Refresh user data from server
  refreshUserData: async () => {
    const { isAuthenticated, user } = get();

    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const token = await get().getValidToken();
      if (!token) {
        console.error('❌ Auth Store: No valid token for refreshing user data');
        return;
      }

      const refreshedUser = await apiClient.getCurrentUser(token);

      set({
        user: refreshedUser,
        lastActivity: Date.now(),
      });
    } catch (error) {
      console.error('❌ Auth Store: Failed to refresh user data', error);
      // Don't update error state here as it's not a critical error
    }
  },

  // Get valid authentication token
  getValidToken: async (): Promise<string | null> => {
    return await mobileAuthService.getValidToken();
  },

  // Check if user is authenticated
  isAuthenticatedUser: (): boolean => {
    const { isAuthenticated, user } = get();
    return isAuthenticated && user !== null;
  },

  // Check if biometric login is available (for authenticated users)
  canUseBiometricLogin: (): boolean => {
    const { isAuthenticated, biometricEnabled } = get();
    return isAuthenticated && biometricEnabled;
  },

  // Check if biometric login is available for auto-login (even when not authenticated)
  canUseBiometricAutoLogin: async (): Promise<boolean> => {
    try {
      const biometricPrefs = await secureStorage.getBiometricPreferences();
      const userData = await secureStorage.getUserData();

      console.log('🔍 canUseBiometricAutoLogin check:', {
        biometricPrefs,
        hasUserData: !!userData,
      });

      // Check if user has:
      // 1. Previously enabled biometric (enabled === true)
      // 2. Completed biometric setup (setupComplete === true)
      // 3. Has stored credentials for auto-login
      // 4. Has not declined biometric setup
      const hasBiometricEnabled = biometricPrefs?.enabled === true;
      const hasSetupComplete = biometricPrefs?.setupComplete === true;
      const hasStoredCredentials = !!userData;
      const hasNotDeclined = biometricPrefs?.hasDeclined !== true;

      const canUseAutoLogin = !!(hasBiometricEnabled && hasSetupComplete && hasStoredCredentials && hasNotDeclined);
      console.log('🔍 canUseBiometricAutoLogin result:', {
        hasBiometricEnabled,
        hasSetupComplete,
        hasStoredCredentials,
        hasNotDeclined,
        canUseAutoLogin,
      });

      return canUseAutoLogin;
    } catch (error) {
      console.error('Error checking biometric auto-login availability:', error);
      return false;
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Handle session expiration
  handleSessionExpiration: async (): Promise<void> => {
    // Clear all auth state
    set({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Your session has expired. Please login again.',
      biometricEnabled: false,
      lastActivity: Date.now(),
    });

    // Call the auth service to handle cleanup
    await mobileAuthService.handleSessionExpiration();
  },
}));

// Utility functions for components
export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    // State
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    isLoggingIn: authStore.isLoggingIn,
    user: authStore.user,
    error: authStore.error,
    biometricEnabled: authStore.biometricEnabled,

    // Computed values
    canLogin: !authStore.isLoading && !authStore.isAuthenticated,
    canUseBiometricLogin: authStore.canUseBiometricLogin(),
    canUseBiometricAutoLogin: authStore.canUseBiometricAutoLogin,

    // Actions
    login: authStore.login,
    biometricLogin: authStore.biometricLogin,
    logout: authStore.logout,
    refreshToken: authStore.refreshToken,
    enableBiometricAuthentication: authStore.enableBiometricAuthentication,
    disableBiometricAuthentication: authStore.disableBiometricAuthentication,
    checkBiometricAvailability: authStore.checkBiometricAvailability,
    refreshUserData: authStore.refreshUserData,
    clearError: authStore.clearError,
    handleSessionExpiration: authStore.handleSessionExpiration,

    // Initialize
    initializeAuth: authStore.initializeAuth,
  };
};

export default useAuthStore;