/**
 * @jest-environment jsdom
 */
import { useSidebar } from '@/components/ui/sidebar';
import { act, renderHook } from '@testing-library/react';
import { useSidebarSwipe } from '../use-sidebar-swipe';

// Mock the useSidebar hook
jest.mock('@/components/ui/sidebar');

// Helper function to create a complete mock for useSidebar
const createMockSidebar = (overrides: Record<string, unknown> = {}) => ({
  state: 'expanded' as const,
  open: true,
  setOpen: jest.fn(),
  openMobile: false,
  setOpenMobile: jest.fn(),
  isMobile: true,
  toggleSidebar: jest.fn(),
  ...overrides,
});

describe('useSidebarSwipe', () => {
  let mockUseSidebar: jest.MockedFunction<typeof useSidebar>;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get the mocked useSidebar function
    mockUseSidebar = useSidebar as jest.MockedFunction<typeof useSidebar>;

    // Spy on document event listeners
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    // Restore spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should add touch event listeners on mount and remove on unmount', () => {
    // Mock useSidebar return values
    const mockSetOpenMobile = jest.fn();
    mockUseSidebar.mockReturnValue(
      createMockSidebar({
        isMobile: true,
        openMobile: false,
        setOpenMobile: mockSetOpenMobile,
      })
    );

    const { unmount } = renderHook(() => useSidebarSwipe());

    // Verify event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
      { passive: true }
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: true }
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function),
      { passive: true }
    );

    // Unmount the hook
    unmount();

    // Verify event listeners were removed
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function)
    );
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    );
  });

  it('should not trigger sidebar actions when not on mobile', () => {
    const mockSetOpenMobile = jest.fn();

    // Mock useSidebar return values for desktop
    mockUseSidebar.mockReturnValue(
      createMockSidebar({
        isMobile: false,
        openMobile: false,
        setOpenMobile: mockSetOpenMobile,
      })
    );

    renderHook(() => useSidebarSwipe());

    // Get the touchend handler
    const touchendHandler = addEventListenerSpy.mock.calls.find(
      ([event]) => event === 'touchend'
    )?.[1];

    // Simulate a right swipe that would normally open the sidebar
    act(() => {
      // Simulate touchstart
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      touchstartHandler({
        touches: [{ clientX: 10, clientY: 100 }],
      });

      // Simulate touchmove
      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      touchmoveHandler({
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Simulate touchend
      touchendHandler();
    });

    // setOpenMobile should not be called when not on mobile
    expect(mockSetOpenMobile).not.toHaveBeenCalled();
  });

  describe('when sidebar is closed', () => {
    it('should open sidebar on right swipe from left edge', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a right swipe from left edge
      act(() => {
        // Start touch at left edge (within MAX_EDGE_DISTANCE of 30px)
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch to the right (more than MIN_SWIPE_DISTANCE of 50px)
        touchmoveHandler({
          touches: [{ clientX: 100, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should be opened
      expect(mockSetOpenMobile).toHaveBeenCalledWith(true);
    });

    it('should not open sidebar on right swipe from outside left edge', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a right swipe from outside left edge
      act(() => {
        // Start touch outside left edge (more than MAX_EDGE_DISTANCE of 30px)
        touchstartHandler({
          touches: [{ clientX: 50, clientY: 100 }],
        });

        // Move touch to the right
        touchmoveHandler({
          touches: [{ clientX: 120, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });

    it('should not open sidebar on left swipe', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a left swipe from left edge
      act(() => {
        // Start touch at left edge
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch to the left
        touchmoveHandler({
          touches: [{ clientX: -30, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });
  });

  describe('when sidebar is open', () => {
    it('should close sidebar on left swipe from anywhere', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: true,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a left swipe from middle of screen
      act(() => {
        // Start touch in the middle of screen
        touchstartHandler({
          touches: [{ clientX: 200, clientY: 100 }],
        });

        // Move touch to the left (more than MIN_SWIPE_DISTANCE of 50px)
        touchmoveHandler({
          touches: [{ clientX: 100, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should be closed
      expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
    });

    it('should not close sidebar on right swipe', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: true,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a right swipe from middle of screen
      act(() => {
        // Start touch in the middle of screen
        touchstartHandler({
          touches: [{ clientX: 100, clientY: 100 }],
        });

        // Move touch to the right
        touchmoveHandler({
          touches: [{ clientX: 200, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be closed
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });
  });

  describe('swipe validation', () => {
    it('should not trigger action for short swipes', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a short right swipe (less than MIN_SWIPE_DISTANCE of 50px)
      act(() => {
        // Start touch at left edge
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch to the right (less than MIN_SWIPE_DISTANCE)
        touchmoveHandler({
          touches: [{ clientX: 40, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });

    it('should not trigger action for swipes with too much vertical movement', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a swipe with too much vertical movement (more than MAX_VERTICAL_DEVIATION of 100px)
      act(() => {
        // Start touch at left edge
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch to the right and down (horizontal distance is enough, but vertical is too much)
        touchmoveHandler({
          touches: [{ clientX: 100, clientY: 250 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });

    it('should reset touch values after handling swipe', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate a valid swipe
      act(() => {
        // Start touch at left edge
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch to the right
        touchmoveHandler({
          touches: [{ clientX: 100, clientY: 100 }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should be opened
      expect(mockSetOpenMobile).toHaveBeenCalledWith(true);

      // Simulate another touch without proper start
      act(() => {
        // Try to handle touchend without a proper touchstart
        touchendHandler();
      });

      // setOpenMobile should only have been called once
      expect(mockSetOpenMobile).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle missing touch coordinates gracefully', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touch handlers
      const touchstartHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchstart'
      )?.[1];

      const touchmoveHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchmove'
      )?.[1];

      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate touch with missing coordinates
      act(() => {
        // Start touch with valid coordinates
        touchstartHandler({
          touches: [{ clientX: 20, clientY: 100 }],
        });

        // Move touch with missing coordinates
        touchmoveHandler({
          touches: [{ clientX: undefined, clientY: undefined }],
        });

        // End touch
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });

    it('should handle touchend without touchstart gracefully', () => {
      const mockSetOpenMobile = jest.fn();

      // Mock useSidebar return values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      renderHook(() => useSidebarSwipe());

      // Get the touchend handler
      const touchendHandler = addEventListenerSpy.mock.calls.find(
        ([event]) => event === 'touchend'
      )?.[1];

      // Simulate touchend without touchstart
      act(() => {
        touchendHandler();
      });

      // Sidebar should not be opened
      expect(mockSetOpenMobile).not.toHaveBeenCalled();
    });
  });

  describe('dependency updates', () => {
    it('should re-register event listeners when dependencies change', () => {
      const mockSetOpenMobile = jest.fn();

      // Initial mock values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: true,
          openMobile: false,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      const { rerender } = renderHook(() => useSidebarSwipe());

      // Clear the mock to track new calls
      addEventListenerSpy.mockClear();

      // Update mock values
      mockUseSidebar.mockReturnValue(
        createMockSidebar({
          isMobile: false,
          openMobile: true,
          setOpenMobile: mockSetOpenMobile,
        })
      );

      // Rerender the hook
      rerender();

      // Verify event listeners were added again
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        { passive: true }
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function),
        { passive: true }
      );
    });
  });
});
