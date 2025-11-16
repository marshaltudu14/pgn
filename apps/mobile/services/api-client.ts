import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  LogoutResponse,
  AuthenticatedUser
} from '@pgn/shared';
import { Platform } from 'react-native';

// API Configuration
const API_BASE_URL = __DEV__ ? 'http://192.168.31.23:3000' : 'https://pgnwork.com';

export interface ApiError {
  error: string;
  message: string;
  employmentStatus?: string;
  retryAfter?: number;
}

export interface NetworkConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(config: Partial<NetworkConfig> = {}) {
    this.baseURL = config.baseURL || API_BASE_URL || 'http://localhost:3000';
    this.timeout = config.timeout || 15000; // 15 seconds for mobile
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000; // 1 second
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`🌐 API Request (attempt ${attempt}): ${options.method} ${url}`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PGN-Mobile/1.0',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        console.log(`🔄 Retrying API request (attempt ${attempt + 1}/${this.retryAttempts}): ${url}`);
        await this.delay(this.retryDelay * attempt); // Exponential backoff
        return this.fetchWithTimeout(url, options, attempt + 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry for network errors, timeouts, and aborts
    return (
      error.name === 'TypeError' || // Network error
      error.name === 'AbortError' || // Timeout
      error.message?.includes('Network request failed')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiError: ApiError = {
        error: errorData.error || 'HTTP_ERROR',
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        employmentStatus: errorData.employmentStatus,
        retryAfter: response.headers.get('Retry-After')
          ? parseInt(response.headers.get('Retry-After')!)
          : undefined,
      };

      console.error('❌ API Error:', apiError);
      throw new Error(`${apiError.error}: ${apiError.message}`);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', data);
    return data;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;

    try {
      const response = await this.fetchWithTimeout(url, options);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('💥 API Request Failed:', {
        endpoint,
        method: options.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Network request failed');
      }
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('🔐 Mobile API: Attempting login', {
      email: credentials.email,
      hasPassword: !!credentials.password
    });

    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    console.log('🔄 Mobile API: Refreshing token');

    return this.request<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: refreshToken } as RefreshRequest),
    });
  }

  async logout(authToken: string): Promise<LogoutResponse> {
    console.log('🚪 Mobile API: Logging out');

    return this.request<LogoutResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token: authToken } as LogoutRequest),
    });
  }

  async getCurrentUser(authToken: string): Promise<AuthenticatedUser> {
    console.log('👤 Mobile API: Getting current user');

    return this.request<AuthenticatedUser>('/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  }

  async getEmployeeProfile(authToken: string): Promise<AuthenticatedUser> {
    console.log('👨‍💼 Mobile API: Getting employee profile');

    return this.request<AuthenticatedUser>('/employees/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  }

  // Utility methods for checking connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      console.log('🌐 Checking API connectivity...');

      // Simple health check
      const response = await this.fetchWithTimeout(
        `${this.baseURL}/api/health`,
        { method: 'GET' },
        1 // No retries for connectivity check
      );

      return response.ok;
    } catch (error) {
      console.log('❌ Connectivity check failed:', error);
      return false;
    }
  }

  // Method to get the current configuration
  getConfig(): NetworkConfig {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
    };
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export the class for testing
export { ApiClient };