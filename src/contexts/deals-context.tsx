'use client';

import React, { createContext, useContext, useMemo, useCallback, useReducer } from 'react';
import { useSheetData } from '@/hooks/use-sheet-data';
import { useFavorites } from '@/hooks/use-favorites';
import { useTrending } from '@/hooks/use-trending';
import { useFeedMemory } from '@/hooks/use-feed-memory';
import type { FeedMemory, TrendingData } from '@/lib/feed-algorithm';
import {
  AnyDeal,
  SheetData,
  FilterState,
  SortOption,
  CategoryKey,
  MarketTip,
} from '@/lib/types';
import { getAllDeals } from '@/lib/sheets';
import { extractNumericPrice } from '@/lib/utils';

interface DealsState {
  filters: FilterState;
}

type DealsAction =
  | { type: 'SET_EMIRATE'; emirate: string }
  | { type: 'SET_CATEGORY'; category: CategoryKey | 'all' }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_SORT'; sort: SortOption }
  | { type: 'CLEAR_FILTERS' };

function reducer(state: DealsState, action: DealsAction): DealsState {
  switch (action.type) {
    case 'SET_EMIRATE':
      return { ...state, filters: { ...state.filters, emirate: action.emirate } };
    case 'SET_CATEGORY':
      return { ...state, filters: { ...state.filters, category: action.category } };
    case 'SET_SEARCH':
      return { ...state, filters: { ...state.filters, search: action.search } };
    case 'SET_SORT':
      return { ...state, filters: { ...state.filters, sort: action.sort } };
    case 'CLEAR_FILTERS':
      return { filters: { emirate: 'All', category: 'all', search: '', sort: 'default' } };
    default:
      return state;
  }
}

interface DealsContextValue {
  // Data
  rawData: SheetData;
  allDeals: AnyDeal[];
  filteredDeals: AnyDeal[];
  tips: MarketTip[];
  dealsByCategory: Record<CategoryKey, AnyDeal[]>;

  // Loading state
  loading: boolean;
  error: string | null;
  isStale: boolean;
  retry: () => void;
  refresh: () => void;

  // Filters
  filters: FilterState;
  setEmirate: (emirate: string) => void;
  setCategory: (category: CategoryKey | 'all') => void;
  setSearch: (search: string) => void;
  setSort: (sort: SortOption) => void;
  clearFilters: () => void;

  // Favorites
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  favoriteDeals: AnyDeal[];

  // Helpers
  getDealBySlug: (slug: string) => AnyDeal | undefined;
  getRelatedDeals: (deal: AnyDeal) => AnyDeal[];
  getCategoryCount: (category: CategoryKey) => number;

  // Trending
  recordTap: (dealId: string) => void;
  getTaps: (dealId: string) => number;
  isTrending: (dealId: string) => boolean;
  trendingData: TrendingData;

  // Feed memory (for algorithm)
  favoriteIds: Set<string>;
  feedMemory: FeedMemory;
  markDealsAsSeen: (ids: string[]) => void;
  recordCategoryTap: (category: string) => void;
  saveSectionOrder: (order: import('@/lib/types').CategoryKey[]) => void;
}

const DealsContext = createContext<DealsContextValue | null>(null);

export function DealsProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, isStale, refresh, retry } = useSheetData();
  const { toggleFavorite, isFavorite, favorites } = useFavorites();
  const { trending: trendingData, recordTap, getTaps, isTrending } = useTrending();
  const { memory: feedMemory, markDealsAsSeen, recordCategoryTap, saveSectionOrder } = useFeedMemory();

  const [state, dispatch] = useReducer(reducer, {
    filters: { emirate: 'All', category: 'all', search: '', sort: 'default' },
  });

  const allDeals = useMemo(() => getAllDeals(data), [data]);

  const dealsByCategory = useMemo(() => {
    const map = {} as Record<CategoryKey, AnyDeal[]>;
    const categories: CategoryKey[] = ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'];
    for (const cat of categories) {
      map[cat] = allDeals.filter(d => d.category === cat);
    }
    return map;
  }, [allDeals]);

  const filteredDeals = useMemo(() => {
    let deals = [...allDeals];
    const { emirate, category, search, sort } = state.filters;

    if (emirate !== 'All') {
      deals = deals.filter(d => d.emirate.toLowerCase().includes(emirate.toLowerCase()));
    }

    if (category !== 'all') {
      deals = deals.filter(d => d.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      deals = deals.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.offer.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        d.emirate.toLowerCase().includes(q) ||
        d.notes.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price-low':
        deals.sort((a, b) => extractNumericPrice(a.price) - extractNumericPrice(b.price));
        break;
      case 'expiring-soon':
        deals.sort((a, b) => {
          const aTime = a.expiresAt?.getTime() ?? Infinity;
          const bTime = b.expiresAt?.getTime() ?? Infinity;
          return aTime - bTime;
        });
        break;
    }

    return deals;
  }, [allDeals, state.filters]);

  const favoriteDeals = useMemo(
    () => allDeals.filter(d => favorites.has(d.id)),
    [allDeals, favorites]
  );

  const getDealBySlug = useCallback(
    (slug: string) => allDeals.find(d => d.slug === slug),
    [allDeals]
  );

  const getRelatedDeals = useCallback(
    (deal: AnyDeal) => {
      const others = allDeals.filter(d => d.id !== deal.id);
      // Best: same category + same emirate
      const best = others.filter(d => d.category === deal.category && d.emirate === deal.emirate);
      // Good: same category, different emirate
      const good = others.filter(d => d.category === deal.category && d.emirate !== deal.emirate);
      // OK: same emirate, different category
      const ok = others.filter(d => d.emirate === deal.emirate && d.category !== deal.category);
      return [...best, ...good, ...ok].slice(0, 6);
    },
    [allDeals]
  );

  const getCategoryCount = useCallback(
    (category: CategoryKey) => dealsByCategory[category]?.length ?? 0,
    [dealsByCategory]
  );

  const value: DealsContextValue = {
    rawData: data,
    allDeals,
    filteredDeals,
    tips: data.tips,
    dealsByCategory,
    loading,
    error,
    isStale,
    retry,
    refresh,
    filters: state.filters,
    setEmirate: (emirate) => dispatch({ type: 'SET_EMIRATE', emirate }),
    setCategory: (category) => dispatch({ type: 'SET_CATEGORY', category }),
    setSearch: (search) => dispatch({ type: 'SET_SEARCH', search }),
    setSort: (sort) => dispatch({ type: 'SET_SORT', sort }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
    toggleFavorite,
    isFavorite,
    favoriteDeals,
    getDealBySlug,
    getRelatedDeals,
    getCategoryCount,
    recordTap,
    getTaps,
    isTrending,
    trendingData,
    favoriteIds: favorites,
    feedMemory,
    markDealsAsSeen,
    recordCategoryTap,
    saveSectionOrder,
  };

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

export function useDeals() {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error('useDeals must be used within DealsProvider');
  return ctx;
}
