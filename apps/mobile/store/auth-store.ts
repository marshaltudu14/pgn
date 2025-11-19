import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  AuthenticatedUser,
  LoginRequest,
  AuthenticationResult,
} from '@pgn/shared';
import { mobileAuthService } from '@/services/auth-service';
import { secureStorage } from '@/services/secure-storage';
import { ApiError } from '@/services/api-client';

interface AuthStoreState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  lastActivity: number;

  // UI state
  isLoggingIn: boolean;

  // Actions
  login: (credentials: LoginRequest) => Promise<AuthenticationResult>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Token management
  initializeAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
  isAuthenticatedUser: () => boolean;

  // Session management
  handleSessionExpiration: () => Promise<void>;

  // Utility
  reset: () => void;
}

export const useAuth = create<AuthStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        lastActivity: Date.now(),
        isLoggingIn: false,

        // Initialize authentication state on app start
        initializeAuth: async () => {
          set({ isLoading: true, error: null });

          try {
            const authState = await mobileAuthService.getCurrentAuthState();

            set({
              isAuthenticated: authState.isAuthenticated,
              isLoading: false,
              user: authState.user,
              error: null,
              lastActivity: Date.now(),
            });
          } catch (error) {
            console.error('❌ Auth Store: Initialization failed', error);
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: 'Failed to initialize authentication',
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
                error: result.error || 'Login failed',
                lastActivity: Date.now(),
              });

              return result;
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';

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

        // Logout user
        logout: async (): Promise<{ success: boolean; error?: string }> => {
          set({ isLoading: true, error: null });

          try {
            const authToken = await secureStorage.getAuthToken();
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Call logout API
            await mobileAuthService.logout(authToken);

            // Clear local auth state
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: null,
              lastActivity: Date.now(),
              isLoggingIn: false,
            });

            return { success: true };
          } catch (error) {
            console.error('❌ Logout failed:', error);

            // Still clear local state on error
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: error instanceof Error ? error.message : 'Logout failed',
              lastActivity: Date.now(),
              isLoggingIn: false,
            });

            return {
              success: false,
              error: error instanceof Error ? error.message : 'Logout failed',
            };
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

        // Refresh authentication token
        refreshToken: async (): Promise<{ success: boolean; error?: string }> => {
          try {
            const refreshToken = await secureStorage.getRefreshToken();
            if (!refreshToken) {
              return { success: false, error: 'No refresh token available' };
            }

            const result = await mobileAuthService.refreshToken(refreshToken);

            return { success: true };
          } catch (error) {
            console.error('❌ Token refresh failed', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Token refresh failed',
            };
          }
        },

        // Refresh user data
        refreshUserData: async (): Promise<void> => {
          try {
            const authToken = await secureStorage.getAuthToken();
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Get updated user data from API
            const updatedUser = await mobileAuthService.getUserDataFromToken(authToken);

            if (updatedUser) {
              set({ user: updatedUser });
            }
          } catch (error) {
            console.error('❌ Failed to refresh user data:', error);
          }
        },

        // Get valid authentication token
        getValidToken: async (): Promise<string | null> => {
          try {
            const token = await secureStorage.getAuthToken();
            if (!token) {
              return null;
            }

            // Basic token validation
            const isValid = await mobileAuthService.validateToken(token);
            return isValid ? token : null;
          } catch (error) {
            console.error('❌ Failed to validate token:', error);
            return null;
          }
        },

        // Check if user is authenticated
        isAuthenticatedUser: (): boolean => {
          const { isAuthenticated, lastActivity } = get();

          // Check if session has expired (15 minutes)
          const sessionTimeout = 15 * 60 * 1000; // 15 minutes
          const isSessionExpired = Date.now() - lastActivity > sessionTimeout;

          return isAuthenticated && !isSessionExpired;
        },

        // Handle session expiration
        handleSessionExpiration: async (): Promise<void> => {
          // Clear all auth state
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
            lastActivity: Date.now(),
            isLoggingIn: false,
          });
        },

        // Reset store
        reset: () => {
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
            lastActivity: Date.now(),
            isLoggingIn: false,
          });
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          // Don't persist error or loading states
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Export hooks for easier usage
export const useAuthStore = () => useAuth();

// Helper hooks
export const useUser = () => useAuth((state) => state.user);
export const useIsAuthenticated = () => useAuth((state) => state.isAuthenticatedUser());
export const useAuthLoading = () => useAuth((state) => state.isLoading || state.isLoggingIn);
export const useAuthError = () => useAuth((state) => state.error);

export default useAuth;