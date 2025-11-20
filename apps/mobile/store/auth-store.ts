import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthenticatedUser,
  LoginRequest,
  AuthenticationResult,
} from '@pgn/shared';
import { apiClient } from '@/services/api-client';

interface AuthStoreState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  lastActivity: number;

  // UI state
  isLoggingIn: boolean;

  // Token refresh state
  tokenRefreshPromise: Promise<string> | null;
  tokenRefreshTimeout: ReturnType<typeof setTimeout> | null;

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
  refreshToken: (refreshToken: string) => Promise<any>;
  validateToken: (token: string) => boolean;

  // Session management
  handleSessionExpiration: () => Promise<void>;

  // Utility methods
  parseAuthError: (error: any) => string;
  setupTokenRefresh: (token: string) => void;
  clearLocalTokens: () => Promise<void>;
  getCurrentAuthState: () => Promise<any>;

  // Reset
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
        tokenRefreshPromise: null,
        tokenRefreshTimeout: null,

        // Initialize authentication state on app start
        initializeAuth: async () => {
          set({ isLoading: true, error: null });

          try {
            const authState = await get().getCurrentAuthState();

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
            // Validate input
            if (!credentials.email || !credentials.password) {
              return {
                success: false,
                error: 'Email and password are required',
              };
            }

            // Call API
            const response = await apiClient.login(credentials);

            // Store tokens securely
            await Promise.all([
              AsyncStorage.setItem('pgn_auth_token', response.token),
              AsyncStorage.setItem('pgn_employee_data', JSON.stringify(response.employee)),
            ]);

            // Setup token refresh
            get().setupTokenRefresh(response.token);

            set({
              isAuthenticated: true,
              isLoggingIn: false,
              user: response.employee,
              error: null,
              lastActivity: Date.now(),
            });

            return {
              success: true,
              user: response.employee,
            };
          } catch (error) {
            console.error('❌ Login failed:', error);
            const errorMessage = get().parseAuthError(error);

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
            const authToken = await AsyncStorage.getItem('pgn_auth_token');
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Call logout API
            await apiClient.logout(authToken);

            // Clear local tokens
            await get().clearLocalTokens();

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

            // Still clear local tokens on error
            await get().clearLocalTokens();

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
        refreshToken: async (refreshToken: string): Promise<any> => {
          try {
            const response = await apiClient.refreshToken(refreshToken);

            // Store new tokens
            await AsyncStorage.setItem('pgn_auth_token', response.token);

            get().setupTokenRefresh(response.token);

            return response;
          } catch (error) {
            console.error('❌ Token refresh failed:', error);
            throw new Error('Failed to refresh token');
          }
        },

        // Refresh user data
        refreshUserData: async (): Promise<void> => {
          try {
            const authToken = await AsyncStorage.getItem('pgn_auth_token');
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Get updated user data from API
            const updatedUser = await apiClient.getCurrentUser(authToken);

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
            const token = await AsyncStorage.getItem('pgn_auth_token');
            if (!token) {
              return null;
            }

            // Basic token validation
            const isValid = get().validateToken(token);
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

          // Also clear stored tokens
          await get().clearLocalTokens();
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
            tokenRefreshPromise: null,
            tokenRefreshTimeout: null,
          });
        },

        // Parse authentication errors
        parseAuthError: (error: any): string => {
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
        },

        // Validate token structure
        validateToken: (token: string): boolean => {
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
        },

        // Setup token refresh timeout
        setupTokenRefresh: (token: string) => {
          try {
            const currentState = get();

            // Clear any existing timeout
            if (currentState.tokenRefreshTimeout) {
              clearTimeout(currentState.tokenRefreshTimeout);
            }

            // Schedule token refresh
            // This is a simplified implementation - in production you'd parse the JWT to get expiration time
            const refreshTime = 14 * 60 * 1000; // Refresh every 14 minutes

            const timeoutId = setTimeout(async () => {
              try {
                const currentToken = await AsyncStorage.getItem('pgn_refresh_token');
                if (currentToken) {
                  await get().refreshToken(currentToken);
                }
              } catch (error) {
                console.error('❌ Automatic token refresh failed:', error);
              }
            }, refreshTime);

            set({ tokenRefreshTimeout: timeoutId });
          } catch (error) {
            console.error('❌ Failed to setup token refresh:', error);
          }
        },

        // Clear local tokens
        clearLocalTokens: async (): Promise<void> => {
          try {
            await AsyncStorage.multiRemove(['pgn_auth_token', 'pgn_refresh_token', 'pgn_employee_data', 'pgn_user_id', 'pgn_last_login']);
          } catch (error) {
            console.error('❌ Failed to clear local tokens:', error);
          }
        },

        // Get current authentication state
        getCurrentAuthState: async (): Promise<any> => {
          try {
            const userDataStr = await AsyncStorage.getItem('pgn_employee_data');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const authToken = await AsyncStorage.getItem('pgn_auth_token');

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
            const currentState = get();
            const isValidToken = currentState.validateToken(authToken);

            if (!isValidToken) {
              // Clear invalid tokens
              await currentState.clearLocalTokens();
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
        },
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => AsyncStorage),
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