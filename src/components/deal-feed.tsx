'use client';

import { useState, useEffect, useMemo } from 'react';
import { SearchX, Sparkles, Flame, Gift } from 'lucide-react';
import Image from 'next/image';
import { useDeals } from '@/contexts/deals-context';
import { DealCard } from './deal-card';
import { CATEGORIES } from '@/lib/constants';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { CategoryKey } from '@/lib/types';

const PAGE_SIZE = 24;

const FEED_LOADING = [
  'Scanning deals across 7 emirates...',
  'Pulling the freshest offers for you...',
  'Checking what Dubai has cooking...',
  'Loading verified deals...',
];

const CATEGORY_IMAGES: Partial<Record<CategoryKey, string>> = {
  hotels: '/category/Hotels.png',
  dining: '/category/Dining.png',
  attractions: '/category/Attractions.png',
  delivery: '/category/Delivery.png',
  spa: '/category/Spa.png',
  shopping: '/category/shopping.png',
  eid: '/category/Eid.png',
};

const INLINE_TIPS = [
  { icon: Sparkles, text: 'Pro tip: Pool day passes are cheapest on weekdays', bg: 'bg-amber-50', color: 'text-amber-700' },
  { icon: Flame, text: 'Free attractions are ending soon — don\'t miss out', bg: 'bg-red-50', color: 'text-red-600' },
  { icon: Gift, text: 'Delivery promo codes change weekly — check back often', bg: 'bg-emerald-50', color: 'text-emerald-700' },
];

export function DealFeed() {
  const { filteredDeals, loading, error, retry, isStale, filters, clearFilters, setCategory } = useDeals();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loadingText, setLoadingText] = useState(FEED_LOADING[0]);

  useEffect(() => {
    setLoadingText(FEED_LOADING[Math.floor(Math.random() * FEED_LOADING.length)]);
  }, []);

  useEffect(() => { setVisible(PAGE_SIZE); }, [filters]);

  const visibleDeals = useMemo(() => filteredDeals.slice(0, visible), [filteredDeals, visible]);
  const hasMore = visible < filteredDeals.length;

  // Group deals by category for section headers (only when showing "all")
  const isFiltered = filters.category !== 'all' || filters.search.trim() !== '' || filters.emirate !== 'All';

  const sections = useMemo(() => {
    if (isFiltered) return null;

    const grouped: { key: CategoryKey; deals: typeof filteredDeals }[] = [];
    const categories: CategoryKey[] = ['hotels', 'dining', 'attractions', 'delivery', 'spa', 'shopping', 'eid'];

    for (const cat of categories) {
      const deals = filteredDeals.filter(d => d.category === cat);
      if (deals.length > 0) grouped.push({ key: cat, deals });
    }
    return grouped;
  }, [filteredDeals, isFiltered]);

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
        <button onClick={retry} className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform duration-[160ms]">
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
        <button onClick={clearFilters} className="px-5 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium active:scale-95 transition-transform duration-[160ms]">
          Clear Filters
        </button>
      </div>
    );
  }

  // Sectioned view (default, no filters)
  if (sections) {
    let totalShown = 0;
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isStale && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-600 text-center">
            Data may be outdated
          </div>
        )}

        {sections.map((section, sIdx) => {
          const config = CATEGORIES.find(c => c.key === section.key);
          const catImage = CATEGORY_IMAGES[section.key];
          const showDeals = section.deals.slice(0, 8);
          totalShown += showDeals.length;

          // Inline tip after second section
          const tip = sIdx === 1 ? INLINE_TIPS[Math.floor(sIdx / 2) % INLINE_TIPS.length] : null;

          return (
            <div key={section.key}>
              {/* Section header */}
              <div className="flex items-center gap-4 mt-8 mb-4 first:mt-2">
                {catImage && (
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-white shadow-sm shadow-stone-200/40 p-1.5">
                    <Image src={catImage} alt={config?.label || ''} width={56} height={56} className="object-contain w-full h-full" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-[18px] font-bold text-stone-900">{config?.label}</h2>
                  <p className="text-[12px] text-stone-400">{section.deals.length} deals available</p>
                </div>
              </div>

              {/* Deal grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {showDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>

              {section.deals.length > 8 && (
                <button
                  onClick={() => setCategory(section.key)}
                  className="mt-2 mb-2 text-[12px] font-medium text-stone-500 hover:text-stone-700 transition-colors"
                >
                  View all {section.deals.length} {config?.label?.toLowerCase()} deals &rarr;
                </button>
              )}

              {/* Inline tip */}
              {tip && (
                <div className={`mt-4 mb-2 flex items-center gap-2.5 px-4 py-3 rounded-xl ${tip.bg}`}>
                  <tip.icon className={`w-4 h-4 shrink-0 ${tip.color}`} />
                  <p className={`text-[12px] font-medium ${tip.color}`}>{tip.text}</p>
                </div>
              )}
            </div>
          );
        })}

        <Footer />
      </div>
    );
  }

  // Flat grid view (when filtered)
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
            className="px-6 py-2.5 bg-white text-stone-600 rounded-xl text-sm font-medium shadow-sm shadow-stone-200/60 active:scale-[0.97] transition-transform duration-[160ms] touch-manipulation"
          >
            Show more ({filteredDeals.length - visible} remaining)
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

function Footer() {
  const categories = [
    { key: 'hotels', label: 'Hotels' },
    { key: 'dining', label: 'Dining' },
    { key: 'attractions', label: 'Attractions' },
    { key: 'delivery', label: 'Delivery' },
    { key: 'spa', label: 'Spa & Wellness' },
    { key: 'shopping', label: 'Shopping' },
    { key: 'eid', label: 'Eid Specials' },
  ];
  const emirates = [
    { slug: 'dubai', label: 'Dubai' },
    { slug: 'abu-dhabi', label: 'Abu Dhabi' },
    { slug: 'sharjah', label: 'Sharjah' },
    { slug: 'ajman', label: 'Ajman' },
    { slug: 'ras-al-khaimah', label: 'Ras Al Khaimah' },
    { slug: 'fujairah', label: 'Fujairah' },
    { slug: 'umm-al-quwain', label: 'Umm Al Quwain' },
  ];

  return (
    <footer className="mt-12 mb-8 pt-6 border-t border-stone-100">
      <div className="grid grid-cols-2 gap-6 mb-8 px-1">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Categories</p>
          <div className="flex flex-col gap-1">
            {categories.map(c => (
              <a key={c.key} href={`/deals/${c.key}`} className="text-[12px] text-stone-400 hover:text-stone-700 transition-colors">{c.label}</a>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Emirates</p>
          <div className="flex flex-col gap-1">
            {emirates.map(e => (
              <a key={e.slug} href={`/deals/${e.slug}`} className="text-[12px] text-stone-400 hover:text-stone-700 transition-colors">{e.label}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-[13px] font-semibold text-stone-400">DXBSave</p>
        <p className="text-[11px] text-stone-300 leading-relaxed">
          Deals compiled by Dom from the Adtech Chat MENA WhatsApp Group.
          <br />
          Data updates live from Google Sheets. Always confirm with the venue before booking.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <a href="https://github.com/AmerSarhan/DXBsave" target="_blank" rel="noopener noreferrer" className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors">
            GitHub
          </a>
          <span className="w-1 h-1 rounded-full bg-stone-200" />
          <span className="text-[11px] text-stone-300">Made in the UAE</span>
        </div>
      </div>
    </footer>
  );
}
