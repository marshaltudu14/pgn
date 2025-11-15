import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthenticatedUser, LoginRequest, LoginResponse, LogoutRequest } from '@pgn/shared';
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
          // Check if we have a stored token
          const storedState = get();
          if (storedState.token) {
            // Token exists, but we need a way to validate it
            // For now, assume it's valid if we have user data
            if (storedState.user) {
              // Admin detection based on email containing 'admin' or token absence (admins don't get JWT tokens)
              const isAdmin = storedState.user.email.includes('admin') || !storedState.token;
              set({
                isAuthenticated: true,
                isAdmin,
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

          const loginResponse = data as LoginResponse;
          // Admin detection: admins don't get JWT tokens, employees do
          const isAdmin = !loginResponse.token || loginResponse.employee.email.includes('admin');

          set({
            user: loginResponse.employee,
            token: loginResponse.token,
            isAuthenticated: true,
            isAdmin,
            isLoading: false,
          });

          useUIStore.getState().showNotification(`Welcome back, ${loginResponse.employee.fullName}!`, 'success');

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
          if (storedState.token) {
            const logoutRequest: LogoutRequest = {
              token: storedState.token,
            };

            const response = await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(logoutRequest),
            });

            if (!response.ok) {
              console.error('Logout API error:', await response.text());
            }
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            isLoading: false,
          });

          useUIStore.getState().showNotification('You have been logged out successfully.', 'info');
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
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