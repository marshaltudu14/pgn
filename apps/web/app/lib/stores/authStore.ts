import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthenticatedUser, LoginRequest } from '@pgn/shared';
import { useUIStore } from './uiStore';

interface AuthState {
  user: AuthenticatedUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,

      initialize: async () => {
        set({ isLoading: true });
        try {
          // Check if we have a stored session
          const storedState = get();
          if (storedState.user && storedState.isAuthenticated) {
            // For web dashboard, only admins should be authenticated
            // Admin users have empty tokens, employees have JWT tokens
            const isAdmin = !storedState.token || storedState.token === '';

            if (isAdmin) {
              set({
                isAuthenticated: true,
                isAdmin: true,
                isLoading: false,
              });
              return;
            } else {
              // Employee session found in web dashboard - clear it
              console.warn('Employee session detected in web dashboard - clearing for security');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isAdmin: false,
                isLoading: false,
              });
              return;
            }
          }

          // No valid session found
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const loginRequest: LoginRequest = {
            email,
            password,
          };

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginRequest),
          });

          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            set({ isLoading: false });
            return {
              success: false,
              error: 'Server error: Invalid response format. Please try again.'
            };
          }

          if (!response.ok) {
            set({ isLoading: false });
            const errorMessage = 'error' in data ? data.error : 'Login failed';

            // Show user-friendly error messages
            if (response.status === 500) {
              return {
                success: false,
                error: 'Server is experiencing issues. Please try again in a moment.'
              };
            } else if (response.status === 429) {
              return {
                success: false,
                error: 'Too many login attempts. Please wait a few minutes before trying again.'
              };
            } else if (response.status === 401 || response.status === 403) {
              return {
                success: false,
                error: errorMessage || 'Invalid credentials. Please check your email and password.'
              };
            } else {
              return { success: false, error: errorMessage };
            }
          }

          // API returns { success: true, data: { token, employee, ... } }
          if (!data.success || !data.data) {
            set({ isLoading: false });
            return {
              success: false,
              error: data.error || 'Invalid response from server'
            };
          }

          const responseData = data.data;
          const { token, employee } = responseData;

          // Check if employee data exists
          if (!employee) {
            set({ isLoading: false });
            return {
              success: false,
              error: 'Invalid user data received from server'
            };
          }

          // Admin detection: Only admins can login to web dashboard
          // Admins don't get JWT tokens (empty token), employees do
          const isAdmin = !token || token === '';

          // Reject employees trying to access web dashboard
          if (!isAdmin) {
            set({ isLoading: false });
            return {
              success: false,
              error: 'Access denied. This dashboard is for administrators only. Employees should use the mobile app.'
            };
          }

          set({
            user: employee,
            token: token,
            isAuthenticated: true,
            isAdmin: true, // Force admin to true for web dashboard
            isLoading: false,
          });

          useUIStore.getState().showNotification(`Welcome back, ${employee.firstName} ${employee.lastName}!`, 'success');

          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });

          // Network or other errors
          if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
              success: false,
              error: 'Network error. Please check your internet connection and try again.'
            };
          }

          return {
            success: false,
            error: 'An unexpected error occurred. Please try again.'
          };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const storedState = get();

          // Handle logout differently for admins vs employees
          if (storedState.token && storedState.token !== '') {
            // Employee logout: Call logout API with JWT token
            try {
              const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedState.token}`,
              };

              const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers,
                signal: AbortSignal.timeout(5000), // 5 second timeout
              });

              if (!response.ok) {
                console.error('Logout API error:', response.status, await response.text());
                // Continue with local logout even if API fails
              }
            } catch (apiError) {
              console.warn('Logout API call failed:', apiError);
              // Continue with local logout even if API fails
            }
          } else {
            // Admin logout: Clear Supabase session directly
            try {
              const response = await fetch('/api/auth/admin-logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(5000),
              });

              if (!response.ok) {
                console.warn('Admin logout API call failed:', response.status);
                // Continue with local logout even if API fails
              }
            } catch (adminLogoutError) {
              console.warn('Admin logout API call failed:', adminLogoutError);
              // Continue with local logout even if API fails
            }
          }

          // Clear all local storage and session storage
          try {
            // Clear any auth-related data from localStorage
            localStorage.removeItem('auth-storage');

            // Clear session storage if any
            sessionStorage.clear();

            // Clear Zustand persisted state
            const persistStorage = localStorage.getItem('auth-storage');
            if (persistStorage) {
              localStorage.removeItem('auth-storage');
            }
          } catch (storageError) {
            console.warn('Failed to clear storage during logout:', storageError);
          }

          // Reset auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });

          // Clear any global state if needed
          if (typeof window !== 'undefined') {
            // Clear any other app-specific storage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('pgn-') || key.startsWith('supabase.auth.')) {
                localStorage.removeItem(key);
              }
            });
          }

          useUIStore.getState().showNotification('You have been logged out successfully.', 'info');

          // Redirect to home page after successful logout
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even on error
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });

          useUIStore.getState().showNotification('You have been logged out.', 'info');

          // Still redirect even on error
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/';
            }, 1000);
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        isAdmin: state.isAdmin,
      }),
    }
  )
);