import {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  LogoutResponse,
  AuthenticatedUser
} from '@pgn/shared';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  getApiHeaders
} from '@/constants/api';

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
    this.baseURL = config.baseURL || API_BASE_URL;
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
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...getApiHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
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
    return data;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint);

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
    return this.request<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return this.request<RefreshResponse>(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ token: refreshToken } as RefreshRequest),
    });
  }

  async logout(authToken: string): Promise<LogoutResponse> {
    return this.request<LogoutResponse>(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ token: authToken } as LogoutRequest),
    });
  }

  async getCurrentUser(authToken: string): Promise<AuthenticatedUser> {
    return this.request<AuthenticatedUser>(API_ENDPOINTS.GET_USER, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
  }

  // Utility methods for checking connectivity
  async checkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity check by attempting to reach the auth endpoint
      const response = await this.fetchWithTimeout(
        buildApiUrl(API_ENDPOINTS.LOGIN),
        { method: 'GET' }, // Will get 405 Method Not Allowed, but that's fine for connectivity check
        1 // No retries for connectivity check
      );

      return response.status === 405; // 405 means server is reachable
    } catch {
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