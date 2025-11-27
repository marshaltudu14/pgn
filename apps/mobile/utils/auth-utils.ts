/**
 * Authentication utilities for mobile app
 *
 * This file provides authentication utilities without creating circular dependencies.
 * It handles token storage, retrieval, and validation.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Session interface for JWT token management like dukancard
export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number; // Calculated expiry timestamp
}

// Storage keys - using same keys as auth-store for backward compatibility
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pgn_auth_token',
  REFRESH_TOKEN: 'pgn_refresh_token',
  EXPIRES_AT: 'pgn_expires_at',
  EXPIRES_IN: 'pgn_expires_in',
  // Additional keys for employee data
  EMPLOYEE_DATA: 'pgn_employee_data',
  USER_ID: 'pgn_user_id',
  LAST_LOGIN: 'pgn_last_login',
};

/**
 * Session management utilities
 */
export class SessionManager {
  /**
   * Save authentication session to AsyncStorage
   */
  static async saveSession(session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): Promise<void> {
    const expiresAt = Date.now() + (session.expiresIn * 1000);

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.ACCESS_TOKEN, session.accessToken],
      [STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken],
      [STORAGE_KEYS.EXPIRES_IN, session.expiresIn.toString()],
      [STORAGE_KEYS.EXPIRES_AT, expiresAt.toString()],
    ]);
  }

  /**
   * Load authentication session from AsyncStorage
   */
  static async loadSession(): Promise<Session | null> {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.EXPIRES_IN,
        STORAGE_KEYS.EXPIRES_AT,
      ]);

      const [
        [, accessToken],
        [, refreshToken],
        [, expiresInStr],
        [, expiresAtStr],
      ] = values;

      if (!accessToken || !refreshToken || !expiresInStr) {
        return null;
      }

      const expiresIn = parseInt(expiresInStr, 10);
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

      return {
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt,
      };
    } catch (error) {
      console.warn('Error loading session:', error);
      return null;
    }
  }

  /**
   * Clear authentication session from AsyncStorage
   */
  static async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.EXPIRES_IN,
      STORAGE_KEYS.EXPIRES_AT,
      STORAGE_KEYS.EMPLOYEE_DATA,
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.LAST_LOGIN,
    ]);
  }

  /**
   * Check if current session is expired
   */
  static isSessionExpired(session: Session): boolean {
    if (!session.expiresAt) {
      // If we don't have an explicit expiry time, check against expiresIn
      // This is a fallback - ideally we always have expiresAt
      return false;
    }
    return Date.now() >= session.expiresAt;
  }

  /**
   * Get current access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const session = await this.loadSession();
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        await this.clearSession();
        return null;
      }

      return session.accessToken;
    } catch (error) {
      console.warn('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get current refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      const session = await this.loadSession();
      return session?.refreshToken || null;
    } catch (error) {
      console.warn('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Debug method to check what tokens are currently stored
   */
  static async debugStoredTokens(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key =>
        key.includes('pgn') || key.includes('auth') || key.includes('token')
      );

    } catch (error) {
      console.warn('Error debugging stored tokens:', error);
    }
  }
}