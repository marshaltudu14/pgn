'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

export function useSidebarSwipe() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const openMobileRef = useRef(openMobile);

  // Update the ref whenever openMobile changes
  useEffect(() => {
    openMobileRef.current = openMobile;
  }, [openMobile]);

  // Minimum swipe distance in pixels
  const MIN_SWIPE_DISTANCE = 50;
  // Maximum vertical deviation to prevent accidental vertical swipes
  const MAX_VERTICAL_DEVIATION = 100;
  // Maximum horizontal distance from left edge where swipe can start for opening
  const MAX_EDGE_DISTANCE = 30;

  // Memoize the setOpenMobile callback to prevent infinite re-renders
  const handleSetOpenMobile = useCallback((open: boolean) => {
    setOpenMobile(open);
  }, [setOpenMobile]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Track touches based on sidebar state:
      // - If sidebar is closed: only from left edge (for opening)
      // - If sidebar is open: from anywhere (for closing)
      if (!openMobileRef.current) {
        // Sidebar closed: only allow touches from left edge
        if (e.touches[0].clientX <= MAX_EDGE_DISTANCE) {
          touchStartX.current = e.touches[0].clientX;
          touchStartY.current = e.touches[0].clientY;
        }
      } else {
        // Sidebar open: allow touches from anywhere
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current !== null) {
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) {
        resetTouch();
        return;
      }

      const horizontalDistance = touchEndX.current - touchStartX.current;
      const verticalDistance = Math.abs((touchEndY.current || 0) - (touchStartY.current || 0));

      // Check if it's a valid horizontal swipe (either direction)
      if (
        Math.abs(horizontalDistance) >= MIN_SWIPE_DISTANCE && // Swipe is long enough
        verticalDistance <= MAX_VERTICAL_DEVIATION // Not too much vertical movement
      ) {
        // Handle swipe direction based on current sidebar state
        if (isMobile) {
          if (horizontalDistance > 0 && !openMobileRef.current) {
            // Swipe right: Open sidebar if closed
            handleSetOpenMobile(true);
          } else if (horizontalDistance < 0 && openMobileRef.current) {
            // Swipe left: Close sidebar if open
            handleSetOpenMobile(false);
          }
        }
      }

      resetTouch();
    };

    const resetTouch = () => {
      touchStartX.current = null;
      touchStartY.current = null;
      touchEndX.current = null;
      touchEndY.current = null;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleSetOpenMobile]);

  return null;
}