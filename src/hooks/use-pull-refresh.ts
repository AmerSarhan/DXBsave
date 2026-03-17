'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  enabled?: boolean;
}

export function usePullRefresh({ onRefresh, threshold = 80, enabled = true }: UsePullRefreshOptions) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    // Don't intercept if body scroll is locked (modal open)
    if (document.body.style.overflow === 'hidden') return;
    if (window.scrollY > 5) return;

    // Don't intercept touches inside scrollable panels
    const target = e.target as HTMLElement;
    if (target.closest('[data-deal-panel], [data-scrollable]')) return;

    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || refreshing) return;
    if (document.body.style.overflow === 'hidden') {
      isDragging.current = false;
      return;
    }
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY <= 0) {
      e.preventDefault();
      const damped = Math.min(diff * 0.4, 120);
      setPullDistance(damped);
      setPulling(damped > 10);
    } else {
      // User scrolled up or sideways — cancel pull
      isDragging.current = false;
      setPulling(false);
      setPullDistance(0);
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold * 0.5);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  return { pulling, refreshing, pullDistance };
}
