'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { SearchX, Sparkles, Flame, Gift, Clock, Zap } from 'lucide-react';
import Image from 'next/image';
import { useDeals } from '@/contexts/deals-context';
import { DealCard } from './deal-card';
import { DealDetail } from './deal-detail';
import { CATEGORIES } from '@/lib/constants';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { CategoryKey, AnyDeal } from '@/lib/types';
import {
  scoreDeals,
  rankSections,
  selectHeroDeals,
  DealWithScore,
} from '@/lib/feed-algorithm';

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
  { icon: Flame,    text: 'Free attractions ending soon — don\'t miss out', bg: 'bg-red-50', color: 'text-red-600' },
  { icon: Gift,     text: 'Delivery promo codes change weekly — check back often', bg: 'bg-emerald-50', color: 'text-emerald-700' },
];

// ── Stories-style "Right Now" bubbles (Instagram pattern) ──────────────────

const RING_COLOR: Record<string, string> = {
  expiring: 'ring-rose-500',
  trending: 'ring-orange-400',
  free:     'ring-emerald-500',
  top:      'ring-indigo-400',
};

const SIGNAL_LABEL: Record<string, string> = {
  expiring: '⏰',
  trending: '🔥',
  free:     '⚡',
  top:      '✨',
};

function HeroBubble({ deal, onOpen }: { deal: DealWithScore; onOpen: () => void }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<AnyDeal>(deal);
  const catImg = CATEGORY_IMAGES[deal.category];
  const reason = deal._heroReason || 'top';
  const ringCls = RING_COLOR[reason] || 'ring-stone-300';

  const handleOpen = () => {
    onOpen();
    setDetailOpen(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex flex-col items-center gap-1.5 shrink-0 w-[72px] active:scale-[0.92] transition-transform duration-[120ms] ease-out touch-manipulation"
      >
        {/* Circle with gradient ring — Instagram Stories style */}
        <div className={`relative w-[64px] h-[64px] rounded-full ring-[2.5px] ${ringCls} p-[3px]`}>
          <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center overflow-hidden">
            {catImg ? (
              <Image src={catImg} alt="" width={48} height={48} className="object-contain w-10 h-10" />
            ) : (
              <span className="text-[20px]">{SIGNAL_LABEL[reason]}</span>
            )}
          </div>
          {/* Signal dot */}
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] leading-none">
            {SIGNAL_LABEL[reason]}
          </span>
        </div>

        {/* Name — two lines max */}
        <span className="text-[11px] font-medium text-stone-700 text-center leading-tight line-clamp-2 w-full">
          {deal.name}
        </span>
      </button>
      <DealDetail deal={activeDeal} open={detailOpen} onClose={() => { setDetailOpen(false); setActiveDeal(deal); }} onChangeDeal={setActiveDeal} />
    </>
  );
}

// ── Main feed component ────────────────────────────────────────────────────

export function DealFeed() {
  const {
    filteredDeals, allDeals, loading, error, retry, isStale, filters, clearFilters, setCategory,
    trendingData, favoriteIds, feedMemory, markDealsAsSeen, recordCategoryTap, saveSectionOrder,
    recordTap,
  } = useDeals();

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loadingText] = useState(() => FEED_LOADING[Math.floor(Math.random() * FEED_LOADING.length)]);
  const seenRef = useRef<Set<string>>(new Set());

  // Freeze feedMemory at session start — scoring must not re-run on every
  // markDealsAsSeen/saveSectionOrder call (those cause infinite loops).
  // Update ref once when the real localStorage snapshot arrives (sessionSeed > 0).
  const stableFeedMemory = useRef(feedMemory);
  if (feedMemory.sessionSeed && !stableFeedMemory.current.sessionSeed) {
    stableFeedMemory.current = feedMemory;
  }

  useEffect(() => { setVisible(PAGE_SIZE); }, [filters]);

  const isFiltered = filters.category !== 'all' || filters.search.trim() !== '' || filters.emirate !== 'All';

  // ── Algorithm: score all deals (stable for the whole session) ─────────────
  const scoredDeals = useMemo(() => {
    if (!allDeals.length || !stableFeedMemory.current.sessionSeed) return [];
    return scoreDeals(allDeals, stableFeedMemory.current, trendingData, favoriteIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDeals, trendingData, favoriteIds]);

  // ── Ranked section order (only for unfiltered home view) ──────────────────
  const rankedSectionOrder = useMemo(() => {
    if (isFiltered || !stableFeedMemory.current.sessionSeed) return null;
    return rankSections(stableFeedMemory.current, trendingData, favoriteIds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFiltered, trendingData, favoriteIds]);

  // Save section order once (for next session's rotation penalty)
  const savedOrderRef = useRef(false);
  useEffect(() => {
    if (!rankedSectionOrder || savedOrderRef.current) return;
    savedOrderRef.current = true;
    saveSectionOrder(rankedSectionOrder);
  }, [rankedSectionOrder, saveSectionOrder]);

  // ── Home sections: scored deals grouped by ranked category order ──────────
  const homeSections = useMemo(() => {
    if (!rankedSectionOrder || !scoredDeals.length) return null;

    const scoredById = new Map(scoredDeals.map(d => [d.id, d as DealWithScore]));

    return rankedSectionOrder
      .map(cat => {
        const deals = filteredDeals
          .filter(d => d.category === cat)
          .map(d => scoredById.get(d.id) ?? ({ ...d, _score: 0, _signals: { urgency: 0, trending: 0, value: 0, novelty: 0, timeRelevance: 0, affinity: 0, salt: 0 }, _heroReason: null } as DealWithScore))
          .sort((a, b) => b._score - a._score);
        return { key: cat, deals };
      })
      .filter(s => s.deals.length > 0);
  }, [rankedSectionOrder, scoredDeals, filteredDeals]);

  // ── Hero "Right Now" deals ─────────────────────────────────────────────────
  const heroDeals = useMemo(() => {
    if (isFiltered || !scoredDeals.length) return [];
    return selectHeroDeals(scoredDeals, 5);
  }, [isFiltered, scoredDeals]);

  // ── Mark visible deals as seen (once per session per deal) ────────────────
  useEffect(() => {
    if (!homeSections) return;
    const toMark: string[] = [];
    for (const section of homeSections) {
      for (const deal of section.deals.slice(0, 6)) {
        if (!seenRef.current.has(deal.id)) {
          seenRef.current.add(deal.id);
          toMark.push(deal.id);
        }
      }
    }
    if (heroDeals.length) {
      for (const deal of heroDeals) {
        if (!seenRef.current.has(deal.id)) {
          seenRef.current.add(deal.id);
          toMark.push(deal.id);
        }
      }
    }
    if (toMark.length) markDealsAsSeen(toMark);
  }, [homeSections, heroDeals, markDealsAsSeen]);

  // ── Flat filtered view ─────────────────────────────────────────────────────
  const sortedFiltered = useMemo(() => {
    if (!isFiltered || !scoredDeals.length) return filteredDeals;
    const scoredById = new Map(scoredDeals.map(d => [d.id, d]));
    return [...filteredDeals].sort((a, b) => {
      const sa = scoredById.get(a.id)?._score ?? 0;
      const sb = scoredById.get(b.id)?._score ?? 0;
      return sb - sa;
    });
  }, [isFiltered, filteredDeals, scoredDeals]);

  const visibleFiltered = useMemo(() => sortedFiltered.slice(0, visible), [sortedFiltered, visible]);
  const hasMore = visible < sortedFiltered.length;

  // ── Loading ────────────────────────────────────────────────────────────────
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

  // ── Sectioned home view ────────────────────────────────────────────────────
  if (homeSections) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isStale && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-600 text-center">
            Data may be outdated
          </div>
        )}

        {/* ── Right Now — Stories-style bubbles ── */}
        {heroDeals.length >= 2 && (
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2.5 px-0.5">Right Now</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {heroDeals.map(deal => (
                <HeroBubble
                  key={deal.id}
                  deal={deal}
                  onOpen={() => { recordTap(deal.id); recordCategoryTap(deal.category); }}
                />
              ))}
              <div className="shrink-0 w-4" aria-hidden="true" />
            </div>
          </div>
        )}

        {/* ── Algorithm-ranked category sections ── */}
        {homeSections.map((section, sIdx) => {
          const config = CATEGORIES.find(c => c.key === section.key);
          const catImage = CATEGORY_IMAGES[section.key];
          const showDeals = section.deals.slice(0, 6);
          const tip = sIdx === 1 ? INLINE_TIPS[Math.floor(sIdx / 2) % INLINE_TIPS.length] : null;

          return (
            <div key={section.key}>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {showDeals.map(deal => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDetailOpen={() => {
                      recordTap(deal.id);
                      recordCategoryTap(deal.category);
                    }}
                  />
                ))}
              </div>

              {section.deals.length > 6 && (
                <button
                  onClick={() => setCategory(section.key)}
                  className="mt-2 mb-2 text-[12px] font-medium text-stone-500 hover:text-stone-700 transition-colors"
                >
                  View all {section.deals.length} {config?.label?.toLowerCase()} deals &rarr;
                </button>
              )}

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

  // ── Flat filtered view ─────────────────────────────────────────────────────
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
        {visibleFiltered.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            onOpen={() => {
              recordTap(deal.id);
              recordCategoryTap(deal.category);
            }}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            className="px-6 py-2.5 bg-white text-stone-600 rounded-xl text-sm font-medium shadow-sm shadow-stone-200/60 active:scale-[0.97] transition-transform duration-[160ms] touch-manipulation"
          >
            Show more ({sortedFiltered.length - visible} remaining)
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
