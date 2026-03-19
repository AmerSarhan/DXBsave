'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedMemory, getDefaultMemory } from '@/lib/feed-algorithm';
import type { CategoryKey } from '@/lib/types';

const MEMORY_KEY = 'dxbsave_feed_v2';
const SEEN_DECAY_DAYS = 7;

export function useFeedMemory() {
  const [memory, setMemory] = useState<FeedMemory>(getDefaultMemory);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      const base = getDefaultMemory();

      if (raw) {
        const stored: FeedMemory = JSON.parse(raw);
        const daysSince = (Date.now() - (stored.lastVisit || 0)) / 864e5;

        // Decay seen counts after a week so old users get fresh novelty
        if (daysSince > SEEN_DECAY_DAYS) {
          stored.seenDeals = {};
        } else {
          // Halve all seen counts every 3 days — gradual decay
          if (daysSince > 3) {
            for (const id in stored.seenDeals) {
              stored.seenDeals[id] = Math.floor(stored.seenDeals[id] / 2);
              if (stored.seenDeals[id] <= 0) delete stored.seenDeals[id];
            }
          }
        }

        base.seenDeals     = stored.seenDeals || {};
        base.categoryTaps  = stored.categoryTaps || {};
        base.sectionOrder  = stored.sectionOrder || base.sectionOrder;
        base.visitCount    = (stored.visitCount || 0) + 1;
        // Always fresh session seed on new page load
        base.sessionSeed   = Math.floor(Math.random() * 0xffffffff);
        base.lastVisit     = Date.now();
      } else {
        base.visitCount = 1;
      }

      localStorage.setItem(MEMORY_KEY, JSON.stringify(base));
      setMemory(base);
    } catch {
      // ignore — use default
    }
  }, []);

  // Persist-only helpers — write to localStorage without triggering re-renders.
  // The feed component freezes memory at session start so mid-session updates
  // must NOT cause re-scoring (that causes infinite loops + constant reshuffling).

  const markDealsAsSeen = useCallback((dealIds: string[]) => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (!raw) return;
      const stored: FeedMemory = JSON.parse(raw);
      for (const id of dealIds) stored.seenDeals[id] = (stored.seenDeals[id] || 0) + 1;
      localStorage.setItem(MEMORY_KEY, JSON.stringify(stored));
    } catch {}
  }, []);

  const recordCategoryTap = useCallback((category: string) => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (!raw) return;
      const stored: FeedMemory = JSON.parse(raw);
      stored.categoryTaps[category] = (stored.categoryTaps[category] || 0) + 1;
      localStorage.setItem(MEMORY_KEY, JSON.stringify(stored));
    } catch {}
  }, []);

  const saveSectionOrder = useCallback((order: CategoryKey[]) => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (!raw) return;
      const stored: FeedMemory = JSON.parse(raw);
      stored.sectionOrder = order;
      localStorage.setItem(MEMORY_KEY, JSON.stringify(stored));
    } catch {}
  }, []);

  return { memory, markDealsAsSeen, recordCategoryTap, saveSectionOrder };
}
