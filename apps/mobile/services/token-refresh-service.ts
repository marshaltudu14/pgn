/**
 * Token Refresh Service
 * Proactively refreshes JWT tokens to maintain logged-in state
 */

import { SessionManager } from '@/utils/auth-utils';

class TokenRefreshService {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly TOKEN_EXPIRY_BUFFER = 2 * 60 * 1000; // Refresh 2 minutes before expiry

  /**
   * Start the periodic token refresh check
   */
  start() {
    // Clear any existing interval
    this.stop();

    console.log('[TokenRefreshService] Starting periodic token refresh checks');

    this.refreshInterval = setInterval(async () => {
      await this.checkAndRefreshToken();
    }, this.REFRESH_CHECK_INTERVAL);
  }

  /**
   * Stop the periodic token refresh check
   */
  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[TokenRefreshService] Stopped periodic token refresh checks');
    }
  }

  /**
   * Check token and refresh if needed
   */
  async checkAndRefreshToken(): Promise<boolean> {
    try {
      const session = await SessionManager.loadSession();

      if (!session) {
        console.log('[TokenRefreshService] No active session');
        return false;
      }

      const timeUntilExpiry = session.expiresAt ? session.expiresAt - Date.now() : Infinity;

      // Refresh if token is expiring within the buffer time
      if (timeUntilExpiry <= this.TOKEN_EXPIRY_BUFFER) {
        console.log('[TokenRefreshService] Token expiring soon, refreshing...');

        // Import api client here to avoid circular dependency
        const { refreshTokenAPI } = await import('./api-client');
        const refreshSuccess = await refreshTokenAPI(session.refreshToken);

        if (refreshSuccess) {
          console.log('[TokenRefreshService] Token refreshed successfully');
          return true;
        } else {
          console.error('[TokenRefreshService] Token refresh failed, clearing session');
          await SessionManager.clearSession();

          // Emit event to notify app about logout
          this.emitLogoutEvent();
          return false;
        }
      } else {
        console.log(`[TokenRefreshService] Token valid, expires in ${Math.round(timeUntilExpiry / 1000)}s`);
        return true;
      }
    } catch (error) {
      console.error('[TokenRefreshService] Error checking token:', error);
      return false;
    }
  }

  /**
   * Emit logout event to notify app components
   */
  private emitLogoutEvent() {
    // In a real app, you might use an event emitter or global state manager
    // For now, we'll just log it
    console.log('[TokenRefreshService] User logged out due to token expiry');
  }

  /**
   * Force an immediate token refresh
   */
  async forceRefresh(): Promise<boolean> {
    console.log('[TokenRefreshService] Forcing immediate token refresh');
    return await this.checkAndRefreshToken();
  }
}

// Export singleton instance
export const tokenRefreshService = new TokenRefreshService();