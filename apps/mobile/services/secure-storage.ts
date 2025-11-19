import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Check if expo-secure-store is available
const isSecureStoreLibraryAvailable = (): boolean => {
  try {
    return !!SecureStore.isAvailableAsync;
  } catch (error) {
    console.error('❌ expo-secure-store library not available:', error);
    return false;
  }
};

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'pgn_auth_token',
  REFRESH_TOKEN: 'pgn_refresh_token',
  USER_ID: 'pgn_user_id',
  EMPLOYEE_DATA: 'pgn_employee_data',
  LAST_LOGIN: 'pgn_last_login',
  APP_VERSION: 'pgn_app_version',
} as const;

// SecureStore options for different data types
const SECURE_OPTIONS = {
  // For authentication tokens - highest security
  TOKENS: {
    requireAuthentication: false, // Don't require biometrics for token access
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
  employmentStatus: string; // Keep as string for storage compatibility
  canLogin: boolean;
  department?: string;
  region?: string;
  startDate?: string;
  profilePhotoUrl?: string;
  phone?: string;
  primaryRegion?: string;
  regionCode?: string;
  assignedRegions?: string[];
}

export class SecureTokenStorage {
  private isSecureStoreAvailable: boolean | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // First check if the library is available
      if (!isSecureStoreLibraryAvailable()) {
        console.warn('⚠️ expo-secure-store library not available, using fallback');
        this.isSecureStoreAvailable = false;
        return;
      }

      // Check if SecureStore is available on this platform
      this.isSecureStoreAvailable = await SecureStore.isAvailableAsync();
    } catch (error) {
      console.error('❌ Failed to initialize SecureStore:', error);
      this.isSecureStoreAvailable = false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  private getStorageKey(key: string): string {
    return key;
  }

  private async getSecureOptions(type: keyof typeof SECURE_OPTIONS) {
    await this.ensureInitialized();
    if (!this.isSecureStoreAvailable) {
      return {};
    }
    return SECURE_OPTIONS[type];
  }

  // Authentication Token Management
  async setAuthToken(token: string): Promise<void> {
    try {
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);
      const options = await this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, token, options);
      } else {
        // Fallback to localStorage for web development
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, token);
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
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);

      if (this.isSecureStoreAvailable) {
        const token = await SecureStore.getItemAsync(key, await this.getSecureOptions('TOKENS'));
        return token;
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          const token = window.localStorage.getItem(key);
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
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.AUTH_TOKEN);

      if (this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        // Fallback to localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
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
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN);
      const options = await this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, token, options);
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, token);
        }
      }
    } catch (error) {
      console.error('❌ Failed to store refresh token:', error);
      throw new Error('Failed to store refresh token');
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.REFRESH_TOKEN);

      if (this.isSecureStoreAvailable) {
        const token = await SecureStore.getItemAsync(key, await this.getSecureOptions('TOKENS'));
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
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.EMPLOYEE_DATA);
      const userJson = JSON.stringify(user);
      const options = await this.getSecureOptions('PREFERENCES');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, userJson, options);
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, userJson);
        }
      }
    } catch (error) {
      console.error('❌ Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  async getUserData(): Promise<StoredUser | null> {
    try {
      await this.ensureInitialized();
      const key = this.getStorageKey(STORAGE_KEYS.EMPLOYEE_DATA);

      if (this.isSecureStoreAvailable) {
        const userData = await SecureStore.getItemAsync(key, await this.getSecureOptions('PREFERENCES'));
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

  
  // Utility Methods
  async clearAllAuthData(): Promise<void> {
    try {
      await this.ensureInitialized();
      const keys = Object.values(STORAGE_KEYS);

      if (this.isSecureStoreAvailable) {
        await Promise.all(keys.map(key =>
          SecureStore.deleteItemAsync(this.getStorageKey(key)).catch(error =>
            console.warn(`Failed to delete ${key}:`, error)
          )
        ));
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => window.localStorage.removeItem(this.getStorageKey(key)));
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

      if (!authToken || !userData) {
        return { success: false, error: 'No credentials to backup' };
      }

      // Create backup object
      const backup = {
        authToken,
        userData,
        timestamp: Date.now(),
        version: '1.0',
      };

      // Store with backup key
      const backupKey = `${STORAGE_KEYS.AUTH_TOKEN}_backup`;
      const backupJson = JSON.stringify(backup);
      const options = await this.getSecureOptions('TOKENS');

      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(backupKey, backupJson, options);
      } else {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(backupKey, backupJson);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to backup credentials:', error);
      return { success: false, error: 'Failed to backup credentials' };
    }
  }

  async isAvailable(): Promise<boolean> {
    await this.ensureInitialized();
    return this.isSecureStoreAvailable || false;
  }

  async getStorageInfo(): Promise<{
    available: boolean;
    platform: string;
    hasStoredCredentials: boolean;
  }> {
    await this.ensureInitialized();
    return {
      available: this.isSecureStoreAvailable || false,
      platform: Platform.OS,
      hasStoredCredentials: await this.hasStoredCredentials(),
    };
  }
}

// Create singleton instance
export const secureStorage = new SecureTokenStorage();