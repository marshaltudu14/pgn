/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia;
  const originalInnerWidth = window.innerWidth;

  beforeAll(() => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterAll(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: originalInnerWidth,
    });
  });

  it('should return true when width is less than 768px', () => {
    // Set window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 500,
    });

    // Mock matchMedia to match mobile query
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: true,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('should return false when width is greater than or equal to 768px', () => {
    // Set window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    // Mock matchMedia to not match mobile query
    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should update when window resize event occurs', () => {
    // Start with desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    let changeHandler: () => void;
    const addEventListenerMock = jest.fn((event, handler) => {
      if (event === 'change') {
        changeHandler = handler;
      }
    });

    (window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: addEventListenerMock,
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 500,
      });
      if (changeHandler) {
        changeHandler();
      }
    });

    expect(result.current).toBe(true);
  });
});
