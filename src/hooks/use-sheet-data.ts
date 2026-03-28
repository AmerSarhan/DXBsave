'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SheetData, CategoryKey } from '@/lib/types';
import { SHEET_GIDS } from '@/lib/constants';
import { PARSERS } from '@/lib/sheets';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'dxbsave_cache';

interface CachedData {
  data: SheetData;
  timestamp: number;
}

function loadCache(): CachedData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Rehydrate dates
    const categories: (keyof SheetData)[] = ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping'];
    for (const cat of categories) {
      const items = parsed.data[cat];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item.expiresAt) item.expiresAt = new Date(item.expiresAt);
        }
      }
    }
    return parsed as CachedData;
  } catch {
    return null;
  }
}

function saveCache(data: SheetData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage might be full
  }
}

const emptyData: SheetData = {
  hotels: [],
  dining: [],
  attractions: [],
  delivery: [],
  spa: [],
  shopping: [],
  tips: [],
};

export function useSheetData() {
  const [data, setData] = useState<SheetData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const fetchAllSheets = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);

    const keys = Object.keys(SHEET_GIDS) as (CategoryKey | 'tips')[];

    try {
      const results = await Promise.allSettled(
        keys.map(async (key) => {
          const gid = SHEET_GIDS[key];
          const res = await fetch(`/api/sheets/${gid}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const csv = await res.text();
          const parser = PARSERS[key];
          return { key, data: parser(csv) };
        })
      );

      const newData = { ...emptyData };
      let anySuccess = false;

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { key, data: parsed } = result.value;
          (newData as Record<string, unknown>)[key] = parsed;
          anySuccess = true;
        }
      }

      if (anySuccess) {
        setData(newData);
        saveCache(newData);
        lastFetchRef.current = Date.now();
        setIsStale(false);
      } else {
        // All failed — try cache
        const cached = loadCache();
        if (cached) {
          setData(cached.data);
          setIsStale(true);
        } else {
          setError("Couldn't load deals right now. Please check your connection.");
        }
      }
    } catch {
      const cached = loadCache();
      if (cached) {
        setData(cached.data);
        setIsStale(true);
      } else {
        setError("Couldn't load deals right now. Please check your connection.");
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    const elapsed = Date.now() - lastFetchRef.current;
    if (elapsed > STALE_TIME) {
      fetchAllSheets(true);
    }
  }, [fetchAllSheets]);

  useEffect(() => {
    // Try cache first for instant display
    const cached = loadCache();
    if (cached && Date.now() - cached.timestamp < STALE_TIME) {
      setData(cached.data);
      setLoading(false);
      lastFetchRef.current = cached.timestamp;
      // Still fetch fresh data in background
      fetchAllSheets(true);
    } else if (cached) {
      setData(cached.data);
      setLoading(false);
      setIsStale(true);
      fetchAllSheets(true);
    } else {
      fetchAllSheets();
    }
  }, [fetchAllSheets]);

  return { data, loading, error, isStale, refresh, retry: () => fetchAllSheets() };
}
