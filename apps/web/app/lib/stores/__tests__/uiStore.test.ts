/**
 * Unit tests for UI Store using Jest
 */

import { act, renderHook } from '@testing-library/react';
import { useUIStore } from '../uiStore';

// Mock the sonner toast library
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

import { toast } from 'sonner';

describe('UI Store', () => {
  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store state before each test by clearing all loading states
    useUIStore.getState().clearAllLoading();
    // Mock console.error
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Clean up store state after each test
    useUIStore.getState().clearAllLoading();
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.loading).toEqual({});
    });
  });

  describe('showNotification', () => {
    it('should show success notification', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification('Success message', 'success');
      });

      expect(toast.success).toHaveBeenCalledWith('Success message');
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('should show error notification', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification('Error message', 'error');
      });

      expect(toast.error).toHaveBeenCalledWith('Error message');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('should show warning notification', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification('Warning message', 'warning');
      });

      expect(toast.warning).toHaveBeenCalledWith('Warning message');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });

    it('should show info notification when type is info', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification('Info message', 'info');
      });

      expect(toast.info).toHaveBeenCalledWith('Info message');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should show info notification when type is not specified', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification('Default info message');
      });

      expect(toast.info).toHaveBeenCalledWith('Default info message');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should show info notification when type is invalid', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showNotification(
          'Invalid type message',
          'invalid' as 'success' | 'error' | 'info' | 'warning'
        );
      });

      expect(toast.info).toHaveBeenCalledWith('Invalid type message');
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should handle toast errors gracefully', () => {
      const { result } = renderHook(() => useUIStore());

      // Mock toast.success to throw an error
      (toast.success as jest.Mock).mockImplementation(() => {
        throw new Error('Toast error');
      });

      // Should not throw an error
      expect(() => {
        act(() => {
          result.current.showNotification('Error message', 'success');
        });
      }).not.toThrow();

      // Should log the error to console
      expect(console.error).toHaveBeenCalledWith('Toast notification error:', expect.any(Error));
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true for a key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
      });

      expect(result.current.loading).toEqual({
        fetchData: true,
      });
    });

    it('should set loading state to false for a key', () => {
      const { result } = renderHook(() => useUIStore());

      // First set to true
      act(() => {
        result.current.setLoading('fetchData', true);
      });

      // Then set to false
      act(() => {
        result.current.setLoading('fetchData', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: false,
      });
    });

    it('should handle multiple loading keys', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
        result.current.setLoading('submitForm', true);
        result.current.setLoading('uploadFile', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: true,
        submitForm: true,
        uploadFile: false,
      });
    });

    it('should preserve existing loading states when adding new ones', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
      });

      act(() => {
        result.current.setLoading('submitForm', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: true,
        submitForm: false,
      });
    });

    it('should update existing loading state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
      });

      act(() => {
        result.current.setLoading('fetchData', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: false,
      });
    });

    it('should handle empty key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('', true);
      });

      expect(result.current.loading).toEqual({
        '': true,
      });
    });

    it('should handle special characters in key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetch-data_special.key', true);
      });

      expect(result.current.loading).toEqual({
        'fetch-data_special.key': true,
      });
    });
  });

  describe('getLoading', () => {
    it('should return false for non-existent key', () => {
      const { result } = renderHook(() => useUIStore());

      const isLoading = result.current.getLoading('nonExistentKey');

      expect(isLoading).toBe(false);
    });

    it('should return true for key set to true', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
      });

      const isLoading = result.current.getLoading('fetchData');

      expect(isLoading).toBe(true);
    });

    it('should return false for key set to false', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', false);
      });

      const isLoading = result.current.getLoading('fetchData');

      expect(isLoading).toBe(false);
    });

    it('should return correct value for multiple keys', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
        result.current.setLoading('submitForm', false);
        result.current.setLoading('uploadFile', true);
      });

      expect(result.current.getLoading('fetchData')).toBe(true);
      expect(result.current.getLoading('submitForm')).toBe(false);
      expect(result.current.getLoading('uploadFile')).toBe(true);
      expect(result.current.getLoading('nonExistent')).toBe(false);
    });

    it('should handle empty key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('', true);
      });

      const isLoading = result.current.getLoading('');

      expect(isLoading).toBe(true);
    });

    it('should handle special characters in key', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetch-data_special.key', true);
      });

      const isLoading = result.current.getLoading('fetch-data_special.key');

      expect(isLoading).toBe(true);
    });
  });

  describe('clearAllLoading', () => {
    it('should clear all loading states', () => {
      const { result } = renderHook(() => useUIStore());

      // Set multiple loading states
      act(() => {
        result.current.setLoading('fetchData', true);
        result.current.setLoading('submitForm', false);
        result.current.setLoading('uploadFile', true);
      });

      // Verify states are set
      expect(result.current.loading).toEqual({
        fetchData: true,
        submitForm: false,
        uploadFile: true,
      });

      // Clear all loading states
      act(() => {
        result.current.clearAllLoading();
      });

      // Verify all states are cleared
      expect(result.current.loading).toEqual({});
    });

    it('should work when there are no loading states', () => {
      const { result } = renderHook(() => useUIStore());

      // Verify initial state is empty
      expect(result.current.loading).toEqual({});

      // Clear all loading states
      act(() => {
        result.current.clearAllLoading();
      });

      // Verify state is still empty
      expect(result.current.loading).toEqual({});
    });

    it('should work when there is only one loading state', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('fetchData', true);
      });

      // Verify state is set
      expect(result.current.loading).toEqual({
        fetchData: true,
      });

      // Clear all loading states
      act(() => {
        result.current.clearAllLoading();
      });

      // Verify state is cleared
      expect(result.current.loading).toEqual({});
    });

    it('should work with empty and special character keys', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading('', true);
        result.current.setLoading('fetch-data_special.key', false);
      });

      // Verify states are set
      expect(result.current.loading).toEqual({
        '': true,
        'fetch-data_special.key': false,
      });

      // Clear all loading states
      act(() => {
        result.current.clearAllLoading();
      });

      // Verify all states are cleared
      expect(result.current.loading).toEqual({});
    });
  });

  describe('Integration Tests', () => {
    it('should maintain loading state correctly through multiple operations', () => {
      const { result } = renderHook(() => useUIStore());

      // Set initial loading states
      act(() => {
        result.current.setLoading('fetchData', true);
        result.current.setLoading('submitForm', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: true,
        submitForm: false,
      });

      // Update one loading state
      act(() => {
        result.current.setLoading('fetchData', false);
      });

      expect(result.current.loading).toEqual({
        fetchData: false,
        submitForm: false,
      });

      // Add a new loading state
      act(() => {
        result.current.setLoading('uploadFile', true);
      });

      expect(result.current.loading).toEqual({
        fetchData: false,
        submitForm: false,
        uploadFile: true,
      });

      // Clear all loading states
      act(() => {
        result.current.clearAllLoading();
      });

      expect(result.current.loading).toEqual({});
    });

    it('should handle notifications and loading states independently', () => {
      const { result } = renderHook(() => useUIStore());

      // Set loading state
      act(() => {
        result.current.setLoading('fetchData', true);
      });

      // Show notification
      act(() => {
        result.current.showNotification('Data fetched successfully', 'success');
      });

      // Verify both operations worked
      expect(result.current.loading).toEqual({
        fetchData: true,
      });
      expect(toast.success).toHaveBeenCalledWith('Data fetched successfully');

      // Clear loading
      act(() => {
        result.current.setLoading('fetchData', false);
      });

      // Show another notification
      act(() => {
        result.current.showNotification('Operation complete', 'info');
      });

      // Verify final state
      expect(result.current.loading).toEqual({
        fetchData: false,
      });
      expect(toast.info).toHaveBeenCalledWith('Operation complete');
    });

    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useUIStore());

      // Rapidly change loading states
      act(() => {
        result.current.setLoading('key1', true);
        result.current.setLoading('key2', true);
        result.current.setLoading('key1', false);
        result.current.setLoading('key3', true);
        result.current.setLoading('key2', false);
        result.current.setLoading('key3', false);
      });

      expect(result.current.loading).toEqual({
        key1: false,
        key2: false,
        key3: false,
      });

      // Verify getLoading returns correct values
      expect(result.current.getLoading('key1')).toBe(false);
      expect(result.current.getLoading('key2')).toBe(false);
      expect(result.current.getLoading('key3')).toBe(false);
      expect(result.current.getLoading('key4')).toBe(false);
    });
  });
});
