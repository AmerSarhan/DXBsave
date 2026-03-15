'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'dxbsave_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        setFavorites(new Set(JSON.parse(raw)));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveFavorites = useCallback((newFavs: Set<string>) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavs]));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}
