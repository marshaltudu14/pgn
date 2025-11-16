import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'pgn_auth_token',
  REFRESH_TOKEN: 'pgn_refresh_token',
  USER_ID: 'pgn_user_id',
  EMPLOYEE_DATA: 'pgn_employee_data',
  BIOMETRIC_ENABLED: 'pgn_biometric_enabled',
  BIOMETRIC_SETUP: 'pgn_biometric_setup',
  LAST_LOGIN: 'pgn_last_login',
  APP_VERSION: 'pgn_app_version',
} as const;

// SecureStore options for different data types
const SECURE_OPTIONS = {
  // For authentication tokens - highest security
  TOKENS: {
    requireAuthentication: true, // Require biometric/passcode to access
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  },
  // For user preferences - medium security
  PREFERENCES: {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  },
  // For temporary data - lower security
  TEMPORARY: {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  },
} as const;

export interface StoredUser {
  id: string;
  humanReadableId: string;
  fullName: string;
  email: string;
  employmentStatus: string;
  canLogin: boolean;
}

export interface BiometricPreferences {
  enabled: boolean;
  setupComplete: boolean;
  lastUsed?: number;
}

export class SecureTokenStorage {
  private isSecureStoreAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.isSecureStoreAvailable = await SecureStore.isAvailableAsync();
      console.log(
        '🔒 SecureStore available:',
        this.isSecureStoreAvailable
      );
    } catch (error) {
      console.error('❌ Failed to initialize SecureStore:', error);
      this.isSecureStoreAvailable = false;
    }
  }

  private getStorageKey(key: string): string {
    return key;
  }

  private getSecureOptions(type: keyof typeof SECURE_OPTIONS) {
    if (!this.isSecureStoreAvailable) {
      return {};
    }
    return SECURE_OPTIONS[type];
  }

  // Authentication Token Management
  async setAuthToken(token: string): Promise<void> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);
      const options = this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, token, options);
        console.log('✅ Auth token stored securely');
      } else {
        // Fallback to localStorage for web development
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, token);
          console.log('⚠️ Auth token stored in localStorage (fallback)');
        } else {
          throw new Error('No secure storage available');
        }
      }
    } catch (error) {
      console.error('❌ Failed to store auth token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);

      if (this.isSecureStoreAvailable) {
        const token = await SecureStore.getItemAsync(key, this.getSecureOptions('TOKENS'));
        console.log(token ? '✅ Auth token retrieved' : 'ℹ️ No auth token found');
        return token;
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = window.localStorage.getItem(key);
          console.log(token ? '⚠️ Auth token retrieved from localStorage' : 'ℹ️ No auth token found');
          return token;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to retrieve auth token:', error);
      return null;
    }
  }

  async removeAuthToken(): Promise<void> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);

      if (this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
        console.log('✅ Auth token removed from secure storage');
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
          console.log('⚠️ Auth token removed from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ Failed to remove auth token:', error);
      throw new Error('Failed to remove authentication token');
    }
  }

  // Refresh Token Management
  async setRefreshToken(token: string): Promise<void> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN);
      const options = this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, token, options);
        console.log('✅ Refresh token stored securely');
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, token);
          console.log('⚠️ Refresh token stored in localStorage (fallback)');
        }
      }
    } catch (error) {
      console.error('❌ Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN);

      if (this.isSecureStoreAvailable) {
        const token = await SecureStore.getItemAsync(key, this.getSecureOptions('TOKENS'));
        return token;
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to retrieve refresh token:', error);
      return null;
    }
  }

  // User Data Management
  async setUserData(user: StoredUser): Promise<void> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.EMPLOYEE_DATA);
      const userJson = JSON.stringify(user);
      const options = this.getSecureOptions('PREFERENCES');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, userJson, options);
        console.log('✅ User data stored securely');
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, userJson);
          console.log('⚠️ User data stored in localStorage (fallback)');
        }
      }
    } catch (error) {
      console.error('❌ Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  async getUserData(): Promise<StoredUser | null> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.EMPLOYEE_DATA);

      if (this.isSecureStoreAvailable) {
        const userData = await SecureStore.getItemAsync(key, this.getSecureOptions('PREFERENCES'));
        return userData ? JSON.parse(userData) : null;
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          const userData = window.localStorage.getItem(key);
          return userData ? JSON.parse(userData) : null;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to retrieve user data:', error);
      return null;
    }
  }

  // Biometric Preferences Management
  async setBiometricPreferences(preferences: BiometricPreferences): Promise<void> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.BIOMETRIC_ENABLED);
      const prefsJson = JSON.stringify(preferences);
      const options = this.getSecureOptions('PREFERENCES');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, prefsJson, options);
        console.log('✅ Biometric preferences stored securely');
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, prefsJson);
          console.log('⚠️ Biometric preferences stored in localStorage (fallback)');
        }
      }
    } catch (error) {
      console.error('❌ Failed to store biometric preferences:', error);
      throw new Error('Failed to store biometric preferences');
    }
  }

  async getBiometricPreferences(): Promise<BiometricPreferences | null> {
    try {
      const key = this.getStorageKey(STORAGE_KEYS.BIOMETRIC_ENABLED);

      if (this.isSecureStoreAvailable) {
        const prefs = await SecureStore.getItemAsync(key, this.getSecureOptions('PREFERENCES'));
        return prefs ? JSON.parse(prefs) : null;
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          const prefs = window.localStorage.getItem(key);
          return prefs ? JSON.parse(prefs) : null;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to retrieve biometric preferences:', error);
      return null;
    }
  }

  // Utility Methods
  async clearAllAuthData(): Promise<void> {
    try {
      console.log('🧹 Clearing all authentication data...');

      const keys = Object.values(STORAGE_KEYS);

      if (this.isSecureStoreAvailable) {
        await Promise.all(keys.map(key =>
          SecureStore.deleteItemAsync(this.getStorageKey(key)).catch(error =>
            console.warn(`Failed to delete ${key}:`, error)
          )
        ));
        console.log('✅ All auth data cleared from secure storage');
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => window.localStorage.removeItem(this.getStorageKey(key)));
          console.log('⚠️ All auth data cleared from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw new Error('Failed to clear authentication data');
    }
  }

  async hasStoredCredentials(): Promise<boolean> {
    try {
      const authToken = await this.getAuthToken();
      const userData = await this.getUserData();
      return !!(authToken && userData);
    } catch (error) {
      console.error('❌ Failed to check stored credentials:', error);
      return false;
    }
  }

  // Migration and backup methods
  async backupCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      const authToken = await this.getAuthToken();
      const userData = await this.getUserData();
      const biometricPrefs = await this.getBiometricPreferences();

      if (!authToken || !userData) {
        return { success: false, error: 'No credentials to backup' };
      }

      // Create backup object
      const backup = {
        authToken,
        userData,
        biometricPrefs,
        timestamp: Date.now(),
        version: '1.0',
      };

      // Store with backup key
      const backupKey = `${STORAGE_KEYS.AUTH_TOKEN}_backup`;
      const backupJson = JSON.stringify(backup);
      const options = this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(backupKey, backupJson, options);
        console.log('✅ Credentials backed up successfully');
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(backupKey, backupJson);
          console.log('⚠️ Credentials backed up to localStorage');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to backup credentials:', error);
      return { success: false, error: 'Failed to backup credentials' };
    }
  }

  async isAvailable(): Promise<boolean> {
    return this.isSecureStoreAvailable;
  }

  async getStorageInfo(): Promise<{
    available: boolean;
    platform: string;
    hasStoredCredentials: boolean;
  }> {
    return {
      available: this.isSecureStoreAvailable,
      platform: Platform.OS,
      hasStoredCredentials: await this.hasStoredCredentials(),
    };
  }
}

// Create singleton instance
export const secureStorage = new SecureTokenStorage();