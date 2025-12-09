import { renderHook } from '@testing-library/react';
import { useThemeColor } from '../use-theme-color';

// Mock useColorScheme
const mockUseColorScheme = jest.fn();
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667, scale: 2, fontScale: 1 })),
  },
  PixelRatio: {
    get: jest.fn(() => 2),
    getFontScale: jest.fn(() => 1),
    getPixelSizeForLayoutSize: jest.fn((layoutSize) => layoutSize * 2),
    roundToNearestPixel: jest.fn((layoutSize) => layoutSize),
  },
  Alert: {
    alert: jest.fn(),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
    compose: jest.fn((style1, style2) => ({ ...style1, ...style2 })),
  },
  Animated: {
    Value: jest.fn(),
    event: jest.fn(),
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    decay: jest.fn(() => ({ start: jest.fn() })),
    seq: jest.fn(),
    parallel: jest.fn(),
    stagger: jest.fn(),
    delay: jest.fn(),
  },
  useColorScheme: () => mockUseColorScheme(),
}));

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