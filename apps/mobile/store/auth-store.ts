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

  // User data management
  refreshUserData: () => Promise<void>;

  // Utility methods
  getValidToken: () => Promise<string | null>;
  isAuthenticatedUser: () => boolean;
  canUseBiometricLogin: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  biometricEnabled: false,
  lastActivity: Date.now(),

  // Initialize authentication state on app start
  initializeAuth: async () => {
      set({ isLoading: true, error: null });

    try {
      const authState = await mobileAuthService.getCurrentAuthState();
      const biometricPrefs = await secureStorage.getBiometricPreferences();

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
    set({ isLoading: true, error: null });

    try {
      const result = await mobileAuthService.login(credentials);

      if (result.success && result.user) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user: result.user,
          error: null,
          lastActivity: Date.now(),
        });

        return result;
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
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
        isLoading: false,
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
    set({ isLoading: true, error: null });

    try {
      const result = await mobileAuthService.biometricLogin();

      if (result.success && result.user) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user: result.user,
          error: null,
          lastActivity: Date.now(),
        });

        return result;
      } else {
        set({
          isAuthenticated: false,
          isLoading: false,
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
        isLoading: false,
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
      console.warn('⚠️ Auth Store: Cannot refresh user data - not authenticated');
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

  // Check if biometric login is available
  canUseBiometricLogin: (): boolean => {
    const { isAuthenticated, biometricEnabled } = get();
    return isAuthenticated && biometricEnabled;
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));

// Utility functions for components
export const useAuth = () => {
  const authStore = useAuthStore();

  return {
    // State
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    user: authStore.user,
    error: authStore.error,
    biometricEnabled: authStore.biometricEnabled,

    // Computed values
    canLogin: !authStore.isLoading && !authStore.isAuthenticated,
    canUseBiometricLogin: authStore.canUseBiometricLogin(),

    // Actions
    login: authStore.login,
    biometricLogin: authStore.biometricLogin,
    logout: authStore.logout,
    refreshToken: authStore.refreshToken,
    enableBiometric: authStore.enableBiometricAuthentication,
    disableBiometric: authStore.disableBiometricAuthentication,
    checkBiometric: authStore.checkBiometricAvailability,
    refreshUserData: authStore.refreshUserData,
    clearError: authStore.clearError,

    // Initialize
    initializeAuth: authStore.initializeAuth,
  };
};

export default useAuthStore;