import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthenticatedUser,
  LoginRequest,
  AuthenticationResult,
} from '@pgn/shared';
import { api } from '@/services/api-client';
import { SessionManager, type Session } from '@/utils/auth-utils';
import { API_ENDPOINTS } from '@/constants/api';
import {
  isValidationError,
  transformApiErrorMessage,
  handleMobileApiResponse,
  parseAuthErrorCode
} from './utils/errorHandling';
import { locationTrackingServiceNotifee } from '@/services/location-foreground-service-notifee';
import { useAttendance } from './attendance-store';

interface AuthStoreState {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  error: string | null;
  lastActivity: number;
  session: Session | null;

  // UI state
  isLoggingIn: boolean;
  needsRefresh?: boolean;

  // Token refresh state
  tokenRefreshPromise: Promise<string> | null;
  tokenRefreshTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<AuthenticationResult>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;

  // Emergency checkout
  handleEmergencyCheckoutOnLogout: () => Promise<void>;

  // Token management
  initializeAuth: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
  isAuthenticatedUser: () => boolean;
  refreshToken: (refreshToken: string) => Promise<any>;
  validateToken: (token: string) => boolean;

  // Session management
  handleSessionExpiration: () => Promise<void>;

  // Session management methods
  setSession: (session: Session | null) => void;
  clearSession: () => void;
  isTokenExpired: () => boolean;

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
        session: null,
        isLoggingIn: false,
        tokenRefreshPromise: null,
        tokenRefreshTimeout: null,

        // Initialize authentication state on app start
        initializeAuth: async () => {
          set({ isLoading: true, error: null });

          // One-time cleanup: remove stale user data
          try {
            await AsyncStorage.removeItem('pgn_employee_data');
          } catch (error) {
            // Ignore cleanup errors
          }

          try {
            const authState = await get().getCurrentAuthState();

            // If authenticated, refresh user data from server
            if (authState.isAuthenticated) {
              try {
                await get().refreshUserData();
                // After refresh, set the auth state (user will be set by refreshUserData)
                set({
                  isAuthenticated: authState.isAuthenticated,
                  isLoading: false,
                  error: null,
                  lastActivity: Date.now(),
                  session: authState.session || null,
                });
              } catch (error) {
                console.warn('⚠️ Failed to refresh user data, using stored data:', error);
                // Continue with stored data if refresh fails
                set({
                  isAuthenticated: authState.isAuthenticated,
                  isLoading: false,
                  user: authState.user,
                  error: null,
                  lastActivity: Date.now(),
                  session: authState.session || null,
                });
              }
            } else {
              // Not authenticated
              set({
                isAuthenticated: authState.isAuthenticated,
                isLoading: false,
                user: null,
                error: null,
                lastActivity: Date.now(),
                session: authState.session || null,
              });
            }

          } catch (error) {
            console.error('❌ Auth Store: Initialization failed', error);
            set({
              isAuthenticated: false,
              isLoading: false,
              user: null,
              error: 'Failed to initialize authentication',
              lastActivity: Date.now(),
              session: null,
            });
          }
        },

        // Login with email and password
        login: async (credentials: LoginRequest): Promise<AuthenticationResult> => {
          set({ isLoggingIn: true, error: null });

          try {
            // Validate input
            if (!credentials.email || !credentials.password) {
              // Clear loading state and set error for validation failure
              set({
                isAuthenticated: false,
                isLoggingIn: false,
                user: null,
                error: 'Email and password are required',
                lastActivity: Date.now(),
              });

              return {
                success: false,
                error: 'Email and password are required',
              };
            }

            // Call API
            const response = await api.post(API_ENDPOINTS.LOGIN, credentials);

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Login failed');

            if (!handledResponse.success) {
              const errorMessage = handledResponse.error || 'Login failed';

              // Clear loading state and set error before returning
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

            // Handle response structure properly
            // Use the handled response data for consistency
            let responseData;
            if (handledResponse.data && typeof handledResponse.data === 'object') {
              // Response is in format: { success: true, data: { token, employee, ... } }
              responseData = handledResponse.data;
            } else if (response.success && response.data && typeof response.data === 'object') {
              // Fallback to original response structure
              responseData = response.data;
            } else {
              // Response is in direct format
              responseData = response;
            }

            // For admin users, token can be empty string ("") - this is intentional
            // We need to check if token property exists, not if it's truthy
            if (!responseData || !('token' in responseData) || !('employee' in responseData) || responseData.employee === undefined) {
              // Clear loading state and set error for invalid response structure
              set({
                isAuthenticated: false,
                isLoggingIn: false,
                user: null,
                error: 'Invalid login response structure',
                lastActivity: Date.now(),
              });

              return {
                success: false,
                error: 'Invalid login response structure',
              };
            }

            // Additional check: if token is provided (non-empty), it should be a string
            // If token is empty string, that's valid for admin users
            if (responseData.token && typeof responseData.token !== 'string') {
              set({
                isAuthenticated: false,
                isLoggingIn: false,
                user: null,
                error: 'Invalid login response structure - invalid token type',
                lastActivity: Date.now(),
              });

              return {
                success: false,
                error: 'Invalid login response structure',
              };
            }

            // Check if this is an admin user trying to access mobile app
            // Admin users have empty tokens ("") - they should use web dashboard instead
            if (responseData.token === '') {
              set({
                isAuthenticated: false,
                isLoggingIn: false,
                user: null,
                error: 'Access denied. This mobile app is for employees only. Administrators should use the web dashboard.',
                lastActivity: Date.now(),
              });

              return {
                success: false,
                error: 'Access denied. This mobile app is for employees only. Administrators should use the web dashboard.',
              };
            }

            // Store session using SessionManager (single source of truth)
            await SessionManager.saveSession({
              accessToken: responseData.token,
              refreshToken: responseData.refreshToken || '',
              expiresIn: responseData.expiresIn || 900, // Use backend value or default
            });

            // Store employee data separately
            if (responseData.employee) {
              await AsyncStorage.setItem('pgn_employee_data', JSON.stringify(responseData.employee));
            }

            // Load session to store state
            const currentSession = await SessionManager.loadSession();

            set({
              isAuthenticated: true,
              isLoggingIn: false,
              user: responseData.employee || null,
              error: null,
              lastActivity: Date.now(),
              session: currentSession,
            });

            return {
              success: true,
              user: responseData.employee || null,
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
            const authToken = await SessionManager.getAccessToken();
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Handle emergency checkout if user is checked in
            // This must be done BEFORE calling the logout API to ensure we have valid token
            await get().handleEmergencyCheckoutOnLogout();

            // Call logout API
            const response = await api.post(API_ENDPOINTS.LOGOUT, { token: authToken });

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Logout failed');

            if (!handledResponse.success) {
              const errorMessage = handledResponse.error || 'Logout failed';
              throw new Error(errorMessage);
            }

            // Clear local tokens and persist storage to force fresh fetch
            await get().clearLocalTokens();
            // Clear old persisted auth-store to ensure fresh data
            await AsyncStorage.removeItem('auth-store');

            // Clear session and local auth state
            get().clearSession();
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

            // Still perform emergency checkout even if logout API fails
            await get().handleEmergencyCheckoutOnLogout();

            // Still clear local tokens on error
            await get().clearLocalTokens();

            // Still clear session and local state on error
            get().clearSession();
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
            const response = await api.post(API_ENDPOINTS.REFRESH_TOKEN, { token: refreshToken });

            // Handle API response with validation error support
            const handledResponse = handleMobileApiResponse(response.data || response, 'Token refresh failed');

            if (!handledResponse.success) {
              const errorMessage = handledResponse.error || 'Token refresh failed';
              throw new Error(errorMessage);
            }

            // Check response structure - the data is in response.data (single nested)
            const responseData = handledResponse.data;
            if (!responseData || typeof responseData !== 'object') {
              throw new Error('Invalid refresh response: missing data');
            }

            // Type the response data to allow property access
            const data = responseData as Record<string, unknown>;

            // Validate required fields
            if (!('token' in data)) {
              throw new Error('API response missing required field: token');
            }

            // Update session with new token and new refresh token
            const newSessionData = {
              accessToken: data.token as string,
              refreshToken: (data.refreshToken as string) || refreshToken, // Use new refresh token if provided
              expiresIn: (data.expiresIn as number) || 900,
            };

            await SessionManager.saveSession(newSessionData);

            // Update current session state
            const updatedSession = await SessionManager.loadSession();
            if (updatedSession) {
              get().setSession(updatedSession);
            }

            return data;
          } catch (error) {
            console.error('❌ Token refresh failed:', error);
            throw new Error(transformApiErrorMessage(error) || 'Failed to refresh token');
          }
        },

        // Refresh user data
        refreshUserData: async (): Promise<void> => {
          try {
            const authToken = await SessionManager.getAccessToken();
            if (!authToken) {
              throw new Error('No authentication token found');
            }

            // Get updated user data from API
            const userResponse = await api.get(API_ENDPOINTS.GET_AUTH_USER);

  
            if (userResponse.success && userResponse.data) {
              const { user } = get();

              // Transform assignedCities from array of objects to array of strings for mobile app
              const rawAssignedCities = userResponse.data.assignedCities || [];

              const assignedCities = rawAssignedCities.map((city: any) => {
                // If it's an object with city property, extract the city name
                if (city && typeof city === 'object' && city.city) {
                  return city.city;
                }
                // If it's already a string, return as is
                if (typeof city === 'string') {
                  return city;
                }
                // Fallback: convert to string
                return String(city);
              });

              // Update user data with API response, even if user is null (fresh login/load)
              const updatedUser = {
                id: userResponse.data.id || user?.id,
                humanReadableId: userResponse.data.humanReadableId || user?.humanReadableId,
                firstName: userResponse.data.firstName || user?.firstName,
                lastName: userResponse.data.lastName || user?.lastName,
                email: userResponse.data.email || user?.email,
                phone: userResponse.data.phone || user?.phone,
                employmentStatus: userResponse.data.employmentStatus || user?.employmentStatus,
                canLogin: userResponse.data.canLogin ?? user?.canLogin,
                assignedCities: assignedCities,
                employmentStatusChangedAt: userResponse.data.employmentStatusChangedAt || user?.employmentStatusChangedAt,
                createdAt: userResponse.data.createdAt || user?.createdAt,
                updatedAt: userResponse.data.updatedAt || user?.updatedAt,
              };

              // Force update with a new object reference to ensure React re-renders
              set({
                user: { ...updatedUser },
                lastActivity: Date.now() // Update timestamp to trigger reactivity
              });
            } else {
              console.error('❌ API returned error:', userResponse);
            }
          } catch (error: unknown) {
            const err = error as {
              message?: string;
              status?: number;
              response?: {
                data?: unknown;
              };
            };

            console.error('❌ Failed to refresh user data:', error);
            console.error('❌ Error details:', {
              message: err.message || 'Unknown error',
              status: err.status,
              response: err.response?.data
            });
            throw error; // Re-throw so caller can handle
          }
        },

        // Get valid authentication token with refresh capability
        getValidToken: async (): Promise<string | null> => {
          try {
            // Check if we have a current session
            const { session, isTokenExpired, setSession } = get();

            if (session && session.accessToken && !isTokenExpired()) {
              return session.accessToken;
            }

            // If session exists but is expired, try to refresh
            if (session && session.refreshToken && isTokenExpired()) {
              try {
                const refreshResult = await get().refreshToken(session.refreshToken);
                if (refreshResult && refreshResult.token) {
                  // Create new session with refreshed token
                  const newSession: Session = {
                    accessToken: refreshResult.token,
                    refreshToken: session.refreshToken,
                    expiresIn: refreshResult.expiresIn || 900, // 15 minutes default
                    expiresAt: Date.now() + (refreshResult.expiresIn || 900) * 1000,
                  };
                  setSession(newSession);
                  return newSession.accessToken;
                }
              } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                // Clear expired session
                setSession(null);
                return null;
              }
            }

            // Try to get stored token from SessionManager
            const token = await SessionManager.getAccessToken();
            if (token) {
              return token;
            }

            return null;
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
          const timeSinceActivity = Date.now() - lastActivity;
          const isSessionExpired = timeSinceActivity > sessionTimeout;

          return isAuthenticated && !isSessionExpired;
        },

        // Handle session expiration
        handleSessionExpiration: async (): Promise<void> => {
          // Handle emergency checkout if user is checked in
          await get().handleEmergencyCheckoutOnLogout();

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

        // Handle emergency checkout on logout
        handleEmergencyCheckoutOnLogout: async (): Promise<void> => {
          try {
            // Check if location tracking is active (user is checked in)
            const isTracking = locationTrackingServiceNotifee.isTrackingActive();

            if (isTracking) {
              // Get emergency data from location service
              const emergencyData = await locationTrackingServiceNotifee.getEmergencyData();

              if (emergencyData && emergencyData.trackingActive && emergencyData.attendanceId) {
                // Use the attendance store's emergency checkout function
                const attendanceStore = useAttendance.getState();
                await attendanceStore.emergencyCheckOut({
                  attendanceId: emergencyData.attendanceId,
                  reason: 'User logged out during active session',
                  lastLocation: emergencyData.lastLocationUpdate,
                  lastKnownTime: emergencyData.lastKnownTime
                });
              }

              // Stop location tracking
              await locationTrackingServiceNotifee.stopTracking('User logged out');
            }
          } catch (error) {
            console.error('[AuthStore] Error during emergency checkout on logout:', error);
            // Don't fail the logout if emergency checkout fails
          }
        },

        // Reset store
        reset: () => {
          get().clearSession();
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
            lastActivity: Date.now(),
            session: null,
            isLoggingIn: false,
            tokenRefreshPromise: null,
            tokenRefreshTimeout: null,
          });
        },

        // Parse authentication errors using error codes
        parseAuthError: (error: any): string => {
          // Check for validation errors first
          if (isValidationError(error)) {
            return transformApiErrorMessage(error);
          }

          // If error is an object with error code, use code-based mapping
          if (error && typeof error === 'object' && 'code' in error) {
            const errorCode = error.code;
            return parseAuthErrorCode(errorCode, error.message || error.error);
          }

          // Fallback to general error message transformation
          return transformApiErrorMessage(error);
        },

        // Validate token with proper JWT validation
        validateToken: (token: string): boolean => {
          try {
            // Basic token structure validation
            if (!token || token.length < 10) {
              return false;
            }

            // Check JWT format (should have 3 parts separated by dots)
            const parts = token.split('.');
            if (parts.length !== 3) {
              return false;
            }

            // For now, check basic JWT structure
            // In production, we would decode and validate the JWT properly
            // The server will handle full JWT validation
            return true;
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
                const currentToken = await SessionManager.getRefreshToken();
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

        // Clear all auth data using SessionManager (single source of truth)
        clearLocalTokens: async (): Promise<void> => {
          try {
            await SessionManager.clearSession();
            // Clear old storage location
            await AsyncStorage.removeItem('pgn_employee_data');
            // Clear the persist storage
            await AsyncStorage.removeItem('auth-store');
          } catch (error) {
            console.error('❌ Failed to clear local tokens:', error);
          }
        },

        // Get current authentication state
        getCurrentAuthState: async (): Promise<any> => {
          try {
            // Try to get session from SessionManager (single source of truth)
            const session = await SessionManager.loadSession();

            // If no session, not authenticated
            if (!session) {
              return {
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
                lastActivity: Date.now(),
              };
            }

            // Check if session is expired
            if (SessionManager.isSessionExpired(session)) {
              // If refresh token is available, try to refresh
              if (session.refreshToken && session.refreshToken.trim() !== '') {
                try {
                  // Attempt to refresh the token
                  const refreshResult = await get().refreshToken(session.refreshToken);

                  if (refreshResult && refreshResult.token) {
                    // Token refreshed successfully, load new session
                    const newSession = await SessionManager.loadSession();
                    if (newSession && !SessionManager.isSessionExpired(newSession)) {
                      // Store the new session in state
                      get().setSession(newSession);
                      return {
                        isAuthenticated: true,
                        isLoading: false,
                        user: null, // User data will be fetched fresh in initializeAuth
                        error: null,
                        lastActivity: Date.now(),
                        session: newSession,
                      };
                    }
                  }
                } catch (refreshError) {
                  console.error('❌ Automatic token refresh failed:', refreshError);
                }
              }

              // Clear expired session if no refresh token or refresh failed
              await SessionManager.clearSession();
              get().setSession(null);
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
              user: null, // User data will be fetched fresh in initializeAuth
              error: null,
              lastActivity: Date.now(),
              session: session,
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

        // Session management methods
        setSession: (session: Session | null) => {
          set({ session });
        },

        clearSession: () => {
          set({ session: null });
        },

        isTokenExpired: (): boolean => {
          const { session } = get();
          if (!session || !session.expiresAt) {
            return true;
          }
          return Date.now() >= session.expiresAt;
        },
      }),
      {
        name: 'auth-store',
        storage: createJSONStorage(() => AsyncStorage),
        version: 1,
        partialize: (state) => ({
          // Don't persist user data - we fetch it fresh every time
          isAuthenticated: state.isAuthenticated,
          session: state.session,
          // Don't persist error or loading states
        }),
        migrate: (persistedState: any, version: number) => {
          // Reset user data on migration to force fresh fetch
          if (version === 0) {
            persistedState.user = null;
          }
          return persistedState as any;
        },
        onRehydrateStorage: () => (state) => {
          // User will be null and will be fetched fresh in initializeAuth
        },
      }
    )
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