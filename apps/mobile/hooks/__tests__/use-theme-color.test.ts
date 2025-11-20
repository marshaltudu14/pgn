import { renderHook } from '@testing-library/react-hooks';
import { useThemeColor } from '../use-theme-color';
import { useColorScheme } from 'react-native';

// Extract mock from global jest.setup.js mock
const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('light');
  });

  it('should return correct theme colors for light mode', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useThemeColor({}, 'background'));

    expect(result.current).toBe('#fff');
  });

  it('should return correct theme colors for dark mode', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { result } = renderHook(() => useThemeColor({}, 'background'));

    expect(result.current).toBe('#151718');
  });

  it('should use props light color when provided', () => {
    mockUseColorScheme.mockReturnValue('light');
    const customColor = '#FF0000';

    const { result } = renderHook(() => useThemeColor({ light: customColor }, 'background'));

    expect(result.current).toBe(customColor);
  });

  it('should use props dark color when provided', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const customColor = '#00FF00';

    const { result } = renderHook(() => useThemeColor({ dark: customColor }, 'background'));

    expect(result.current).toBe(customColor);
  });

  it('should fallback to default colors when props not provided', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useThemeColor({}, 'text'));

    expect(result.current).toBe('#11181C');
  });

  it('should be stable across re-renders with same color scheme', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result, rerender } = renderHook(() => useThemeColor({}, 'icon'));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('should update when color scheme changes', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result, rerender } = renderHook(() => useThemeColor({}, 'background'));

    expect(result.current).toBe('#fff');

    // Change color scheme
    mockUseColorScheme.mockReturnValue('dark');
    rerender();

    expect(result.current).toBe('#151718');
  });

  it('should return valid color codes in hex format', () => {
    mockUseColorScheme.mockReturnValue('light');

    const { result } = renderHook(() => useThemeColor({}, 'tint'));

    expect(result.current).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should handle re-initialization properly', () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { unmount } = renderHook(() => useThemeColor({}, 'text'));

    // Should not throw during unmount
    expect(() => unmount()).not.toThrow();
  });
});