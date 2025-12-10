import { renderHook, act } from '@testing-library/react';
import { useColorScheme } from '../use-color-scheme.web';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Mock react-native's useColorScheme
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(),
}));

const mockUseRNColorScheme = useRNColorScheme as jest.MockedFunction<typeof useRNColorScheme>;

describe('useColorScheme (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseRNColorScheme.mockReturnValue('light');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return light during initial render', () => {
    const { result } = renderHook(() => useColorScheme());

    expect(result.current).toBe('light');
  });

  it('should return RN colorScheme after hydration', async () => {
    // Mock the RN hook to return a specific value
    mockUseRNColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() => useColorScheme());

    // Wait for useEffect to complete (hydration)
    act(() => {
      // Force flush of effects
      jest.advanceTimersByTime(0);
    });

    // After hydration, should return the RN colorScheme
    expect(result.current).toBe('dark');
  });

  it('should handle null/undefined color scheme gracefully', () => {
    mockUseRNColorScheme.mockReturnValue(null);

    const { result } = renderHook(() => useColorScheme());

    act(() => {
      jest.advanceTimersByTime(0);
    });

    // Should return whatever RN returns (even null)
    expect(result.current).toBeNull();
  });

  it('should handle light color scheme', () => {
    mockUseRNColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useColorScheme());

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('light');
  });

  it('should preserve the same color scheme across re-renders after hydration', () => {
    mockUseRNColorScheme.mockReturnValue('dark');

    const { result, rerender } = renderHook(() => useColorScheme());

    // Trigger hydration
    act(() => {
      jest.advanceTimersByTime(0);
    });

    rerender();
    const firstHydratedValue = result.current;

    rerender();
    expect(result.current).toBe(firstHydratedValue);
  });

  it('should use fake timers for useEffect', () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBeDefined();
  });

  it('should handle unmount without errors', () => {
    const { unmount } = renderHook(() => useColorScheme());

    expect(() => unmount()).not.toThrow();
  });

  it('should handle rapid re-renders during hydration', () => {
    const { result, rerender } = renderHook(() => useColorScheme());

    // Multiple rapid re-renders during hydration
    rerender();
    rerender();
    rerender();

    act(() => {
      // Force flush of effects
      jest.advanceTimersByTime(0);
    });

    rerender();

    // Should not throw and should have a value
    expect(typeof result.current).toBe('string');
  });
});