'use client';

import { SearchX } from 'lucide-react';
import { useDeals } from '@/contexts/deals-context';
import { DealCard } from './deal-card';
import { Skeleton } from '@/components/ui/skeleton';

export function DealFeed() {
  const { filteredDeals, loading, error, retry, isStale, filters, clearFilters } = useDeals();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SearchX className="w-12 h-12 mx-auto text-neutral-200 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-800 mb-1">Something went wrong</h2>
        <p className="text-sm text-neutral-400 mb-6">{error}</p>
        <button
          onClick={retry}
          className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredDeals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SearchX className="w-12 h-12 mx-auto text-neutral-200 mb-4" />
        <h2 className="text-lg font-semibold text-neutral-800 mb-1">No deals found</h2>
        <p className="text-sm text-neutral-400 mb-6">
          {filters.search ? `No results for "${filters.search}"` : 'Try adjusting your filters'}
        </p>
        <button
          onClick={clearFilters}
          className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all"
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

      <p className="text-[12px] text-neutral-400 mb-3">
        {filteredDeals.length} deal{filteredDeals.length !== 1 ? 's' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {/* Credits */}
      <div className="mt-12 mb-8 text-center">
        <p className="text-[11px] text-neutral-300">
          Deals compiled by <span className="text-neutral-400 font-medium">Dom</span> from the{' '}
          <span className="text-neutral-400 font-medium">Adtech Chat MENA</span> WhatsApp Group
        </p>
      </div>
    </div>
  );
}
