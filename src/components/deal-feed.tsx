'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchX } from 'lucide-react';
import { useDeals } from '@/contexts/deals-context';
import { DealCard } from './deal-card';
import { Shimmer } from '@/components/ai-elements/shimmer';

const PAGE_SIZE = 24;

const FEED_LOADING = [
  'Scanning deals across 7 emirates...',
  'Pulling the freshest offers for you...',
  'Checking what Dubai has cooking...',
  'Loading 286+ verified deals...',
];

export function DealFeed() {
  const { filteredDeals, loading, error, retry, isStale, filters, clearFilters } = useDeals();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loadingText, setLoadingText] = useState(FEED_LOADING[0]);

  useEffect(() => {
    setLoadingText(FEED_LOADING[Math.floor(Math.random() * FEED_LOADING.length)]);
  }, []);

  // Reset pagination when filters change
  useEffect(() => { setVisible(PAGE_SIZE); }, [filters]);

  const visibleDeals = useMemo(() => filteredDeals.slice(0, visible), [filteredDeals, visible]);
  const hasMore = visible < filteredDeals.length;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <Shimmer className="text-sm" duration={1.5} spread={2}>{loadingText}</Shimmer>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white shadow-sm shadow-stone-200/60 overflow-hidden flex">
              <div className="w-14 shrink-0 bg-stone-100 animate-pulse" />
              <div className="flex-1 p-3.5 space-y-2">
                <div className="h-3.5 w-3/4 bg-stone-100 rounded animate-pulse" />
                <div className="h-2.5 w-1/2 bg-stone-50 rounded animate-pulse" />
                <div className="h-2.5 w-full bg-stone-50 rounded animate-pulse" />
                <div className="h-5 w-16 bg-stone-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SearchX className="w-12 h-12 mx-auto text-stone-200 mb-4" />
        <h2 className="text-lg font-semibold text-stone-800 mb-1">Something went wrong</h2>
        <p className="text-sm text-stone-400 mb-6">{error}</p>
        <button
          onClick={retry}
          className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredDeals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SearchX className="w-12 h-12 mx-auto text-stone-200 mb-4" />
        <h2 className="text-lg font-semibold text-stone-800 mb-1">No deals found</h2>
        <p className="text-sm text-stone-400 mb-6">
          {filters.search ? `No results for "${filters.search}"` : 'Try adjusting your filters'}
        </p>
        <button
          onClick={clearFilters}
          className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 active:scale-95 transition-all"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {isStale && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-600 text-center">
          Data may be outdated
        </div>
      )}

      <p className="text-[12px] text-stone-400 mb-3">
        {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="px-6 py-2.5 bg-white text-stone-600 rounded-xl text-sm font-medium shadow-sm shadow-stone-200/60 hover:bg-stone-100 active:scale-[0.97] transition-all touch-manipulation"
          >
            Show more deals ({filteredDeals.length - visible} remaining)
          </button>
        </div>
      )}

      <div className="mt-12 mb-8 text-center">
        <p className="text-[11px] text-stone-300">
          Deals compiled by <span className="text-stone-400 font-medium">Dom</span> from the{' '}
          <span className="text-stone-400 font-medium">Adtech Chat MENA</span> WhatsApp Group
        </p>
      </div>
    </div>
  );
}
