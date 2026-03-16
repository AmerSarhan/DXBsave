'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrendingData {
  trending: Record<string, number>;
  topDeals: { id: string; taps: number }[];
}

export function useTrending() {
  const [data, setData] = useState<TrendingData>({ trending: {}, topDeals: [] });

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const recordTap = useCallback((dealId: string) => {
    // Fire and forget — don't block UX
    fetch('/api/trending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId }),
    }).catch(() => {});

    // Optimistic update
    setData(prev => ({
      ...prev,
      trending: { ...prev.trending, [dealId]: (prev.trending[dealId] || 0) + 1 },
    }));
  }, []);

  const getTaps = useCallback((dealId: string): number => {
    return data.trending[dealId] || 0;
  }, [data.trending]);

  const isTrending = useCallback((dealId: string): boolean => {
    return data.topDeals.some(d => d.id === dealId);
  }, [data.topDeals]);

  return { trending: data, recordTap, getTaps, isTrending };
}
